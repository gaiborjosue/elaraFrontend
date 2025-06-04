export async function makeAuthenticatedRequest(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem('authToken')
  
  const authHeaders = token 
    ? { 'Authorization': `Bearer ${token}` }
    : {}

  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
      ...options.headers,
    },
  })
}

export async function getRecommendations(medicalConcern: string) {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8000'
  
  const response = await makeAuthenticatedRequest(`${backendUrl}/getRecommendations`, {
    method: 'POST',
    body: JSON.stringify({ medicalConcern }),
  })

  if (!response.ok) {
    throw new Error(`Failed to get recommendations: ${response.statusText}`)
  }

  return response.json()
}

export async function getRecipe(plantName: string, scientificName: string, edibleUses: string) {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8000'
  
  const response = await makeAuthenticatedRequest(`${backendUrl}/getRecipe`, {
    method: 'POST',
    body: JSON.stringify({ 
      plantName, 
      scientificName, 
      edibleUses 
    }),
  })

  if (!response.ok) {
    throw new Error(`Failed to get recipe: ${response.statusText}`)
  }

  return response.json()
}