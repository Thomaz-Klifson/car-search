"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Calendar } from "lucide-react"
import type { Car } from "@/lib/search-ai"
import { CarDetails } from "@/components/car-details"
import { useState } from 'react'

interface CarCardProps {
  car: Car
  highlight?: boolean
}

export function CarCard({ car, highlight = false }: CarCardProps) {
  return (
    <Card
      className={`overflow-hidden transition-all hover:scale-[1.02] hover:shadow-xl ${
        highlight ? "ring-2 ring-primary" : ""
      }`}
    >
      <div className="relative aspect-video overflow-hidden bg-secondary">
        <CardImage src={car.Image} alt={`${car.Name} ${car.Model}`} />
        {highlight && <Badge className="absolute right-3 top-3 bg-primary text-primary-foreground">Melhor Match</Badge>}
      </div>
      <div className="p-5">
        <div className="mb-3 flex items-start justify-between">
          <div>
            <h3 className="text-xl font-bold text-foreground">{car.Name}</h3>
            <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{car.Model}</span>
            </div>
          </div>
        </div>
        <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span>{car.Location}</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Preço</p>
            <p className="text-2xl font-bold text-primary">R$ {car.Price.toLocaleString("pt-BR")}</p>
          </div>
          <CarDetails car={car} />
        </div>
      </div>
    </Card>
  )
}

function CardImage({ src, alt }: { src: string; alt: string }) {
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)
  const displaySrc = !error && src ? src : '/placeholder.svg'
  return (
    <>
      {!loaded && <div className="absolute inset-0 animate-pulse bg-muted" />}
      <img
        src={displaySrc}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => { setError(true); setLoaded(true); console.warn('[ImageFallback] Erro:', src) }}
        className={`h-full w-full object-cover transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
      />
    </>
  )
}
