"use client"

import { useState } from "react" // Added useState
import { Badge } from "@/components/ui/badge"
import { Leaf, Star, Utensils, ExternalLink, Thermometer, Loader2, Download, Save, Check, ChevronLeft, ChevronRight } from "lucide-react" // Added Loader2, Download, Save, Check, ChevronLeft, ChevronRight
import Image from "next/legacy/image"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { useAuth } from "@/context/auth-context"
import { useToast } from "@/components/ui/use-toast"

interface PlantInfoBase {
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
  recipe?: string // This is the initial brief recipe string
}

interface RecipeOutput {
  recipeName: string
  ingredients: string[]
  instructions: string
}

interface PlantInfoCardProps {
  symptom: string
  plants: PlantInfoBase[]
}

const RatingStars = ({ rating }: { rating?: number }) => {
  if (typeof rating !== "number" || rating < 0 || rating > 5) {
    return <span className="text-xs text-earth-700/80">N/A</span>
  }
  return (
    <div className="flex items-center">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={`h-3 w-3 ${
            i < rating ? (rating < 3 ? "text-red-500 fill-red-500" : "text-earth-700 fill-earth-700") : "text-gray-300"
          }`}
        />
      ))}
    </div>
  )
}

export function PlantInfoCard({ symptom, plants }: PlantInfoCardProps) {
  const { token } = useAuth()
  const { toast } = useToast()
  const [currentPlantIndex, setCurrentPlantIndex] = useState(0)
  const [detailedRecipe, setDetailedRecipe] = useState<RecipeOutput | null>(null)
  const [isRecipeLoading, setIsRecipeLoading] = useState(false)
  const [recipeError, setRecipeError] = useState<string | null>(null)
  const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false)
  const [showFullEdibleUses, setShowFullEdibleUses] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [isSaved, setIsSaved] = useState(false)

  // Add safety check for empty plants array
  if (!plants || plants.length === 0) {
    return (
      <div className="mt-4 relative w-full max-w-xs shrink-0 transform scale-95">
        <div className="relative overflow-hidden rounded-xl backdrop-blur-md bg-white/20 border border-white/30 shadow-xl h-full flex flex-col p-4">
          <p className="text-earth-600">No plant data available</p>
        </div>
      </div>
    )
  }

  const plant = plants[currentPlantIndex]
  const hasMultiplePlants = plants.length > 1

  const goToNextPlant = () => {
    setCurrentPlantIndex((prev) => (prev + 1) % plants.length)
    resetPlantState()
  }

  const goToPreviousPlant = () => {
    setCurrentPlantIndex((prev) => (prev - 1 + plants.length) % plants.length)
    resetPlantState()
  }

  const resetPlantState = () => {
    setDetailedRecipe(null)
    setRecipeError(null)
    setHasAttemptedFetch(false)
    setShowFullEdibleUses(false)
    setIsSaved(false)
  }

  const fetchRecipeDetails = async () => {
    if (detailedRecipe || isRecipeLoading) return // Already fetched or currently fetching

    setIsRecipeLoading(true)
    setRecipeError(null)
    setHasAttemptedFetch(true)

    try {
      const response = await fetch("/api/recipe", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify({
          plantName: plant.plantName,
          scientificName: plant.scientificName,
          edibleUses: plant.edibleUses,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to fetch recipe details." }))
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      const data: { output: RecipeOutput } = await response.json()
      setDetailedRecipe(data.output)
    } catch (err) {
      setRecipeError(err instanceof Error ? err.message : "An unknown error occurred.")
    } finally {
      setIsRecipeLoading(false)
    }
  }

  const handleSheetOpenChange = (open: boolean) => {
    if (open && !hasAttemptedFetch && !detailedRecipe) {
      fetchRecipeDetails()
    }
    if (!open) {
      setIsSaved(false)
    }
  }

  const handleSaveRecipe = async () => {
    if (!detailedRecipe || !token) return
    
    setIsSaving(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8000'}/saveRecipe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          symptom,
          recipeName: detailedRecipe.recipeName,
          ingredients: detailedRecipe.ingredients,
          instructions: detailedRecipe.instructions,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save recipe')
      }

      toast({
        title: "Recipe saved!",
        description: "Recipe has been saved to your collection.",
        duration: 3000,
      })
      setIsSaved(true)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save recipe. Please try again.",
        variant: "destructive",
        duration: 3000,
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDownloadPDF = async () => {
    if (!detailedRecipe || !token) return
    
    setIsDownloading(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8000'}/downloadRecipePDF`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          symptom,
          recipeName: detailedRecipe.recipeName,
          ingredients: detailedRecipe.ingredients,
          instructions: detailedRecipe.instructions,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to download PDF')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${detailedRecipe.recipeName.replace(/\s+/g, '_')}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      toast({
        title: "PDF downloaded!",
        description: "Recipe PDF has been downloaded successfully.",
        duration: 3000,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download PDF. Please try again.",
        variant: "destructive",
        duration: 3000,
      })
    } finally {
      setIsDownloading(false)
    }
  }

  // Helper function to truncate text to approximately 3 lines
  const getTruncatedText = (text: string, maxLength: number = 120) => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength).trim() + '...'
  }

  const shouldShowReadMore = plant.edibleUses && plant.edibleUses.length > 120

  return (
    <div className="mt-4 relative w-full max-w-xs shrink-0 transform scale-95">
      <div className="relative overflow-hidden rounded-xl backdrop-blur-md bg-white/20 border border-white/30 shadow-xl h-full flex flex-col">
        <div className="absolute inset-0 bg-gradient-to-br from-earth-200/60 to-earth-400/40 backdrop-blur-md"></div>

        <div className="relative z-10 flex flex-col flex-grow">
          {plant.plantImageURL && plant.plantImageURL.length > 0 && (
            <div className="relative h-40 w-full">
              <Image
                src={'https://pfaf.org/' + plant.plantImageURL[0].substring(3) || "/placeholder.svg"}
                alt={plant.plantName}
                layout="fill"
                objectFit="cover"
                className="rounded-t-xl"
              />
            </div>
          )}
          <div className="p-4 pb-2">
            <Badge variant="secondary" className="mb-2 bg-earth-100 text-earth-700 border-earth-300">
              For: {symptom}
            </Badge>
            <div className="flex items-center justify-between space-x-2">
              <div className="flex items-center space-x-2 flex-1">
                <div className="w-8 h-8 rounded-full bg-earth-600/80 backdrop-blur-sm flex items-center justify-center">
                  <Leaf className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-earth-800">{plant.plantName}</h3>
                  <p className="text-sm text-earth-700/90 italic">{plant.scientificName}</p>
                </div>
              </div>
              {hasMultiplePlants && (
                <div className="flex items-center space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={goToPreviousPlant}
                    className="h-8 w-8 p-0 hover:bg-earth-100/50"
                    aria-label="Previous plant"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-xs text-earth-600 px-1">
                    {currentPlantIndex + 1}/{plants.length}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={goToNextPlant}
                    className="h-8 w-8 p-0 hover:bg-earth-100/50"
                    aria-label="Next plant"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="p-4 pt-2 space-y-3 flex-grow">
            {plant.medicalRating !== undefined && (
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-earth-800 flex items-center">
                  <Thermometer className="h-4 w-4 mr-1 text-earth-600" />
                  Medical Rating:
                </span>
                <RatingStars rating={plant.medicalRating} />
              </div>
            )}
            {plant.edibleRating !== undefined && (
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-earth-800 flex items-center">
                  <Utensils className="h-4 w-4 mr-1 text-earth-600" />
                  Edible Rating:
                </span>
                <RatingStars rating={plant.edibleRating} />
              </div>
            )}
            {plant.edibleUses && (
              <div>
                <p className="text-sm font-medium text-earth-800">Edible Uses:</p>
                <div className="text-xs text-earth-700/90">
                  <p>
                    {showFullEdibleUses || !shouldShowReadMore 
                      ? plant.edibleUses 
                      : getTruncatedText(plant.edibleUses)
                    }
                  </p>
                  {shouldShowReadMore && (
                    <button 
                      onClick={() => setShowFullEdibleUses(!showFullEdibleUses)}
                      className="text-earth-600 hover:text-earth-800 font-medium mt-1 underline"
                    >
                      {showFullEdibleUses ? 'Read Less' : 'Read More...'}
                    </button>
                  )}
                </div>
              </div>
            )}
            {/* The button is always present, but functionality changes based on recipe availability */}
            <div className="pt-2 mt-2 border-t border-white/20">
              <Sheet onOpenChange={handleSheetOpenChange}>
                <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full bg-earth-50/20 hover:bg-earth-100/30 border-earth-300/50 text-earth-700 hover:text-earth-800"
                  >
                    Get Recipe
                  </Button>
                </SheetTrigger>
                <SheetContent className="bg-white/80 backdrop-blur-lg text-earth-800 border-earth-200 w-[90vw] sm:w-[540px] md:w-[600px] overflow-y-auto">
                  <SheetHeader>
                    <SheetTitle className="text-earth-700 text-2xl">
                      {detailedRecipe?.recipeName || plant.plantName}
                    </SheetTitle>
                  </SheetHeader>
                  <div className="py-4">
                    {isRecipeLoading && (
                      <div className="flex items-center justify-center space-x-2 text-earth-600">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Loading recipe...</span>
                      </div>
                    )}
                    {recipeError && (
                      <div className="text-red-600">
                        <p>Error: {recipeError}</p>
                        <p>The initial information was: {plant.recipe || "No initial recipe info."}</p>
                      </div>
                    )}
                    {detailedRecipe && !isRecipeLoading && (
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-semibold text-earth-700 mb-1">Ingredients:</h4>
                          <ul className="list-disc list-inside text-sm text-earth-600 space-y-1">
                            {detailedRecipe.ingredients.map((ing, idx) => (
                              <li key={idx}>{ing}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-semibold text-earth-700 mb-1">Instructions:</h4>
                          <p className="text-sm text-earth-600 whitespace-pre-line">{detailedRecipe.instructions}</p>
                        </div>
                        <div className="flex gap-2 pt-4">
                          <Button
                            onClick={handleSaveRecipe}
                            disabled={isSaving || isSaved}
                            className={`flex-1 ${isSaved ? 'bg-green-600 hover:bg-green-600' : 'bg-earth-600 hover:bg-earth-700'}`}
                          >
                            {isSaving ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : isSaved ? (
                              <Check className="h-4 w-4 mr-2" />
                            ) : (
                              <Save className="h-4 w-4 mr-2" />
                            )}
                            {isSaving ? "Saving..." : isSaved ? "Saved :)" : "Save Recipe"}
                          </Button>
                          <Button
                            onClick={handleDownloadPDF}
                            disabled={isDownloading}
                            variant="outline"
                            className="flex-1 border-earth-600 text-earth-600 hover:bg-earth-50"
                          >
                            {isDownloading ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                              <Download className="h-4 w-4 mr-2" />
                            )}
                            {isDownloading ? "Downloading..." : "Download PDF"}
                          </Button>
                        </div>
                      </div>
                    )}
                    {!isRecipeLoading && !detailedRecipe && !recipeError && hasAttemptedFetch && (
                      <p className="text-earth-600">
                        No detailed recipe found. Initial info: {plant.recipe || "No initial recipe info."}
                      </p>
                    )}
                    {!isRecipeLoading && !detailedRecipe && !recipeError && !hasAttemptedFetch && plant.recipe && (
                      <p className="text-earth-600 whitespace-pre-line">{plant.recipe}</p>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>

          {plant.plantURL && (
            <div className="p-4 pt-2 mt-auto border-t border-white/20">
              <div className="flex items-center justify-between text-xs">
                <a
                  href={plant.plantURL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-earth-600 hover:text-earth-800 hover:underline flex items-center"
                >
                  Learn more abot {plant.plantName} <ExternalLink className="h-3 w-3 ml-1" />
                </a>
                <a
                  href="https://pfaf.org/user/cmspage.aspx?pageid=174"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-earth-600 hover:text-earth-800 hover:underline flex items-center"
                >
                  References <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="absolute -top-4 -right-4 w-24 h-24 bg-earth-300/20 rounded-full blur-2xl opacity-70"></div>
      <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-earth-400/20 rounded-full blur-3xl opacity-70"></div>
    </div>
  )
}
