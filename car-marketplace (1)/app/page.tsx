"use client"

import type React from "react"
import { ChatMessage } from "@/components/chat-message"
import { CarIcon, Send, Sparkles } from "lucide-react"
import { useRef, useEffect, useState } from "react"
import { gsap } from "gsap"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  toolResults?: any[]
}

export default function Home() {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)
  const heroRef = useRef<HTMLDivElement>(null)

  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [input, setInput] = useState("")

  useEffect(() => {
    if (headerRef.current) {
      gsap.from(headerRef.current, {
        y: -100,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out",
      })
    }

    if (heroRef.current && messages.length === 0) {
      gsap.from(heroRef.current.children, {
        y: 50,
        opacity: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: "power3.out",
        delay: 0.3,
      })
    }
  }, [messages.length])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      })

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "",
        toolResults: [],
      }

      setMessages((prev) => [...prev, assistantMessage])

      while (reader) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split("\n")

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6)
            if (data === "[DONE]") continue

            try {
              const parsed = JSON.parse(data)

              if (parsed.type === "tool_results") {
                assistantMessage.toolResults = parsed.data
                setMessages((prev) => {
                  const newMessages = [...prev]
                  newMessages[newMessages.length - 1] = { ...assistantMessage }
                  return newMessages
                })
              } else if (parsed.type === "text") {
                assistantMessage.content = parsed.data
                setMessages((prev) => {
                  const newMessages = [...prev]
                  newMessages[newMessages.length - 1] = { ...assistantMessage }
                  return newMessages
                })
              }
            } catch (e) {
              // Ignore parse errors
            }
          }
        }
      }
    } catch (error) {
      console.error("[v0] Error sending message:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    sendMessage(input)
  }

  const suggestedQueries = [
    "Procuro um BYD Dolphin em São Paulo por até R$ 100.000",
    "Quero um carro elétrico barato",
    "Tem algum SUV em Curitiba?",
    "Mostre carros até R$ 80.000",
  ]

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header ref={headerRef} className="border-b border-border bg-card/50 backdrop-blur-sm flex-shrink-0">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <CarIcon className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <span className="text-xl font-bold text-foreground">AutoFind AI</span>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Sparkles className="h-3 w-3" />
                <span>Assistente Inteligente</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 py-6 max-w-4xl">
          {messages.length === 0 ? (
            <div ref={heroRef} className="flex flex-col items-center justify-center min-h-[60vh] text-center">
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                <CarIcon className="h-10 w-10 text-primary" />
              </div>
              <h1 className="text-3xl font-bold text-foreground mb-3">Olá! Como posso ajudar?</h1>
              <p className="text-muted-foreground mb-8 max-w-md">
                Sou seu assistente especializado em carros. Conte-me o que você procura e vou encontrar as melhores
                opções para você!
              </p>

              <div className="grid gap-3 w-full max-w-2xl">
                <p className="text-sm font-medium text-muted-foreground mb-2">Experimente perguntar:</p>
                {suggestedQueries.map((query, index) => (
                  <button
                    key={index}
                    onClick={() => sendMessage(query)}
                    className="text-left px-4 py-3 rounded-lg border border-border bg-card hover:bg-accent/50 hover:border-primary/50 transition-all text-sm"
                  >
                    {query}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  role={message.role}
                  content={message.content}
                  toolResults={message.toolResults}
                />
              ))}

              {isLoading && (
                <div className="flex gap-3 justify-start">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-primary-foreground"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                      />
                    </svg>
                  </div>
                  <div className="bg-card border border-border rounded-2xl px-4 py-3">
                    <div className="flex gap-1">
                      <div
                        className="w-2 h-2 bg-primary rounded-full animate-bounce"
                        style={{ animationDelay: "0s" }}
                      />
                      <div
                        className="w-2 h-2 bg-primary rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      />
                      <div
                        className="w-2 h-2 bg-primary rounded-full animate-bounce"
                        style={{ animationDelay: "0.4s" }}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-border bg-card/50 backdrop-blur-sm flex-shrink-0">
        <div className="container mx-auto px-4 py-4 max-w-4xl">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Digite sua mensagem... (ex: Procuro um BYD Dolphin em São Paulo)"
              className="flex-1 px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Send className="h-5 w-5" />
              <span className="hidden sm:inline">Enviar</span>
            </button>
          </form>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Powered by Gemini 2.0 Flash • Busca inteligente com IA
          </p>
        </div>
      </div>
    </div>
  )
}
