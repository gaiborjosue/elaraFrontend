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

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const { messages, edibleMode } = body

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
      model: google("gemini-2.5-flash-preview-05-20"),
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

      If users want to continue the conversation, they can ask follow-up questions or request more information about specific plants or recipes, feel free to provide information based on your knowledge and only if applicable, use the tools to fetch specific data.
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
              const response = await fetch(`${backendUrl}/getRecommendations`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  ...(token && { 'Authorization': `Bearer ${token}` }),
                },
                body: JSON.stringify({ 
                  medicalConcern,
                  edible: edibleMode || false 
                }),
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
                }
                return { output };
              } else {
                throw new Error("Failed to get recommendations from backend");
              }
            } catch (error) {
              console.error("Error calling backend:", error);
              throw new Error("Unable to fetch herbal remedy recommendations. Please try again later.");
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
                throw new Error("Failed to generate recipe from backend");
              }
            } catch (error) {
              console.error("Error calling backend:", error);
              throw new Error("Unable to generate recipe. Please try again later.");
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
                return { 
                  success: true, 
                  message: "PDF download initiated",
                  downloadUrl: `${backendUrl}/downloadRecipePDF`,
                  data: { symptom, recipeName, ingredients, instructions }
                };
              } else {
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