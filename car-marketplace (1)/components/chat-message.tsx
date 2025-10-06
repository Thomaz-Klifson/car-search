"use client"

import { CarCardDisplay } from "./car-card-display"
import { useEffect, useRef } from "react"
import { gsap } from "gsap"

interface MessageProps {
  role: "user" | "assistant"
  content: string
  toolResults?: any[]
}

export function ChatMessage({ role, content, toolResults }: MessageProps) {
  const isUser = role === "user"
  const messageRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (messageRef.current) {
      gsap.from(messageRef.current, {
        opacity: 1,
        y: 20,
        duration: 0.5,
        ease: "power2.out",
      })
    }
  }, [])

  return (
    <div ref={messageRef} className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
          <svg className="w-5 h-5 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
        </div>
      )}
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          isUser ? "bg-primary text-primary-foreground" : "bg-card border border-border"
        }`}
      >
        <div className="prose prose-invert max-w-none">
          <p className="whitespace-pre-wrap text-sm leading-relaxed m-0">{content}</p>
        </div>

        {!isUser && toolResults && toolResults.length > 0 && (
          <div className="mt-3">
            {toolResults.map((result, index) => {
              if (result.cars && result.cars.length > 0) {
                return <CarCardDisplay key={index} cars={result.cars} />
              }
              return null
            })}
          </div>
        )}
      </div>
      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent flex items-center justify-center">
          <svg className="w-5 h-5 text-accent-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        </div>
      )}
    </div>
  )
}
