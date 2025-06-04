"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Eye, Download, Save, Loader2 } from "lucide-react"
import { useAuth } from "@/context/auth-context"
import { useToast } from "@/components/ui/use-toast"

interface Recipe {
  recipeName: string
  ingredients: string[]
  instructions: string
}

interface RecipeCardProps {
  recipe: Recipe
  symptom?: string
  onSave?: () => void
  onDownloadPDF?: () => void
  isSaving?: boolean
  isDownloading?: boolean
}

export function RecipeCard({ 
  recipe, 
  symptom, 
  onSave, 
  onDownloadPDF, 
  isSaving = false,
  isDownloading = false 
}: RecipeCardProps) {
  const { token } = useAuth()
  const { toast } = useToast()
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  const handleSave = async () => {
    if (!token || !onSave) return
    onSave()
  }

  const handleDownloadPDF = async () => {
    if (!token || !onDownloadPDF) return
    onDownloadPDF()
  }

  return (
    <Card className="w-[300px] shrink-0 flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex-1 min-w-0">
          <CardTitle className="text-lg line-clamp-1 pr-2">{recipe.recipeName}</CardTitle>
          {symptom && <CardDescription className="mt-1">For: {symptom}</CardDescription>}
        </div>
      </CardHeader>
      <CardContent className="flex-1 pb-3">
        <div className="space-y-2">
          <div>
            <p className="text-sm font-semibold text-earth-700">Ingredients:</p>
            <ul className="text-sm text-earth-600 list-disc list-inside">
              {recipe.ingredients.slice(0, 2).map((ing, idx) => (
                <li key={idx} className="truncate">{ing}</li>
              ))}
              {recipe.ingredients.length > 2 && (
                <li className="text-muted-foreground">...and {recipe.ingredients.length - 2} more</li>
              )}
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold text-earth-700">Instructions:</p>
            <p className="text-sm text-earth-600 line-clamp-2">{recipe.instructions}</p>
          </div>
        </div>
      </CardContent>
      <div className="px-6 pb-4 pt-0 space-y-2">
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="w-full" size="sm">
              <Eye className="h-4 w-4 mr-2" />
              View Recipe
            </Button>
          </SheetTrigger>
          <SheetContent className="w-[90vw] sm:w-[400px]">
            <SheetHeader>
              <SheetTitle>{recipe.recipeName}</SheetTitle>
            </SheetHeader>
            <div className="mt-4 space-y-4">
              {symptom && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">For: {symptom}</p>
                </div>
              )}
              <div>
                <h4 className="font-semibold text-earth-700 mb-2">Ingredients:</h4>
                <ul className="list-disc list-inside text-sm text-earth-600 space-y-1">
                  {recipe.ingredients.map((ing, idx) => (
                    <li key={idx}>{ing}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-earth-700 mb-2">Instructions:</h4>
                <p className="text-sm text-earth-600 whitespace-pre-line">{recipe.instructions}</p>
              </div>
              <div className="pt-4 border-t space-y-2">
                {onSave && (
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    size="sm"
                    onClick={handleSave}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Save Recipe
                  </Button>
                )}
                {onDownloadPDF && (
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    size="sm"
                    onClick={handleDownloadPDF}
                    disabled={isDownloading}
                  >
                    {isDownloading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4 mr-2" />
                    )}
                    Download PDF
                  </Button>
                )}
              </div>
            </div>
          </SheetContent>
        </Sheet>
        <div className="flex gap-2">
          {onSave && (
            <Button 
              variant="outline" 
              className="flex-1" 
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save
            </Button>
          )}
          {onDownloadPDF && (
            <Button 
              variant="outline" 
              className="flex-1" 
              size="sm"
              onClick={handleDownloadPDF}
              disabled={isDownloading}
            >
              {isDownloading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              PDF
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}