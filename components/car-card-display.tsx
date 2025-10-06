"use client"

import { useEffect, useRef, useState } from "react"
import { gsap } from "gsap"
import { CarDetails } from "./car-details"

interface Car {
  Name: string
  Model: string
  Image: string
  Price: number
  Location: string
}

interface CarCardDisplayProps {
  cars: Car[]
}

export function CarCardDisplay({ cars }: CarCardDisplayProps) {
  const cardsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!cardsRef.current) return
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) return
    const cards = cardsRef.current.children
    gsap.from(cards, {
      opacity: 1,
      y: 30,
      scale: 0.95,
      duration: 0.55,
      stagger: 0.08,
      ease: 'power2.out'
    })
  }, [])

  if (!cars || cars.length === 0) return null

  return (
    <div ref={cardsRef} className="grid gap-4 my-4 sm:grid-cols-2">
      {cars.map((car, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-lg border border-border bg-card transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 hover:scale-[1.02]"
          onMouseEnter={(e) => {
            gsap.to(e.currentTarget, {
              y: -5,
              duration: 0.3,
              ease: "power2.out",
            })
          }}
          onMouseLeave={(e) => {
            gsap.to(e.currentTarget, {
              y: 0,
              duration: 0.3,
              ease: "power2.out",
            })
          }}
        >
          <FadeImage src={car.Image} alt={`${car.Name} ${car.Model}`} />
          <div className="p-4">
            <h3 className="font-semibold text-lg text-foreground">{car.Name}</h3>
            <p className="text-sm text-muted-foreground mb-3">Modelo {car.Model}</p>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-green-500">
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(car.Price)}
                </p>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  {car.Location}
                </p>
              </div>
            </div>
              <CarDetails car={car} />
          </div>
        </div>
      ))}
    </div>
  )
}

// Internal image component with graceful loading & fallback
function FadeImage({ src, alt }: { src: string; alt: string }) {
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)
  const displaySrc = !error && src ? src : '/placeholder.svg'
  return (
    <div className="relative aspect-video w-full overflow-hidden bg-muted">
      {!loaded && (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-muted/60 to-muted/30" />
      )}
      <img
        src={displaySrc}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => {
          setError(true)
          setLoaded(true)
          console.warn('[ImageFallback] Falha ao carregar imagem:', src)
        }}
        className={`h-full w-full object-cover transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
      />
    </div>
  )
}
