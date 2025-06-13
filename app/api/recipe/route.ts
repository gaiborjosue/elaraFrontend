import { NextResponse } from "next/server"
import { z } from "zod"

const recipeRequestSchema = z.object({
  plantName: z.string(),
  scientificName: z.string(),
  edibleUses: z.string().optional(),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const validation = recipeRequestSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json({ error: "Invalid request body", details: validation.error.format() }, { status: 400 })
    }

    const { plantName, scientificName, edibleUses } = validation.data

    // Get the authorization token from the request headers
    const authorization = req.headers.get('authorization')
    const token = authorization?.replace('Bearer ', '')

    // Get backend URL from environment variables
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8000';
    
    // Call the backend API
    const response = await fetch(`${backendUrl}/getRecipe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
      body: JSON.stringify({
        plantName,
        scientificName,
        edibleUses: edibleUses || '',
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return NextResponse.json(data);
    } else {
      console.error("Backend API error:", await response.text());
      return NextResponse.json({ error: "Failed to fetch recipe from backend" }, { status: 500 });
    }
  } catch (error) {
    console.error("Error in recipe API:", error)
    return NextResponse.json({ error: "Failed to fetch recipe" }, { status: 500 })
  }
}
