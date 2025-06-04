import { google } from "@ai-sdk/google"
import { streamText, tool } from "ai"
import { z } from "zod"

export const maxDuration = 30

const PlantDetailSchema = z.object({
  plantName: z.string(),
  scientificName: z.string(),
  medicalRating: z.number().optional(),
  edibleRating: z.number().optional(),
  edibleUses: z.string().optional(),
  plantImageURL: z.string().url().optional(),
  plantURL: z.string().url().optional(),
  partsUsed: z.string().optional(),
  cultivation: z.string().optional(),
  methodOfUse: z.string().optional(),
  recipe: z.string().optional(),
  benefits: z.string().optional(),
})

const RecipeSchema = z.object({
  recipeName: z.string(),
  ingredients: z.array(z.string()),
  instructions: z.string(),
})


// Fallback mock data in case the backend is unavailable
const mockSymptomPlantMap: Record<string, z.infer<typeof PlantDetailSchema>> = {
  "sleep issues": {
    plantName: "Chamomile",
    scientificName: "Matricaria chamomilla",
    medicalRating: 4,
    edibleRating: 3,
    edibleUses: "Flowers used in teas.",
    plantImageURL: "/placeholder.svg?height=200&width=300",
    plantURL: "https://en.wikipedia.org/wiki/Matricaria_chamomilla",
    partsUsed: "Flowers",
    recipe:
      "Chamomile Tea: Add 1 tablespoon of dried chamomile flowers to a cup of hot water. Steep for 5-10 minutes...",
    benefits: "Promotes relaxation, reduces anxiety, improves sleep quality.",
  },
  "digestive problems": {
    plantName: "Oregano",
    scientificName: "Origanum vulgare",
    medicalRating: 3,
    edibleRating: 5,
    edibleUses: "Leaves used as a culinary herb.",
    plantImageURL: "/placeholder.svg?height=200&width=300",
    plantURL: "https://en.wikipedia.org/wiki/Oregano",
    partsUsed: "Leaves and flowering tops",
    recipe: "Oregano Tea for Digestion: Steep 1-2 teaspoons of dried oregano leaves in a cup of hot water...",
    benefits: "Antimicrobial properties, soothes digestive discomfort.",
  },
  anxiety: {
    plantName: "Lavender",
    scientificName: "Lavandula angustifolia",
    medicalRating: 4,
    edibleRating: 2,
    edibleUses: "Flowers can be used in culinary preparations, but primarily for aroma.",
    plantImageURL: "/placeholder.svg?height=200&width=300",
    plantURL: "https://en.wikipedia.org/wiki/Lavandula_angustifolia",
    partsUsed: "Flowers and leaves",
    recipe: "Lavender Relaxation Tea: Mix 1 teaspoon of dried lavender flowers with 1 teaspoon of chamomile...",
    benefits: "Calms the nervous system, reduces anxiety and stress.",
  },
  headache: {
    plantName: "Rosemary",
    scientificName: "Salvia rosmarinus",
    medicalRating: 3,
    edibleRating: 5,
    edibleUses: "Leaves used as a culinary herb.",
    plantImageURL: "/placeholder.svg?height=200&width=300",
    plantURL: "https://en.wikipedia.org/wiki/Rosemary",
    partsUsed: "Leaves",
    recipe: "Rosemary tea: Steep fresh rosemary sprigs in hot water. Believed to help with circulation.",
    benefits: "May improve memory and concentration, anti-inflammatory.",
  },
}

const mockRecipes: Record<string, z.infer<typeof RecipeSchema>> = {
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
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const { messages } = body

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({
          error: "Invalid request: messages array is required",
        }),
        { status: 400 },
      )
    }

    // Get the authorization token from the request headers
    const authorization = req.headers.get('authorization')
    const token = authorization?.replace('Bearer ', '')
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8000'

    const result = streamText({
      model: google("gemini-2.0-flash-exp"),
      messages,
      maxSteps: 5,
      system: `You are Elara, an expert in plant herbal remedies.
      When a user describes a medical concern, use the 'findHerbalRemedies' tool.
      The tool will return plants for identified symptoms.
      After the tool provides results, YOU MUST generate a textual response.
      In your textual response, clearly present these findings. For each symptom identified by the tool, state the suggested plant and briefly explain its key benefits or uses relevant to that symptom, drawing from the information provided by the tool if available (especially the 'benefits' field).
      If the tool returns multiple plants for different symptoms, discuss each one.
      If a recipe or method of use is available in the tool's data, incorporate that into your textual description for the respective plant.
      
      When users want to generate a recipe for a specific plant, use the 'generateRecipe' tool.
      When users want to save a recipe, use the 'saveRecipe' tool.
      When users want to view their saved recipes, use the 'getSavedRecipes' tool.
      When users want to download a recipe as PDF, use the 'downloadRecipePDF' tool.
      
      Conclude your textual response naturally.
      Format your response using Markdown. Use headings for symptoms and plant names.
      Example of textual response structure:
      "Okay, I can help with that. Based on what you've described, here are some suggestions:

      ## For your sleep issues:
      ### Chamomile
      Chamomile is well-known for promoting relaxation and improving sleep quality.
      To make Chamomile tea: Add 1 tablespoon of dried chamomile flowers to a cup of hot water...

      ## For your anxiety:
      ### Lavender
      Lavender can help calm the nervous system and reduce stress.
      A simple Lavender preparation is: Mix 1 teaspoon of dried lavender flowers with 1 teaspoon of chamomile..."

      Ensure your final output is a textual message to the user summarizing these points.
      `,
      tools: {
        findHerbalRemedies: tool({
          description:
            "Identifies symptoms from a user's medical concern and finds matching herbal remedies. This tool processes the entire medical concern.",
          parameters: z.object({
            medicalConcern: z.string().describe("The user's full medical concern string."),
          }),
          execute: async ({ medicalConcern }) => {
            try {
              // Make the API call to the backend using the token from the request
              const response = await fetch(`${backendUrl}/getRecommendations`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  ...(token && { 'Authorization': `Bearer ${token}` }),
                },
                body: JSON.stringify({ medicalConcern }),
              });
              
              if (response.ok) {
                const data = await response.json();
                
                // Process the data to ensure image URLs are complete
                const output = data.output;
                for (const key in output) {
                  if (output[key].plantImageURL && Array.isArray(output[key].plantImageURL)) {
                    // Convert array of URLs to single URL (if needed)
                    output[key].plantImageURL = output[key].plantImageURL[0];
                  }
                  
                  // Ensure placeholder images have a query
                  if (
                    output[key].plantImageURL && 
                    output[key].plantImageURL.startsWith("/placeholder.svg") &&
                    !output[key].plantImageURL.includes("query=")
                  ) {
                    output[key].plantImageURL += `&query=${encodeURIComponent(output[key].plantName)}`;
                  }
                }
                
                return { output };
              } else {
                console.error("Backend API error:", await response.text());
                throw new Error("Failed to get recommendations from backend");
              }
            } catch (error) {
              console.error("Error calling backend:", error);
              
              // Fallback to mock data if backend call fails
              const output: Record<string, z.infer<typeof PlantDetailSchema>> = {};
              const concern = medicalConcern.toLowerCase();

              if (concern.includes("sleep") || concern.includes("insomnia")) {
                output["sleep issues"] = mockSymptomPlantMap["sleep issues"];
              }
              if (concern.includes("stomach") || concern.includes("digest")) {
                output["digestive problems"] = mockSymptomPlantMap["digestive problems"];
              }
              if (concern.includes("anxiety") || concern.includes("stress") || concern.includes("nervous")) {
                output["anxiety"] = mockSymptomPlantMap["anxiety"];
              }
              if (concern.includes("headache") || concern.includes("migraine")) {
                output["headache"] = mockSymptomPlantMap["headache"];
              }

              if (Object.keys(output).length === 0 && concern.length > 0) {
                if (concern.includes("pain")) {
                  output["general discomfort/pain"] = mockSymptomPlantMap["headache"];
                } else {
                  output["general wellness"] = mockSymptomPlantMap["sleep issues"];
                }
              }
              
              // Ensure placeholder images have a query
              for (const key in output) {
                if (
                  output[key].plantImageURL &&
                  output[key].plantImageURL.startsWith("/placeholder.svg") &&
                  !output[key].plantImageURL.includes("query=")
                ) {
                  output[key].plantImageURL += `&query=${encodeURIComponent(output[key].plantName)}`;
                }
              }
              
              return { output };
            }
          },
        }),
        generateRecipe: tool({
          description: "Generates a recipe using a specific plant based on its properties and edible uses.",
          parameters: z.object({
            plantName: z.string().describe("The name of the plant"),
            scientificName: z.string().describe("The scientific name of the plant"),
            edibleUses: z.string().optional().describe("The edible uses of the plant"),
          }),
          execute: async ({ plantName, scientificName, edibleUses }) => {
            try {
              const response = await fetch(`${backendUrl}/getRecipe`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  ...(token && { 'Authorization': `Bearer ${token}` }),
                },
                body: JSON.stringify({ 
                  plantName, 
                  scientificName, 
                  edibleUses: edibleUses || '' 
                }),
              });

              if (response.ok) {
                const data = await response.json();
                return data;
              } else {
                console.error("Backend API error:", await response.text());
                throw new Error("Failed to generate recipe from backend");
              }
            } catch (error) {
              console.error("Error calling backend:", error);
              
              // Fallback to mock data
              const recipe = mockRecipes[plantName] || {
                recipeName: `Simple ${plantName} Infusion`,
                ingredients: [`1 part ${plantName}`, "10 parts hot water"],
                instructions: `Steep ${plantName} in hot water for 5-7 minutes. Strain and enjoy.`,
              };

              return { output: recipe };
            }
          },
        }),
        saveRecipe: tool({
          description: "Saves a recipe to the user's collection",
          parameters: z.object({
            symptom: z.string().describe("The symptom or medical concern this recipe addresses"),
            recipeName: z.string().describe("The name of the recipe"),
            ingredients: z.array(z.string()).describe("List of ingredients"),
            instructions: z.string().describe("Step-by-step instructions"),
          }),
          execute: async ({ symptom, recipeName, ingredients, instructions }) => {
            try {
              const response = await fetch(`${backendUrl}/saveRecipe`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  ...(token && { 'Authorization': `Bearer ${token}` }),
                },
                body: JSON.stringify({ symptom, recipeName, ingredients, instructions }),
              });

              if (response.ok) {
                const data = await response.json();
                return { 
                  success: true, 
                  message: "Recipe saved successfully",
                  recipeId: data.insertedId 
                };
              } else {
                console.error("Backend API error:", await response.text());
                throw new Error("Failed to save recipe");
              }
            } catch (error) {
              console.error("Error saving recipe:", error);
              return { 
                success: false, 
                message: "Failed to save recipe. Please try again." 
              };
            }
          },
        }),
        getSavedRecipes: tool({
          description: "Retrieves all saved recipes for the authenticated user",
          parameters: z.object({}),
          execute: async () => {
            try {
              const response = await fetch(`${backendUrl}/getSavedRecipes`, {
                method: 'GET',
                headers: {
                  'Authorization': `Bearer ${token}`,
                },
              });

              if (response.ok) {
                const data = await response.json();
                return { 
                  savedRecipes: data.savedRecipes || [],
                  count: data.savedRecipes?.length || 0
                };
              } else {
                console.error("Backend API error:", await response.text());
                throw new Error("Failed to fetch saved recipes");
              }
            } catch (error) {
              console.error("Error fetching saved recipes:", error);
              return { 
                savedRecipes: [],
                count: 0,
                error: "Failed to load saved recipes" 
              };
            }
          },
        }),
        downloadRecipePDF: tool({
          description: "Downloads a recipe as a PDF file",
          parameters: z.object({
            symptom: z.string().describe("The symptom or medical concern this recipe addresses"),
            recipeName: z.string().describe("The name of the recipe"),
            ingredients: z.array(z.string()).describe("List of ingredients"),
            instructions: z.string().describe("Step-by-step instructions"),
          }),
          execute: async ({ symptom, recipeName, ingredients, instructions }) => {
            try {
              const response = await fetch(`${backendUrl}/downloadRecipePDF`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  ...(token && { 'Authorization': `Bearer ${token}` }),
                },
                body: JSON.stringify({ symptom, recipeName, ingredients, instructions }),
              });

              if (response.ok) {
                // For PDF download, we'll return a success message
                // The actual download would be handled by the frontend
                return { 
                  success: true, 
                  message: "PDF download initiated",
                  downloadUrl: `${backendUrl}/downloadRecipePDF`,
                  data: { symptom, recipeName, ingredients, instructions }
                };
              } else {
                console.error("Backend API error:", await response.text());
                throw new Error("Failed to generate PDF");
              }
            } catch (error) {
              console.error("Error downloading PDF:", error);
              return { 
                success: false, 
                message: "Failed to generate PDF. Please try again." 
              };
            }
          },
        }),
      },
    })

    return result.toDataStreamResponse()
  } catch (error) {
    console.error("Error in chat API route:", error)
    return new Response(
      JSON.stringify({
        error: "An error occurred while processing your request. Please try again.",
      }),
      { status: 500 },
    )
  }
}