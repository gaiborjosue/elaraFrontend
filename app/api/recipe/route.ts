import { NextResponse } from "next/server"
import { z } from "zod"

const recipeRequestSchema = z.object({
  plantName: z.string(),
  scientificName: z.string(),
  edibleUses: z.string().optional(),
})

interface RecipeOutput {
  recipeName: string
  ingredients: string[]
  instructions: string
}

const mockRecipes: Record<string, RecipeOutput> = {
  Chamomile: {
    recipeName: "Classic Chamomile Tea",
    ingredients: [
      "1 tablespoon dried chamomile flowers (or 2-3 tea bags)",
      "8 ounces (1 cup) boiling water",
      "Honey or lemon to taste (optional)",
    ],
    instructions:
      "1. Place chamomile flowers in a teapot or mug.\n2. Pour boiling water over the flowers.\n3. Cover and steep for 5-10 minutes.\n4. Strain the tea (if using loose flowers).\n5. Add honey or lemon if desired. Enjoy!",
  },
  Oregano: {
    recipeName: "Oregano Infusion for Digestion",
    ingredients: [
      "1-2 teaspoons dried oregano leaves",
      "8 ounces (1 cup) hot (not boiling) water",
      "A slice of lemon (optional)",
    ],
    instructions:
      "1. Place oregano leaves in a mug.\n2. Pour hot water over the leaves.\n3. Let it steep for 7-10 minutes.\n4. Strain the leaves.\n5. Add a slice of lemon if you like. Sip slowly.",
  },
  Lavender: {
    recipeName: "Soothing Lavender Milk",
    ingredients: [
      "1 cup milk (dairy or non-dairy)",
      "1 teaspoon dried culinary lavender buds",
      "1 teaspoon honey or maple syrup (optional)",
      "Pinch of cinnamon (optional)",
    ],
    instructions:
      "1. Gently heat the milk in a small saucepan over medium-low heat until warm but not boiling.\n2. Add the lavender buds to the warm milk.\n3. Remove from heat, cover, and let steep for 10-15 minutes.\n4. Strain the milk to remove the lavender buds.\n5. Stir in honey/maple syrup and cinnamon if desired.\n6. Serve warm, perfect before bedtime.",
  },
  Rosemary: {
    recipeName: "Invigorating Rosemary & Lemon Water",
    ingredients: [
      "1-2 sprigs fresh rosemary",
      "2-3 thin slices of lemon",
      "2 cups cold filtered water",
      "Ice cubes (optional)",
    ],
    instructions:
      "1. Gently muddle or bruise the rosemary sprigs to release their oils. You can do this by lightly crushing them with your fingers or the back of a spoon.\n2. Combine the rosemary sprigs, lemon slices, and cold water in a pitcher or large glass.\n3. Let it infuse in the refrigerator for at least 30 minutes, or up to 2-3 hours for a stronger flavor.\n4. Serve over ice if desired. A refreshing and hydrating drink!",
  },
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const validation = recipeRequestSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json({ error: "Invalid request body", details: validation.error.format() }, { status: 400 })
    }

    const { plantName } = validation.data

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1500))

    const recipe = mockRecipes[plantName] || {
      recipeName: `Simple ${plantName} Infusion`,
      ingredients: [`1 part ${plantName}`, "10 parts hot water"],
      instructions: `Steep ${plantName} in hot water for 5-7 minutes. Strain and enjoy. (This is a generic recipe, specific details for ${plantName} may vary.)`,
    }

    return NextResponse.json({ output: recipe })
  } catch (error) {
    console.error("Error in recipe API:", error)
    return NextResponse.json({ error: "Failed to fetch recipe" }, { status: 500 })
  }
}
