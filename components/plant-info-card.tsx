"use client"

import { useState } from "react" // Added useState
import { Badge } from "@/components/ui/badge"
import { Leaf, Star, Utensils, ExternalLink, Thermometer, Loader2 } from "lucide-react" // Added Loader2
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"

interface PlantInfoBase {
  plantName: string
  scientificName: string
  medicalRating?: number
  edibleRating?: number
  edibleUses?: string
  plantImageURL?: string
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
  plant: PlantInfoBase
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

export function PlantInfoCard({ symptom, plant }: PlantInfoCardProps) {
  const [detailedRecipe, setDetailedRecipe] = useState<RecipeOutput | null>(null)
  const [isRecipeLoading, setIsRecipeLoading] = useState(false)
  const [recipeError, setRecipeError] = useState<string | null>(null)
  const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false)

  const fetchRecipeDetails = async () => {
    if (detailedRecipe || isRecipeLoading) return // Already fetched or currently fetching

    setIsRecipeLoading(true)
    setRecipeError(null)
    setHasAttemptedFetch(true)

    try {
      const response = await fetch("/api/recipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
  }

  return (
    <div className="mt-4 relative w-full max-w-xs shrink-0 transform scale-95">
      <div className="relative overflow-hidden rounded-xl backdrop-blur-md bg-white/20 border border-white/30 shadow-xl h-full flex flex-col">
        <div className="absolute inset-0 bg-gradient-to-br from-earth-200/60 to-earth-400/40 backdrop-blur-md"></div>

        <div className="relative z-10 flex flex-col flex-grow">
          {plant.plantImageURL && (
            <div className="relative h-40 w-full">
              <Image
                src={plant.plantImageURL || "/placeholder.svg"}
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
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-earth-600/80 backdrop-blur-sm flex items-center justify-center">
                <Leaf className="h-4 w-4 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-earth-800">{plant.plantName}</h3>
                <p className="text-sm text-earth-700/90 italic">{plant.scientificName}</p>
              </div>
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
                <p className="text-xs text-earth-700/90">{plant.edibleUses}</p>
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
                <SheetContent className="bg-white/80 backdrop-blur-lg text-earth-800 border-earth-200 w-[90vw] sm:w-[400px] overflow-y-auto">
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
              <a
                href={plant.plantURL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-earth-600 hover:text-earth-800 hover:underline flex items-center"
              >
                Learn more about {plant.plantName} <ExternalLink className="h-3 w-3 ml-1" />
              </a>
            </div>
          )}
        </div>
      </div>
      <div className="absolute -top-4 -right-4 w-24 h-24 bg-earth-300/20 rounded-full blur-2xl opacity-70"></div>
      <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-earth-400/20 rounded-full blur-3xl opacity-70"></div>
    </div>
  )
}
