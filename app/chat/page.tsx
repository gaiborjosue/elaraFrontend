"use client"

import type React from "react"
import { useRef, useEffect, useState } from "react"
import { useChat } from "ai/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
// Removed Avatar, AvatarFallback, AvatarImage as they are replaced for the user icon
import { PlantInfoCard } from "@/components/plant-info-card"
import { SymptomPlantCarousel } from "@/components/symptom-plant-carousel"
import { RecipeCard } from "@/components/recipe-card"
import { SavedRecipesDrawer } from "@/components/saved-recipes-drawer"
import { ChevronDown, AlertCircle, SunIcon as Sunflower, User, BookOpen, Download, Info } from "lucide-react"
import ReactMarkdown from "react-markdown"
// Removed cn import as it's no longer used
import { SharedHeader } from "@/components/shared-header"
import { useAuth } from "@/context/auth-context"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"

interface PlantDetail {
  plantName: string
  scientificName: string
  medicalRating?: number
  edibleRating?: number
  edibleUses?: string
  plantImageURL?: string[]
  plantURL?: string
  partsUsed?: string
  cultivation?: string
  methodOfUse?: string
  recipe?: string
  benefits?: string
}

interface ToolResultOutput {
  output: Record<string, PlantDetail[]>
}

interface Recipe {
  recipeName: string
  ingredients: string[]
  instructions: string
}

interface RecipeToolResult {
  output: Recipe
}

interface SaveRecipeResult {
  success: boolean
  message: string
  recipeId?: string
}

interface SavedRecipesResult {
  savedRecipes: any[]
  count: number
  error?: string
}

interface PDFDownloadResult {
  success: boolean
  message: string
  downloadUrl?: string
  data?: {
    symptom: string
    recipeName: string
    ingredients: string[]
    instructions: string
  }
}

export default function ChatPage() {
  const { isAuthenticated, token, loading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isUserScrolling, setIsUserScrolling] = useState(false)
  const [savedRecipesOpen, setSavedRecipesOpen] = useState(false)
  const [isEdibleMode, setIsEdibleMode] = useState(false)

  // Helper functions for handling tool actions
  const handleSaveRecipe = async (recipe: Recipe, symptom: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8000'}/saveRecipe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          symptom,
          recipeName: recipe.recipeName,
          ingredients: recipe.ingredients,
          instructions: recipe.instructions,
        }),
      })

      if (response.ok) {
        toast({
          title: "Recipe saved",
          description: "Recipe has been saved to your collection.",
          duration: 3000,
        })
        return true
      } else {
        throw new Error('Failed to save recipe')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save recipe. Please try again.",
        variant: "destructive",
        duration: 3000,
      })
      return false
    }
  }

  const handleDownloadPDF = async (recipe: Recipe, symptom: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8000'}/downloadRecipePDF`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          symptom,
          recipeName: recipe.recipeName,
          ingredients: recipe.ingredients,
          instructions: recipe.instructions,
        }),
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${recipe.recipeName.replace(/\s+/g, '_')}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        
        toast({
          title: "PDF downloaded",
          description: "Recipe PDF has been downloaded.",
          duration: 3000,
        })
        return true
      } else {
        throw new Error('Failed to download PDF')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download PDF. Please try again.",
        variant: "destructive",
        duration: 3000,
      })
      return false
    }
  }

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/')
    }
  }, [isAuthenticated, loading, router])

  const { messages, input, handleInputChange, handleSubmit, isLoading, error } = useChat({
    api: "/api/chat",
    headers: {
      ...(token && { 'Authorization': `Bearer ${token}` }),
    },
    body: {
      edibleMode: isEdibleMode,
    },
    onResponse: () => setErrorMessage(null),
    onError: (err) => {
      console.error("Chat error:", err)
      setErrorMessage(err.message || "Something went wrong. Please try again.")
    },
    onFinish: () => {
      // After a message stream finishes, if the user wasn't actively scrolling away,
      // ensure they are at the bottom.
      if (!isUserScrolling && messagesContainerRef.current) {
        const { scrollHeight, clientHeight } = messagesContainerRef.current
        if (scrollHeight > clientHeight) {
          // Check if there's scrollable content
          scrollToBottom("auto")
        }
      }
    },
  })

  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [showScrollButton, setShowScrollButton] = useState(false)

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior })
    }
    // When programmatically scrolling to bottom (or via button),
    // hide the button and reset the user scrolling flag.
    setShowScrollButton(false)
    setIsUserScrolling(false)
  }

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!input.trim()) return
    setErrorMessage(null)
    setIsUserScrolling(false) // Reset before sending for auto-scroll
    handleSubmit(e)
  }

  useEffect(() => {
    const container = messagesContainerRef.current
    if (!container) return

    // Define the scroll event handler
    const scrollEventHandler = () => {
      const { scrollTop, scrollHeight, clientHeight } = container
      const atBottom = scrollHeight - scrollTop - clientHeight < 20 // Tolerance for being at bottom
      const canScroll = scrollHeight > clientHeight

      setShowScrollButton(canScroll && !atBottom)

      if (canScroll && !atBottom) {
        // User has scrolled away from the bottom
        setIsUserScrolling(true)
      } else if (atBottom) {
        // User is at the bottom (scrolled back or auto-scrolled)
        setIsUserScrolling(false)
      }
    }

    container.addEventListener("scroll", scrollEventHandler)

    // Logic to run when `messages` or `isUserScrolling` changes
    if (messages.length > 0) {
      if (!isUserScrolling) {
        // If not user-scrolling (e.g., new message, or user clicked scroll-to-bottom button),
        // then scroll to bottom. "auto" for quick scroll for new messages.
        scrollToBottom("auto")
      } else {
        // User IS scrolling (isUserScrolling is true). Don't auto-scroll.
        // Just update button visibility based on current scroll state,
        // as new messages might have changed scrollHeight.
        const { scrollTop, scrollHeight, clientHeight } = container
        const atBottom = scrollHeight - scrollTop - clientHeight < 20
        const canScroll = scrollHeight > clientHeight
        setShowScrollButton(canScroll && !atBottom)
      }
    } else {
      // No messages, ensure button is hidden and scrolling state is reset
      setShowScrollButton(false)
      setIsUserScrolling(false)
    }

    return () => {
      container.removeEventListener("scroll", scrollEventHandler)
    }
  }, [messages, isUserScrolling])

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-earth-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render the chat if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SharedHeader pageType="chat" />

      <div className="max-w-4xl mx-auto h-[calc(100vh-80px)] flex flex-col relative">
        {errorMessage && (
          <div className="p-4">
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex items-start">
              <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Error</p>
                <p className="text-sm">{errorMessage}</p>
                <p className="text-sm mt-1">Please try refreshing the page or check your connection.</p>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-6">
          {messages.length === 0 && (
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-earth-100 text-earth-600 rounded-full flex items-center justify-center flex-shrink-0">
                <Sunflower className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="text-sm text-earth-600 font-medium mb-1">Elara</div>
                <div className="px-4 py-2 max-w-md">
                  <p className="text-gray-800">
                    Hello! I'm Elara, your guide to natural herbal remedies. How can I assist you today?
                  </p>
                </div>
              </div>
            </div>
          )}

          {messages.map((message) => {
            const hasToolResults =
              message.role === "assistant" &&
              message.toolInvocations?.some((ti) => ti.state === "result")
            return (
              <div key={message.id} data-role={message.role}>
                {message.role === "user" ? (
                  <div className="flex items-start justify-end space-x-3">
                    <div className="flex-1 flex justify-end">
                      <div className="bg-earth-600 text-white rounded-2xl rounded-tr-md px-4 py-2 max-w-md">
                        <p>{message.content}</p>
                      </div>
                    </div>
                    <div className="w-8 h-8 bg-gray-200 text-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="h-5 w-5" />
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-earth-100 text-earth-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <Sunflower className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm text-earth-600 font-medium mb-1">Elara</div>
                      <div className="px-4 py-2 max-w-md">
                        {message.content ? (
                          <div className="markdown-content text-gray-800">
                            <ReactMarkdown
                              components={{
                                h1: ({ node, ...props }) => (
                                  <h1 className="text-xl font-bold my-4 text-earth-800" {...props} />
                                ),
                                h2: ({ node, ...props }) => (
                                  <h2 className="text-lg font-bold my-3 text-earth-700" {...props} />
                                ),
                                h3: ({ node, ...props }) => (
                                  <h3 className="text-md font-bold my-2 text-earth-600" {...props} />
                                ),
                                p: ({ node, ...props }) => <p className="my-2" {...props} />,
                                ul: ({ node, ...props }) => <ul className="list-disc pl-5 my-2" {...props} />,
                                ol: ({ node, ...props }) => <ol className="list-decimal pl-5 my-2" {...props} />,
                                li: ({ node, ...props }) => <li className="my-1" {...props} />,
                                a: ({ node, ...props }) => <a className="text-earth-600 hover:underline" {...props} />,
                              }}
                            >
                              {message.content}
                            </ReactMarkdown>
                          </div>
                        ) : !hasToolResults ? (
                          <p className="text-gray-500 italic">Processing your request...</p>
                        ) : null}

                        {message.toolInvocations?.map((toolInvocation) => {
                          // Handle findHerbalRemedies tool
                          if (toolInvocation.state === "result" && toolInvocation.toolName === "findHerbalRemedies") {
                            const resultData = toolInvocation.result as ToolResultOutput
                            if (resultData && resultData.output && Object.keys(resultData.output).length > 0) {
                              return (
                                <SymptomPlantCarousel key={toolInvocation.toolCallId}>
                                  {Object.entries(resultData.output).map(([symptom, plants]) => (
                                    <PlantInfoCard
                                      key={`${toolInvocation.toolCallId}-${symptom}`}
                                      symptom={symptom}
                                      plants={plants}
                                    />
                                  ))}
                                </SymptomPlantCarousel>
                              )
                            }
                          }
                          
                          // Handle generateRecipe tool
                          if (toolInvocation.state === "result" && toolInvocation.toolName === "generateRecipe") {
                            const resultData = toolInvocation.result as RecipeToolResult
                            if (resultData && resultData.output) {
                              return (
                                <div key={toolInvocation.toolCallId} className="my-4">
                                  <RecipeCard
                                    recipe={resultData.output}
                                    symptom="Generated Recipe"
                                    onSave={() => handleSaveRecipe(resultData.output, "Generated Recipe")}
                                    onDownloadPDF={() => handleDownloadPDF(resultData.output, "Generated Recipe")}
                                  />
                                </div>
                              )
                            }
                          }
                          
                          // Handle saveRecipe tool
                          if (toolInvocation.state === "result" && toolInvocation.toolName === "saveRecipe") {
                            const resultData = toolInvocation.result as SaveRecipeResult
                            if (resultData) {
                              return (
                                <div key={toolInvocation.toolCallId} className="my-2">
                                  <p className={`text-sm ${resultData.success ? 'text-green-600' : 'text-red-600'}`}>
                                    {resultData.message}
                                  </p>
                                </div>
                              )
                            }
                          }
                          
                          // Handle getSavedRecipes tool
                          if (toolInvocation.state === "result" && toolInvocation.toolName === "getSavedRecipes") {
                            const resultData = toolInvocation.result as SavedRecipesResult
                            if (resultData) {
                              return (
                                <div key={toolInvocation.toolCallId} className="my-4">
                                  <div className="flex items-center justify-between mb-2">
                                    <p className="text-sm text-earth-600">
                                      Found {resultData.count} saved recipe{resultData.count !== 1 ? 's' : ''}
                                    </p>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => setSavedRecipesOpen(true)}
                                    >
                                      <BookOpen className="h-4 w-4 mr-2" />
                                      View All
                                    </Button>
                                  </div>
                                </div>
                              )
                            }
                          }
                          
                          // Handle downloadRecipePDF tool
                          if (toolInvocation.state === "result" && toolInvocation.toolName === "downloadRecipePDF") {
                            const resultData = toolInvocation.result as PDFDownloadResult
                            if (resultData && resultData.success && resultData.data) {
                              return (
                                <div key={toolInvocation.toolCallId} className="my-4">
                                  <div className="flex items-center gap-2">
                                    <p className="text-sm text-green-600">{resultData.message}</p>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => resultData.data && handleDownloadPDF(resultData.data as Recipe, resultData.data.symptom)}
                                    >
                                      <Download className="h-4 w-4 mr-2" />
                                      Download PDF
                                    </Button>
                                  </div>
                                </div>
                              )
                            } else if (resultData && !resultData.success) {
                              return (
                                <div key={toolInvocation.toolCallId} className="my-2">
                                  <p className="text-sm text-red-600">{resultData.message}</p>
                                </div>
                              )
                            }
                          }
                          
                          return null
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
          <div ref={messagesEndRef} />
        </div>

        {showScrollButton && (
          <button
            onClick={() => scrollToBottom("smooth")}
            className="absolute bottom-20 left-1/2 transform -translate-x-1/2 bg-earth-600 hover:bg-earth-700 text-white rounded-full p-2 shadow-lg transition-all duration-200 animate-bounce"
            aria-label="Scroll to bottom"
          >
            <ChevronDown className="h-5 w-5" />
          </button>
        )}

        <div className="p-4 bg-transparent sticky bottom-0">
          <div className="flex items-center space-x-4 mb-3">
            <div className="flex items-center space-x-2">
              <Switch
                id="mode-switch"
                checked={isEdibleMode}
                onCheckedChange={setIsEdibleMode}
              />
              <Label htmlFor="mode-switch" className="text-sm font-medium">
                {isEdibleMode ? "Edibility" : "Medical"}
              </Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-gray-500 hover:text-gray-700 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs text-sm">
                      This toggle selects either results to be filtered by best medical rating first and then best edible rating, or viceversa.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
          <form onSubmit={onSubmit} className="flex items-center space-x-2">
            <div className="flex-1">
              <Input
                value={input}
                onChange={handleInputChange}
                placeholder={isEdibleMode ? "Describe your medical concern and get best plant based on edible rating..." : "Describe your medical concern and get best plant based on medical rating..."}
                className="py-3 rounded-full border-gray-300 focus:border-earth-500 focus:ring-earth-500"
                disabled={isLoading}
              />
            </div>
            <Button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="bg-earth-600 hover:bg-earth-700 text-white px-6 py-3 rounded-full"
            >
              {isLoading ? "Sending..." : "Send"}
            </Button>
          </form>
        </div>
      </div>
      
      {/* Hidden SavedRecipesDrawer controlled by state */}
      <SavedRecipesDrawer>
        <div ref={el => {
          if (el && savedRecipesOpen) {
            el.click()
            setSavedRecipesOpen(false)
          }
        }} />
      </SavedRecipesDrawer>
    </div>
  )
}
