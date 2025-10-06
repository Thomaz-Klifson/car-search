"use client"

import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription, DialogClose } from "./ui/dialog"
import { Badge } from "./ui/badge"
import { Calendar, MapPin } from "lucide-react"

interface Car {
  Name: string
  Model: string
  Image: string
  Price: number
  Location: string
}

interface CarDetailsProps {
  car: Car
}

export function CarDetails({ car }: CarDetailsProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="rounded-lg bg-primary px-6 py-2.5 font-semibold text-primary-foreground transition-colors hover:bg-primary/90">
          Ver Detalhes
        </button>
      </DialogTrigger>
      <DialogContent>
        <div className="flex flex-col gap-4">
          <div className="relative aspect-video overflow-hidden bg-muted rounded-md">
            <img src={car.Image || "/placeholder.svg"} alt={`${car.Name} ${car.Model}`} className="h-full w-full object-cover" />
          </div>
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-2xl font-bold">{car.Name}</h3>
              <p className="text-sm text-muted-foreground">Modelo: {car.Model}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-primary">R$ {car.Price.toLocaleString("pt-BR")}</p>
              <Badge className="mt-2">{car.Location}</Badge>
            </div>
          </div>

          <div className="space-y-2 text-sm text-muted-foreground">
            <p>Detalhes adicionais e observações podem ser colocados aqui.</p>
            <p>
              <MapPin className="inline-block mr-2" /> Localização: {car.Location}
            </p>
            <p>
              <Calendar className="inline-block mr-2" /> Modelo: {car.Model}
            </p>
          </div>

          <div className="flex items-center justify-end gap-2">
            <DialogClose asChild>
              <button className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-md hover:bg-primary/90">
                Fechar
              </button>
            </DialogClose>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
