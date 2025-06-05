"use client"

import { useState, useEffect } from "react"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Loader2, BookOpen, Trash2, Eye, Archive, ArrowLeft, RotateCcw } from "lucide-react"
import { useAuth } from "@/context/auth-context"
import { useToast } from "@/components/ui/use-toast"

interface Recipe {
  recipeName: string
  ingredients: string[]
  instructions: string
}

interface SavedRecipe {
  id: string
  symptom: string
  recipe: Recipe
  savedAt: string
}

interface DeletedRecipe {
  id: string
  symptom: string
  recipe: Recipe
  deletedAt: string
}

interface SavedRecipesDrawerProps {
  children: React.ReactNode
}

export function SavedRecipesDrawer({ children }: SavedRecipesDrawerProps) {
  const { token } = useAuth()
  const { toast } = useToast()
  const [savedRecipes, setSavedRecipes] = useState<SavedRecipe[]>([])
  const [deletedRecipes, setDeletedRecipes] = useState<DeletedRecipe[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [isRecovering, setIsRecovering] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [viewMode, setViewMode] = useState<'saved' | 'deleted'>('saved')

  const fetchSavedRecipes = async () => {
    if (!token) return

    setIsLoading(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8000'}/getSavedRecipes`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch saved recipes')
      }

      const data = await response.json()
      setSavedRecipes(data.savedRecipes || [])
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load saved recipes.",
        variant: "destructive",
        duration: 3000,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteRecipe = async (recipeId: string) => {
    if (!token) return

    setIsDeleting(recipeId)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8000'}/deleteRecipe/${recipeId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to delete recipe')
      }

      setSavedRecipes(prev => prev.filter(recipe => recipe.id !== recipeId))
      toast({
        title: "Recipe deleted",
        description: "Recipe has been moved to recently deleted.",
        duration: 3000,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete recipe.",
        variant: "destructive",
        duration: 3000,
      })
    } finally {
      setIsDeleting(null)
    }
  }

  const fetchDeletedRecipes = async () => {
    if (!token) return

    setIsLoading(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8000'}/recentlyDeleted`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch deleted recipes')
      }

      const data = await response.json()
      setDeletedRecipes(data.recentlyDeleted || [])
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load deleted recipes.",
        variant: "destructive",
        duration: 3000,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRecoverRecipe = async (recipeId: string) => {
    if (!token) return

    setIsRecovering(recipeId)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8000'}/recoverRecipe/${recipeId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to recover recipe')
      }

      setDeletedRecipes(prev => prev.filter(recipe => recipe.id !== recipeId))
      toast({
        title: "Recipe recovered",
        description: "Recipe has been restored to your saved recipes.",
        duration: 3000,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to recover recipe.",
        variant: "destructive",
        duration: 3000,
      })
    } finally {
      setIsRecovering(null)
    }
  }

  useEffect(() => {
    if (open) {
      if (viewMode === 'saved') {
        fetchSavedRecipes()
      } else {
        fetchDeletedRecipes()
      }
    }
  }, [open, viewMode])

  return (
    <Drawer open={open} onOpenChange={(newOpen) => {
      setOpen(newOpen)
      if (!newOpen) {
        setViewMode('saved')
      }
    }}>
      <DrawerTrigger asChild>
        {children}
      </DrawerTrigger>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="flex flex-row items-center justify-between">
          <DrawerTitle>
            {viewMode === 'saved' ? 'Saved Recipes' : 'Recently Deleted'}
          </DrawerTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode(viewMode === 'saved' ? 'deleted' : 'saved')}
            className="h-8"
          >
            {viewMode === 'saved' ? (
              <>
                <Archive className="h-4 w-4 mr-2" />
                View Recently Deleted
              </>
            ) : (
              <>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </>
            )}
          </Button>
        </DrawerHeader>
        <div className="px-4 pb-4 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-earth-600" />
            </div>
          ) : viewMode === 'saved' && savedRecipes.length === 0 ? (
            <div className="text-center py-8 text-earth-600">
              <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No saved recipes yet. Start exploring and save your favorite recipes!</p>
            </div>
          ) : viewMode === 'deleted' && deletedRecipes.length === 0 ? (
            <div className="text-center py-8 text-earth-600">
              <Archive className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No recently deleted recipes. Deleted recipes are kept for 10 days.</p>
            </div>
          ) : (
            <ScrollArea className="w-full whitespace-nowrap rounded-md">
              <div className="flex w-max space-x-4 p-4">
                {(viewMode === 'saved' ? savedRecipes : deletedRecipes).map((recipe) => (
                  <Card key={recipe.id} className="w-[300px] shrink-0 flex flex-col">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1 min-w-0 pr-2">
                          <CardTitle className="text-lg line-clamp-1">{recipe.recipe.recipeName}</CardTitle>
                          <CardDescription className="mt-1 line-clamp-2">For: {recipe.symptom}</CardDescription>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => viewMode === 'saved' ? handleDeleteRecipe(recipe.id) : handleRecoverRecipe(recipe.id)}
                          disabled={viewMode === 'saved' ? isDeleting === recipe.id : isRecovering === recipe.id}
                          className="flex-shrink-0 h-8 w-8"
                        >
                          {viewMode === 'saved' ? (
                            isDeleting === recipe.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4 text-destructive" />
                            )
                          ) : (
                            isRecovering === recipe.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <RotateCcw className="h-4 w-4 text-green-600" />
                            )
                          )}
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1 pb-3">
                      <div className="space-y-2">
                        <div>
                          <p className="text-sm font-semibold text-earth-700">Ingredients:</p>
                          <ul className="text-sm text-earth-600 list-disc list-inside">
                            {recipe.recipe.ingredients.slice(0, 2).map((ing, idx) => (
                              <li key={idx} className="truncate">{ing}</li>
                            ))}
                            {recipe.recipe.ingredients.length > 2 && (
                              <li className="text-muted-foreground">...and {recipe.recipe.ingredients.length - 2} more</li>
                            )}
                          </ul>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-earth-700">Instructions:</p>
                          <p className="text-sm text-earth-600 line-clamp-2">{recipe.recipe.instructions}</p>
                        </div>
                      </div>
                    </CardContent>
                    <div className="px-6 pb-4 pt-0 space-y-2">
                      <Sheet>
                        <SheetTrigger asChild>
                          <Button variant="outline" className="w-full" size="sm">
                            <Eye className="h-4 w-4 mr-2" />
                            View Recipe
                          </Button>
                        </SheetTrigger>
                        <SheetContent className="w-[90vw] sm:w-[540px] md:w-[600px]">
                          <SheetHeader>
                            <SheetTitle>{recipe.recipe.recipeName}</SheetTitle>
                          </SheetHeader>
                          <div className="mt-4 space-y-4">
                            <div>
                              <p className="text-sm text-muted-foreground mb-2">For: {recipe.symptom}</p>
                            </div>
                            <div>
                              <h4 className="font-semibold text-earth-700 mb-2">Ingredients:</h4>
                              <ul className="list-disc list-inside text-sm text-earth-600 space-y-1">
                                {recipe.recipe.ingredients.map((ing, idx) => (
                                  <li key={idx}>{ing}</li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <h4 className="font-semibold text-earth-700 mb-2">Instructions:</h4>
                              <p className="text-sm text-earth-600 whitespace-pre-line">{recipe.recipe.instructions}</p>
                            </div>
                            <div className="pt-4 border-t">
                              <p className="text-xs text-muted-foreground">
                                {viewMode === 'saved' ? 'Saved' : 'Deleted'} on {new Date(viewMode === 'saved' ? (recipe as SavedRecipe).savedAt : (recipe as DeletedRecipe).deletedAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </SheetContent>
                      </Sheet>
                      <p className="text-xs text-muted-foreground text-center">
                        {viewMode === 'saved' ? 'Saved' : 'Deleted'} {new Date(viewMode === 'saved' ? (recipe as SavedRecipe).savedAt : (recipe as DeletedRecipe).deletedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </Card>
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  )
}