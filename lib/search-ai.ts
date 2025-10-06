import { generateText } from "ai"

export interface Car {
  Name: string
  Model: string
  Image: string
  Price: number
  Location: string
}

export interface SearchResult {
  exactMatches: Car[]
  suggestions: Car[]
  message: string
  searchType: "exact" | "price-adjusted" | "location-adjusted" | "similar"
}

export async function intelligentCarSearch(query: string, cars: Car[]): Promise<SearchResult> {
  // Use AI to understand the search intent
  const { text } = await generateText({
    model: "openai/gpt-4o-mini",
    prompt: `You are a car search assistant. Extract the following information from this search query: "${query}"
    
    Return a JSON object with:
    - carName: the car name/brand mentioned (or null)
    - maxPrice: maximum price mentioned in BRL (or null)
    - location: city/location mentioned (or null)
    - intent: brief description of what the user wants
    
    Only return the JSON, nothing else.`,
  })

  let searchParams
  try {
    searchParams = JSON.parse(text)
  } catch {
    searchParams = { carName: null, maxPrice: null, location: null }
  }

  // Search logic
  let exactMatches: Car[] = []
  let suggestions: Car[] = []
  let message = ""
  let searchType: SearchResult["searchType"] = "exact"

  // Case 1: Exact match
  if (searchParams.carName) {
    exactMatches = cars.filter((car) => {
      const nameMatch = car.Name.toLowerCase().includes(searchParams.carName.toLowerCase())
      const priceMatch = searchParams.maxPrice ? car.Price <= searchParams.maxPrice : true
      const locationMatch = searchParams.location
        ? car.Location.toLowerCase().includes(searchParams.location.toLowerCase())
        : true

      return nameMatch && priceMatch && locationMatch
    })
  }

  // Case 2: Car exists but price is too low
  if (exactMatches.length === 0 && searchParams.carName) {
    const carsByName = cars.filter((car) => car.Name.toLowerCase().includes(searchParams.carName.toLowerCase()))

    if (carsByName.length > 0 && searchParams.maxPrice) {
      const cheapestMatch = carsByName.sort((a, b) => a.Price - b.Price)[0]
      if (cheapestMatch.Price > searchParams.maxPrice) {
        suggestions = carsByName.slice(0, 3)
        message = `Encontramos ${searchParams.carName}, mas o preço mínimo é R$ ${cheapestMatch.Price.toLocaleString("pt-BR")}. Confira as opções disponíveis:`
        searchType = "price-adjusted"
      }
    }

    // Case 3: Car exists but in different location
    if (suggestions.length === 0 && searchParams.location) {
      const carsInOtherLocations = carsByName.filter(
        (car) => !car.Location.toLowerCase().includes(searchParams.location.toLowerCase()),
      )
      if (carsInOtherLocations.length > 0) {
        suggestions = carsInOtherLocations.slice(0, 3)
        message = `${searchParams.carName} não disponível em ${searchParams.location}. Veja opções em outras cidades:`
        searchType = "location-adjusted"
      }
    }
  }

  // Case 4: Similar cars in price range
  if (exactMatches.length === 0 && suggestions.length === 0) {
    if (searchParams.maxPrice) {
      suggestions = cars
        .filter((car) => Math.abs(car.Price - searchParams.maxPrice) < 50000)
        .sort((a, b) => Math.abs(a.Price - searchParams.maxPrice) - Math.abs(b.Price - searchParams.maxPrice))
        .slice(0, 6)
      message = `Confira estas opções próximas ao seu orçamento de R$ ${searchParams.maxPrice.toLocaleString("pt-BR")}:`
      searchType = "similar"
    } else {
      suggestions = cars.slice(0, 6)
      message = "Confira nossas opções disponíveis:"
      searchType = "similar"
    }
  }

  if (exactMatches.length > 0) {
    message = `Encontramos ${exactMatches.length} ${exactMatches.length === 1 ? "resultado" : "resultados"} para sua busca!`
  }

  return {
    exactMatches,
    suggestions,
    message,
    searchType,
  }
}
