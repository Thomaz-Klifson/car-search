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
    results = results.filter((car) => car.Name.toLowerCase().includes(searchTerm))
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
    model: "gemini-2.0-flash-exp",
    tools: [{ functionDeclarations: tools }],
  })

  // The SDK accepts system content as a `Content` object. Provide role and parts
  // so TypeScript matches the expected shape.
  const systemInstruction = {
    role: "system",
    parts: [
      {
        text: `Você é um assistente especializado em vendas de carros no Brasil. Seu objetivo é ajudar usuários a encontrar o carro perfeito para suas necessidades.

PERSONALIDADE:
- Seja amigável, prestativo e entusiasmado
- Use linguagem natural e brasileira
- Seja persuasivo mas honesto
- Mostre empatia quando o carro exato não estiver disponível

ESTRATÉGIAS DE VENDA:
1. Quando o carro existe: Destaque os benefícios e características
2. Quando o preço é maior: Explique o valor agregado, ofereça financiamento, ou sugira modelos similares mais baratos
3. Quando a localização é diferente: Mencione possibilidade de entrega, ou mostre opções na cidade desejada

FORMATO DE RESPOSTA:
- Sempre use as ferramentas de busca antes de responder
- Apresente os carros de forma atrativa
- Inclua preço formatado em R$
- Mencione localização
- Faça perguntas para entender melhor as necessidades
- Seja proativo em oferecer alternativas

IMPORTANTE:
- SEMPRE formate preços como R$ 120.000,00
- Quando mostrar carros, mencione que eles aparecerão em cards visuais
- Pergunte sobre preferências: orçamento, localização, tipo de carro`,
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

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      try {
        let result = await chat.sendMessage(userMessage)
        let response = result.response

        const toolResults: any[] = []
        const maxIterations = 5
        let iteration = 0

        while (typeof response.functionCalls === "function" && response.functionCalls() && iteration < maxIterations) {
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

        if (toolResults.length > 0) {
          const toolData = JSON.stringify({ type: "tool_results", data: toolResults })
          controller.enqueue(encoder.encode(`data: ${toolData}\n\n`))
        }

        const text = response.text()
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
