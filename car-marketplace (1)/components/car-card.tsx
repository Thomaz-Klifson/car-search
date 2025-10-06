import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Calendar } from "lucide-react"
import type { Car } from "@/lib/search-ai"

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
        <img
          src={car.Image || "/placeholder.svg"}
          alt={`${car.Name} ${car.Model}`}
          className="h-full w-full object-cover"
        />
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
          <button className="rounded-lg bg-primary px-6 py-2.5 font-semibold text-primary-foreground transition-colors hover:bg-primary/90">
            Ver Detalhes
          </button>
        </div>
      </div>
    </Card>
  )
}
