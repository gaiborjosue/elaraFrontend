"use client"
import Link from "next/link"
import Image from "next/legacy/image"
import { Button } from "@/components/ui/button"
import { SharedHeader } from "@/components/shared-header"
import { useAuth } from "@/context/auth-context"
import { LoginDialog } from "@/components/login-dialog"
import { SignupDialog } from "@/components/signup-dialog"

function DynamicCenterButton() {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <Button 
        disabled 
        className="bg-earth-600 hover:bg-earth-700 text-white px-12 py-6 text-2xl rounded-full shadow-xl"
      >
        Loading...
      </Button>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center space-y-4">
        <LoginDialog>
          <Button className="bg-earth-600 hover:bg-earth-700 text-white px-12 py-6 text-2xl rounded-full shadow-xl transition-transform hover:scale-110">
            Log In
          </Button>
        </LoginDialog>
        <SignupDialog>
          <Button variant="outline" className="border-earth-600 text-earth-600 hover:bg-earth-50 px-8 py-3 text-lg rounded-full transition-transform hover:scale-110">
            Sign Up
          </Button>
        </SignupDialog>
      </div>
    )
  }

  return (
    <Link href="/chat">
      <Button className="bg-earth-600 hover:bg-earth-700 text-white px-12 py-6 text-2xl rounded-full shadow-xl transition-transform hover:scale-110">
        Start Chat
      </Button>
    </Link>
  )
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <SharedHeader pageType="landing" />

      <main className="relative flex items-center justify-center flex-1 overflow-hidden px-4">
        {/* Nature hand */}
        <div
          className="
            absolute top-1/2 left-[-10vw]
            w-[120vw]
            transform -translate-y-1/2
            mt-6
            pointer-events-none
          "
        >
          <Image
            src="/images/earthHand.svg"
            alt="A hand made of leaves and branches, representing nature"
            width={1920}
            height={1080}
            className="w-full h-auto object-contain"
          />
        </div>

        {/* Dynamic Button */}
        <div className="z-10 flex flex-col items-center">
          <DynamicCenterButton />
        </div>

        {/* Human hand */}
        <div
          className="
            absolute top-1/2 right-[-10vw]
            w-[120vw]
            transform -translate-y-1/2
            mt-6
            pointer-events-none
          "
        >
          <Image
            src="/images/humanHand.svg"
            alt="A human hand reaching out"
            width={1920}
            height={1080}
            className="w-full h-auto object-contain"
          />
        </div>
        <footer className="absolute bottom-8 left-0 right-0 z-10 px-4">
          <p className="text-center text-gray-500 text-base max-w-md mx-auto">
            Learn about natural plant alternatives to your health conditions
          </p>
          <p className="text-center text-gray-400 text-sm mt-2">
            Made by:{" "}
            <a 
              href="https://edwardgaibor.me" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-earth-600 transition-colors"
            >
              Edward
            </a>
            {" and "}
            <a 
              href="https://dariadobrolinski.me" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-earth-600 transition-colors"
            >
              Daria
            </a>
          </p>
        </footer>
      </main>
    </div>
  )
}
