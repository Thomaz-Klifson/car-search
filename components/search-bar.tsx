"use client"

import type React from "react"

import { useState } from "react"
import { Search, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"

interface SearchBarProps {
  onSearch: (query: string) => void
  isLoading?: boolean
}

export function SearchBar({ onSearch, isLoading = false }: SearchBarProps) {
  const [query, setQuery] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      onSearch(query)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-3xl">
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-5">
          <Search className="h-5 w-5 text-muted-foreground" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ex: BYD Dolphin em São Paulo por até R$ 100.000"
          className="h-14 w-full rounded-xl border border-border bg-card pl-14 pr-32 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          disabled={isLoading}
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-2">
          <Button
            type="submit"
            disabled={isLoading || !query.trim()}
            className="h-10 gap-2 rounded-lg bg-primary px-6 font-semibold text-primary-foreground hover:bg-primary/90"
          >
            {isLoading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                Buscando
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Buscar
              </>
            )}
          </Button>
        </div>
      </div>
      <p className="mt-3 text-center text-sm text-muted-foreground">
        Busca inteligente com IA • Encontre o carro perfeito para você
      </p>
    </form>
  )
}
