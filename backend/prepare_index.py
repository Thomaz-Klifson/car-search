# backend/prepare_index.py
import json, re, os, argparse
from sentence_transformers import SentenceTransformer
import numpy as np
import faiss

def parse_price(p):
    # tua função de parse_price
    if p is None: return None
    if isinstance(p, (int,float)): return float(p)
    s=str(p).replace('R$','').replace('r$','').replace(' ','').replace('.','').replace(',','.')
    import re
    m=re.search(r'(\d+(\.\d+)?)',s)
    return float(m.group(1)) if m else None

def build_index(json_path, out_dir="data"):
    os.makedirs(out_dir,exist_ok=True)
    with open(json_path,'r',encoding='utf-8') as f:
        cars=json.load(f)
    for c in cars:
        c['Price']=parse_price(c.get('Price'))
        for k in ['Name','Model','Image','Location']:
            c.setdefault(k,"")
    texts=[f"{c['Name']} {c['Model']} {c['Location']} R${int(c['Price']) if c.get('Price') else ''}" for c in cars]
    model=SentenceTransformer('all-MiniLM-L6-v2')
    emb=model.encode(texts, show_progress_bar=True, convert_to_numpy=True)
    d=emb.shape[1]
    index=faiss.IndexFlatL2(d)
    index.add(emb)
    faiss.write_index(index, os.path.join(out_dir,'cars.index'))
    np.save(os.path.join(out_dir,'cars_emb.npy'), emb)
    with open(os.path.join(out_dir,'cars_meta.json'),'w',encoding='utf-8') as f:
        json.dump(cars,f,ensure_ascii=False)
    print("Saved index and metadata to", out_dir)

if __name__=="__main__":
    import sys
    if len(sys.argv) < 2:
        print("usage: python prepare_index.py path/to/cars.json")
    else:
        build_index(sys.argv[1])
