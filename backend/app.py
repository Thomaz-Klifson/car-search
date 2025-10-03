# app.py
import os, json, time, requests
from typing import Optional
from fastapi import FastAPI
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
import faiss
import numpy as np

# Optional OpenAI - se quiser usar LLM remoto para gerar respostas (RAG)
USE_OPENAI = bool(os.getenv("OPENAI_API_KEY"))
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")  # exemplo, troque se desejar

if USE_OPENAI:
    import openai
    openai.api_key = os.getenv("OPENAI_API_KEY")

# optional n8n webhook to log events (set N8N_WEBHOOK_URL env var)
N8N_WEBHOOK = os.getenv("N8N_WEBHOOK_URL")

# load FAISS index and metadata
INDEX_PATH = os.getenv("INDEX_PATH", "cars.index")
META_PATH = os.getenv("META_PATH", "cars_meta.json")

print("Loading index:", INDEX_PATH)
index = faiss.read_index(INDEX_PATH)
with open(META_PATH, "r", encoding="utf-8") as f:
    cars = json.load(f)
print("Loaded cars:", len(cars))

# sentence transformer model (same used to build index)
embed_model = SentenceTransformer("all-MiniLM-L6-v2")

app = FastAPI(title="Car Search + Chat (RAG)")

def embed_text(texts):
    return embed_model.encode(texts, convert_to_numpy=True)

def log_event(payload):
    # tries n8n webhook if configured
    try:
        if N8N_WEBHOOK:
            requests.post(N8N_WEBHOOK, json=payload, timeout=5)
    except Exception as e:
        print("Failed to send to n8n:", e)

class SearchQuery(BaseModel):
    q: Optional[str] = ""
    k: Optional[int] = 5
    location: Optional[str] = None
    minPrice: Optional[float] = None
    maxPrice: Optional[float] = None

@app.post("/search")
def search(qobj: SearchQuery):
    q = (qobj.q or "").strip()
    k = qobj.k or 5

    # embed + retrieve when q provided (semantic search)
    if q:
        qe = embed_text([q])
        D, I = index.search(qe, k)
        results = []
        for dist, idx in zip(D[0], I[0]):
            item = cars[idx].copy()
            item["score"] = float(dist)
            results.append(item)
    else:
        # if no query, return top-k by price ascending as default
        results = sorted(cars, key=lambda x: x.get("Price", 1e12))[:k]

    # apply filters if present
    if qobj.location:
        results = [r for r in results if r.get("Location","").lower() == qobj.location.lower()]
    if qobj.minPrice:
        results = [r for r in results if r.get("Price") is not None and r["Price"] >= float(qobj.minPrice)]
    if qobj.maxPrice:
        results = [r for r in results if r.get("Price") is not None and r["Price"] <= float(qobj.maxPrice)]

    # fallback suggestion: if no results, suggest closest by price
    if len(results) == 0 and qobj.maxPrice:
        try:
            target = float(qobj.maxPrice)
            results = sorted(cars, key=lambda a: abs((a.get("Price") or 0) - target))[:5]
        except:
            pass

    # log event (non-blocking best-effort)
    try:
        log_event({
            "type": "search",
            "query": q,
            "filters": {"location": qobj.location, "minPrice": qobj.minPrice, "maxPrice": qobj.maxPrice},
            "resultCount": len(results),
            "ts": int(time.time())
        })
    except Exception as e:
        print("log error", e)

    return {"results": results}

class ChatQuery(BaseModel):
    message: str
    k: Optional[int] = 5

@app.post("/chat")
def chat(c: ChatQuery):
    user_message = c.message
    k = c.k or 5

    # embed + retrieve top-k
    q_emb = embed_text([user_message])
    D, I = index.search(q_emb, k)
    retrieved = []
    for j, idx in enumerate(I[0]):
        item = cars[idx].copy()
        item["score"] = float(D[0][j])
        retrieved.append(item)

    # Format context
    context_lines = []
    for r in retrieved:
        price = r.get("Price")
        price_str = f"R${int(price):,}".replace(",", ".") if price else "N/A"
        context_lines.append(f"- {r.get('Name')} {r.get('Model')} — {price_str} — {r.get('Location')}")

    context = "\n".join(context_lines)

    # If no OpenAI key -> return a templated answer
    if not USE_OPENAI:
        answer = f"Encontrei {len(retrieved)} veículos relevantes:\n{context}\n\nSe quiser, posso filtrar por cidade ou preço."
        log_event({"type":"chat","message":user_message,"answer":answer,"results_count":len(retrieved),"ts":int(time.time())})
        return {"answer": answer, "results": retrieved}

    # Build prompt for the LLM
    system_prompt = (
        "Você é um assistente conciso para busca de carros. Use os trechos abaixo (do inventário) para responder a intenção do usuário. "
        "Se o orçamento do usuário for menor que os preços disponíveis, sugira alternativas, negociações ou opções similares. "
        "Se o usuário pedir localidade, destaque veículos na localidade e, caso não haja, sugira alternativas em outras cidades com justificativa."
    )
    user_prompt = f"Inventário relevante:\n{context}\n\nUsuário: \"{user_message}\"\nResponda de forma objetiva (máx 200 palavras) e sugira 3 ações (ex: contatar vendedor, salvar alerta, ver similares)."

    # call OpenAI ChatCompletion (exemplo)
    try:
        resp = openai.ChatCompletion.create(
            model=OPENAI_MODEL,
            messages=[
                {"role":"system","content":system_prompt},
                {"role":"user","content":user_prompt}
            ],
            temperature=0.2,
            max_tokens=450,
        )
        answer = resp["choices"][0]["message"]["content"].strip()
    except Exception as e:
        answer = f"Erro ao acessar LLM: {e}. Exibindo resultados brutos:\n{context}"

    # log chat event
    log_event({"type":"chat","message":user_message,"answer":answer,"results_count":len(retrieved),"ts":int(time.time())})
    return {"answer": answer, "results": retrieved}
