import { GoogleGenerativeAI } from "@google/generative-ai"
import carsData from "@/data/cars.json"

// Maximum allowed duration for model operations (seconds)
export const maxDuration = 30

// IMPORTANT: Use a server-only environment variable for the Gemini key.
// Do NOT use NEXT_PUBLIC_ prefixed variables for secret keys because those
// are exposed to client bundles. Configure GEMINI_API_KEY in your deployment
// environment (Vercel, Netlify, Docker, etc) or locally in a .env that is
// not committed.
const apiKey = process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY?.toString() || ""

if (!apiKey) {
  // Fail early in server runtime so developers get a clear error rather than
  // returning incomplete responses to clients.
  throw new Error(
    "GEMINI_API_KEY environment variable is required. Set GEMINI_API_KEY on the server (do not use NEXT_PUBLIC_)."
  )
}

const genAI = new GoogleGenerativeAI(apiKey)

interface Message {
  role: "user" | "assistant"
  content: string
  toolResults?: any[]
}

// Helper: normalize various numeric inputs (number or formatted string) to a number
function toNumber(value: unknown): number | undefined {
  if (value == null) return undefined
  if (typeof value === "number") return Number.isFinite(value) ? value : undefined
  if (typeof value === "string") {
    // Remove currency symbols, spaces and thousands separators, convert comma decimal to dot
    const cleaned = value
      .replace(/\s/g, "")
      .replace(/[Rr]\$\s?/, "")
      .replace(/\./g, "")
      .replace(/,/, ".")
      .replace(/[^0-9.-]/g, "")
    const n = Number(cleaned)
    return Number.isFinite(n) ? n : undefined
  }
  return undefined
}

function searchCars(params: {
  name?: string
  location?: string
  maxPrice?: number | string
  minPrice?: number | string
}) {
  const maxPrice = toNumber((params as any).maxPrice)
  const minPrice = toNumber((params as any).minPrice)
  let results = [...carsData]

  if (params.name) {
    const searchTerm = params.name.toLowerCase()
    results = results.filter((car) => {
      const carName = car.Name.toLowerCase()
      const carModel = car.Model.toLowerCase()
      // Procura por correspondência exata primeiro
      if (carName.includes(searchTerm) || carModel.includes(searchTerm)) {
        return true
      }
      // Divide o termo de busca e verifica se todas as palavras estão presentes
      const searchWords = searchTerm.split(/\s+/)
      return searchWords.every(word => 
        carName.includes(word) || carModel.includes(word)
      )
    })
  }

  if (params.location) {
    const searchLocation = params.location.toLowerCase()
    results = results.filter((car) => car.Location.toLowerCase().includes(searchLocation))
  }

  if (typeof maxPrice === "number") {
    results = results.filter((car) => car.Price <= maxPrice)
  }

  if (typeof minPrice === "number") {
    results = results.filter((car) => car.Price >= minPrice)
  }

  results.sort((a, b) => a.Price - b.Price)

  return {
    found: results.length > 0,
    count: results.length,
    cars: results.slice(0, 5),
    allLocations: [...new Set(carsData.map((c) => c.Location))],
    priceRange: {
      min: Math.min(...carsData.map((c) => c.Price)),
      max: Math.max(...carsData.map((c) => c.Price)),
    },
  }
}

function getSimilarCars(params: { referenceCar: string; userBudget?: number }) {
  const searchTerm = params.referenceCar.toLowerCase()
  const userBudget = toNumber((params as any).userBudget)

  let similar = carsData.filter((car) => {
    const carName = car.Name.toLowerCase()
    const words = searchTerm.split(" ")
    return words.some((word) => carName.includes(word))
  })

  if (typeof userBudget === "number" && similar.length < 3) {
    const budgetRange = userBudget * 0.2
    const inBudget = carsData.filter((car) => Math.abs(car.Price - userBudget) <= budgetRange)
    similar = [...similar, ...inBudget]
  }

  similar = Array.from(new Set(similar.map((c) => JSON.stringify(c)))).map((c) => JSON.parse(c))

  return {
    found: similar.length > 0,
    count: similar.length,
    cars: similar.slice(0, 5),
  }
}
// Try to extract structured search params (name, location, price) from free-text queries
function parseUserQuery(text: string) {
  const lower = text.toLowerCase()
  // find location by checking known locations
  const allLocations = Array.from(new Set(carsData.map((c) => c.Location.toLowerCase())))
  const location = allLocations.find((loc) => lower.includes(loc))

  // find price like R$ 100.000 or 100000
  const priceMatch = text.match(/r\$\s?([0-9\.\,]+)/i)
  let maxPrice: number | undefined
  if (priceMatch) {
    maxPrice = toNumber(priceMatch[1])
  } else {
    // also try to find plain numbers preceded by até or ate
    const altMatch = text.match(/(?:até|ate)\s?r?\$?\s?([0-9\.\,]+)/i)
    if (altMatch) maxPrice = toNumber(altMatch[1])
  }

  // find name/model by matching known names/models from dataset
  let name: string | undefined
  const lowerText = lower
  
  // Primeiro tenta encontrar correspondência exata
  const exactMatch = carsData.find(c => 
    lowerText.includes(String(c.Name).toLowerCase() + " " + String(c.Model).toLowerCase())
  )
  
  if (exactMatch) {
    name = `${exactMatch.Name} ${exactMatch.Model}`
  } else {
    // Se não encontrar correspondência exata, procura por partes
    for (const c of carsData) {
      const n = String(c.Name).toLowerCase()
      const m = String(c.Model).toLowerCase()
      
      if ((n && lowerText.includes(n)) || (m && lowerText.includes(m))) {
        name = `${c.Name} ${c.Model}`
        break
      }
    }
  }

  return { name, location, maxPrice }
}
function suggestAlternatives(query:any) {
  // tenta expandir termos ou faixas
  const expanded = getSimilarCars({ referenceCar: query.name, userBudget: query.maxPrice })
  if (!expanded.found) {
    const raisedBudget = query.maxPrice * 1.2
    return searchCars({ ...query, maxPrice: raisedBudget })
  }
  return expanded
}
function humanizeResponse(text:any) {
  return text
    .replace(/Sinto muito/gi, "Vamos encontrar algo incrível!")
    .replace(/não encontrei/gi, "ainda não encontrei, mas tenho boas opções")
}


// The SDK expects a specific FunctionDeclaration shape. We cast to `any` here
// to keep the declaration simple in this example. For stricter typing, map
// these entries to the library's FunctionDeclaration types.
const tools = [
  {
    name: "searchCars",
    description:
      "Search for cars in the database based on name, model, price range, and location. Returns matching cars with details.",
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Car name or brand to search for",
        },
        location: {
          type: "string",
          description: "City or location where the car should be",
        },
        maxPrice: {
          type: "number",
          description: "Maximum price the user is willing to pay",
        },
        minPrice: {
          type: "number",
          description: "Minimum price range",
        },
      },
    },
  },
  {
    name: "getSimilarCars",
    description: "Get similar car recommendations when exact match is not found. Useful for suggesting alternatives.",
    parameters: {
      type: "object",
      properties: {
        referenceCar: {
          type: "string",
          description: "The car name the user was looking for",
        },
        userBudget: {
          type: "number",
          description: "User budget if mentioned",
        },
      },
      required: ["referenceCar"],
    },
  },
] as any

export async function POST(req: Request) {
  const { messages }: { messages: Message[] } = await req.json()

  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    tools: [{ functionDeclarations: tools }],
  })

  // The SDK accepts system content as a `Content` object. Provide role and parts
  // so TypeScript matches the expected shape.
  const systemInstruction = {
    role: "system",
    parts: [
      {
        text: `
 Você é um consultor automotivo especialista em vendas de carros no Brasil. Seu trabalho é convencer de forma honesta e ética — guiando o usuário desde a descoberta até a ação (ex: agendar test drive, ver anúncio, solicitar contato).

 OBJETIVO:
- Encontrar rapidamente opções relevantes e conduzir o usuário a um próximo passo prático.

 PERSONALIDADE:
- Confiante, persuasivo e empático. Use linguagem clara, calorosa e orientada a benefícios.
- Mostre autoridade com dados simples (ex: economia estimada, principais diferencias), mas não invente informações.

 TÉCNICAS DE PERSUASÃO (use com parcimônia e honestidade):
 1) Benefícios primeiro: explique "o que ganha" (economia, conforto, segurança) antes de falar atributos técnicos.
 2) Prova social: quando possível, mencionar que "outros compradores têm preferido" ou que "é um modelo popular" (apenas se for verdadeiro/geral).
 3) Escassez/urgência sutil: "vagas limitadas" ou "anúncio recente" se aplicável — não afirme prazos falsos.
 4) Comparação positiva: mostre alternativas e posicione a opção como a melhor para certas necessidades.
 5) CTA claro: sempre termine com um convite de ação (ex: "Quer que eu agende um test drive?", "Posso enviar o contato do vendedor?").

 ESTILO DE VENDA PRÁTICO:
- Reforce valor mesmo se o preço for maior ("custo-benefício", "economia a longo prazo", "tecnologia embarcada").
- Seja entusiasta: frases curtas e impactantes como "Excelente escolha!" ou "Ótima opção para quem busca...".
- Ofereça alternativas em formato de lista curta (2–3 opções) com motivo claro para cada uma.

 FORMATAÇÃO E REGRAS:
- Sempre formate preços como R$ 120.000,00.
- Mencione localização e marca.
- Mostre resultados de busca antes de qualquer recomendação (use as ferramentas de busca / fallback).
- Sempre pergunte algo no final para iniciar um próximo passo (agendar, ver mais, ajustar filtros).

 EXEMPLOS DE CTAs:
- "Quer que eu agende um test drive para este modelo?"
- "Deseja que eu filtre só carros com garantia estendida?"
- "Posso conectar você com o vendedor para negociar um desconto?"

 IMPORTANTE: Seja persuasivo, mas não engane. Não diga que um carro tem recursos que não constam nos dados. Se não tiver confiança sobre algo, ofereça verificar com o vendedor.
`,

      },
    ],
  }

  const history = messages.slice(0, -1).map((msg) => ({
    role: msg.role === "user" ? "user" : "model",
    parts: [{ text: msg.content }],
  }))

  const chat = model.startChat({
    history,
    systemInstruction,
  })

  const userMessage = messages[messages.length - 1].content

  // 🔍 Se for a primeira interação do usuário, tente buscar carros imediatamente
  if (messages.length === 1) {
    try {
      const initialSearch = searchCars({ name: userMessage })
      if (initialSearch && initialSearch.cars && initialSearch.cars.length > 0) {

        // envia o resultado inicial antes da resposta textual
        const normalizedInitial = initialSearch.cars.map((c: any) => {
          const imageUrl = c.Image || c.image || c.imageUrl || null
          return {
            ...c,
            Image: imageUrl,
            image: imageUrl,
            formattedPrice: `R$ ${c.Price.toLocaleString("pt-BR", {
              minimumFractionDigits: 2,
            })}`,
          }
        })

        const encoder = new TextEncoder()
        const initStream = JSON.stringify({
          type: "tool_results",
          data: [{ cars: normalizedInitial }],
        })

        // cria um stream inicial rápido com os resultados
        const initialResponse = new ReadableStream({
          start(controller) {
            controller.enqueue(encoder.encode(`data: ${initStream}\n\n`))
            controller.enqueue(encoder.encode("data: [DONE]\n\n"))
            controller.close()
          },
        })

        return new Response(initialResponse, {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
          },
        })
      }
    } catch (e) {
      console.warn("[chat] initialSearch error:", e)
    }
  }

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      try {
        let result = await chat.sendMessage(userMessage)
        let response = result.response

        const toolResults: any[] = []
        const maxIterations = 5
        let iteration = 0

        while (
          typeof response.functionCalls === "function" &&
          response.functionCalls() &&
          iteration < maxIterations
        ) {
          iteration++
          const functionCalls = response.functionCalls() || []

          const functionResponses = functionCalls.map((call: any) => {
            // Ensure args are an object (the SDK may return a JSON string)
            let args: any = call.args
            if (typeof args === "string") {
              try {
                args = JSON.parse(args)
              } catch (e) {
                args = {}
              }
            }

            let functionResult
            if (call.name === "searchCars") {
              functionResult = searchCars(args)
            } else if (call.name === "getSimilarCars") {
              functionResult = getSimilarCars(args)
            } else {
              functionResult = { error: "Unknown function" }
            }

            toolResults.push(functionResult)

            return {
              functionResponse: {
                name: call.name,
                response: functionResult,
              },
            }
          })

          result = await chat.sendMessage(functionResponses)
          response = result.response
        }

        // (restante do seu código continua igual...)


        // If the model didn't call any tools, run a lightweight local
        // fallback search so we always return car results (including
        // the `Image` links present in `cars.json`). This ensures the
        // client always receives images in every situation.
        if (toolResults.length === 0) {
          try {
            const parsed = parseUserQuery(userMessage)
            const fallbackSearch = searchCars({ name: parsed.name, location: parsed.location, maxPrice: parsed.maxPrice })
            if (fallbackSearch && fallbackSearch.cars && fallbackSearch.cars.length > 0) {
              toolResults.push(fallbackSearch)
            } else {
              const fallbackSimilar = getSimilarCars({ referenceCar: parsed.name || userMessage, userBudget: parsed.maxPrice })
              if (fallbackSimilar && fallbackSimilar.cars && fallbackSimilar.cars.length > 0) {
                toolResults.push(fallbackSimilar)
              } else {
                // If still nothing, try the more aggressive suggestion expansion
                try {
                  const alt = suggestAlternatives({ name: parsed.name || userMessage, maxPrice: parsed.maxPrice })
                  if (alt && alt.cars && alt.cars.length > 0) {
                    toolResults.push(alt)
                  }
                } catch (e) {
                  // ignore
                }
              }
            }
          } catch (e) {
            // Ignore fallback errors — we'll still send the assistant text.
          }
        }

        if (toolResults.length > 0) {


          // Normalize car objects so the frontend always finds an image
          const normalized = toolResults.map((res: any) => {
            if (res && Array.isArray(res.cars)) {
              const cars = res.cars.map((c: any) => {
                const imageUrl = c.Image || c.image || c.imageUrl || null
                return {
                  ...c,
                  Image: imageUrl,
                  image: imageUrl,
                }
              })

              return { ...res, cars }
            }
            return res
          })

          // TEMP LOG: print normalized results
          try {
            console.log("[chat] normalized toolResults:", JSON.stringify(normalized, null, 2))
          } catch (e) {
            console.log("[chat] normalized toolResults (unserializable):", normalized)
          }

          const toolData = JSON.stringify({ type: "tool_results", data: normalized })
          controller.enqueue(encoder.encode(`data: ${toolData}\n\n`))
        }

  // Post-process assistant text to be more user-friendly
  const rawText = response.text()
  const text = humanizeResponse(rawText)
  const textData = JSON.stringify({ type: "text", data: text })
        controller.enqueue(encoder.encode(`data: ${textData}\n\n`))

        controller.enqueue(encoder.encode("data: [DONE]\n\n"))
        controller.close()
      } catch (error) {
        console.error("[v0] Error in chat:", error)
        controller.error(error)
      }
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  })
}
