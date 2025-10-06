"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { SlidersHorizontal, X } from "lucide-react"
import type { Car } from "@/lib/search-ai"

interface FiltersProps {
  cars: Car[]
  onFilterChange: (filtered: Car[]) => void
}

export function Filters({ cars, onFilterChange }: FiltersProps) {
  const [showFilters, setShowFilters] = useState(false)
  const [maxPrice, setMaxPrice] = useState<number | null>(null)
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null)

  const locations = Array.from(new Set(cars.map((car) => car.Location))).sort()

  const applyFilters = () => {
    let filtered = [...cars]

    if (maxPrice) {
      filtered = filtered.filter((car) => car.Price <= maxPrice)
    }

    if (selectedLocation) {
      filtered = filtered.filter((car) => car.Location === selectedLocation)
    }

    onFilterChange(filtered)
  }

  const clearFilters = () => {
    setMaxPrice(null)
    setSelectedLocation(null)
    onFilterChange(cars)
  }

  const hasActiveFilters = maxPrice !== null || selectedLocation !== null

  return (
    <div className="w-full">
      <Button onClick={() => setShowFilters(!showFilters)} variant="outline" className="gap-2">
        <SlidersHorizontal className="h-4 w-4" />
        Filtros
        {hasActiveFilters && (
          <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
            {(maxPrice ? 1 : 0) + (selectedLocation ? 1 : 0)}
          </span>
        )}
      </Button>

      {showFilters && (
        <div className="mt-4 rounded-xl border border-border bg-card p-6">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">Filtros</h3>
            {hasActiveFilters && (
              <Button
                onClick={clearFilters}
                variant="ghost"
                size="sm"
                className="gap-2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
                Limpar
              </Button>
            )}
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">Preço Máximo</label>
              <select
                value={maxPrice || ""}
                onChange={(e) => setMaxPrice(e.target.value ? Number(e.target.value) : null)}
                className="h-10 w-full rounded-lg border border-border bg-secondary px-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Todos os preços</option>
                <option value="75000">Até R$ 75.000</option>
                <option value="100000">Até R$ 100.000</option>
                <option value="150000">Até R$ 150.000</option>
                <option value="200000">Até R$ 200.000</option>
                <option value="300000">Até R$ 300.000</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">Localização</label>
              <select
                value={selectedLocation || ""}
                onChange={(e) => setSelectedLocation(e.target.value || null)}
                className="h-10 w-full rounded-lg border border-border bg-secondary px-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Todas as cidades</option>
                {locations.map((location) => (
                  <option key={location} value={location}>
                    {location}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Button onClick={applyFilters} className="mt-6 w-full bg-primary text-primary-foreground hover:bg-primary/90">
            Aplicar Filtros
          </Button>
        </div>
      )}
    </div>
  )
}
