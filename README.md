# **Elara Frontend**

![ElaraBannerFrontend](https://github.com/user-attachments/assets/e8f5825c-594a-4998-aebf-525f57a83ae4)
🏆 **3rd Place Winner - MongoDB Track - ![AI in Action 2025 Hackathon](https://devpost.com/software/elara-x47age)** 🏆

Developed by [@gaiborjosue](https://edwardgaibor.me) and [@dariadobrolinski](https://dariadobrolinski.me).

To view the backend for this project:

<a href="https://github.com/dariadobrolinski/elaraBackend" target="_blank">
  <img src="https://github.com/user-attachments/assets/4357cfd3-1cf8-4749-9ced-4d34ccc8fb57" alt="View Backend (1)" />
</a>


## Description

Elara is a Next.js frontend for an AI-powered chat that recommends herbal remedies and recipes. Built with TypeScript and deployed on Google Cloud Run. Now includes user registration with email verification.

![StackElaraFrontend](https://github.com/user-attachments/assets/7f2d83a2-46d8-4303-846d-6ea978f723e5)

## Tech Stack

* **Framework**: Next.js (App Router) + React 18 + TypeScript
* **Styling**: Tailwind CSS, Radix UI, lucide-react icons
* **Forms/Validation**: react-hook-form, Zod
* **AI Chat**: Vercel AI SDK, Google PaLM Gemini
* **Deployment**: Google Cloud Run (Frontend & Backend)
* **Auth**: Service Account (JWT stored in localStorage) + Email Verification

## High-Level Architecture

![highlevel overview](https://github.com/user-attachments/assets/a7a1c8a3-fea0-4e04-aa64-d510676bf574)

Shows the frontend service, AI integration, and backend API interactions.

## Chat Functionality

![chatdiagram](https://github.com/user-attachments/assets/990ab1be-8b2c-45c5-b4ed-9f604ce314b8)

Zooms into the chat flow: user input → /api/chat → Gemini AI with tools → streamed response & dynamic UI components.

## Screenshots

![screenshotsElara](https://github.com/user-attachments/assets/e2627e39-922b-4a2f-8c41-d0e575e83928)


## Setup & Run

1. **Clone Repo**

   ```bash
   git clone https://github.com/gaiborjosue/elaraFrontend.git
   cd elaraFrontend
   ```
2. **Install Dependencies**

   ```bash
   npm install
   ```
3. **Environment Variables** (create `.env.local`)

   ```env
   NEXT_PUBLIC_BACKEND_API_URL=https://<backend-cloud-run-url>
   GOOGLE_API_KEY=<your_google_api_key>
   ```
4. **Local Development**

   ```bash
   npm run dev
   ```
5. **Deploy to Cloud Run**

   ```bash
   gcloud builds submit --config cloudbuild.yaml --project="${GCP_PROJECT_ID}" --substitutions=_NEXT_PUBLIC_BACKEND_API_URL="https://elarabackend-114195159699.us-central1.run.app/"
   
   gcloud run deploy elarafrontend --image "${IMAGE_PATH}" --region "${REGION}" --service-account "${SERVICE_ACCOUNT_EMAIL}" --allow-unauthenticated --project "${GCP_PROJECT_ID}" --set-  secrets="GOOGLE_GENERATIVE_AI_API_KEY=google-api-key:latest,RUNTIME_NEXT_PUBLIC_BACKEND_API_URL=api-url:latest"
   ```

## New Features

### User Registration & Email Verification

- **Sign Up Flow**: Users can create accounts with email verification
- **Email Verification**: Automated email sending with verification links
- **Verification UI**: Dedicated pages for email verification status
- **Security**: Email verification required before login

## Folder Structure

```
├── app/                # Next.js App Router pages
│   ├── layout.tsx      # Global layout (AuthProvider)
│   ├── page.tsx        # Landing page with signup
│   ├── chat/page.tsx   # Chat interface
│   └── verify-email/   # Email verification page
├── components/         # Reusable UI components
│   ├── PlantInfoCard.tsx
│   ├── RecipeCard.tsx
│   ├── SavedRecipesDrawer.tsx
│   ├── LoginDialog.tsx
│   ├── SignupDialog.tsx        # New: User registration
│   └── EmailVerification.tsx   # New: Email verification UI
├── context/            # React Context (Auth with registration)
│   └── auth-context.tsx
├── pages/api/          # Next.js API routes
│   └── chat.ts         # /api/chat (AI orchestration)
├── styles/             # Tailwind CSS config
└── tsconfig.json       # TypeScript config
```

## Contact

For questions, reach out to the Elara team.
