"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Menu } from "lucide-react"
// No need for useRouter if using window.location.reload()

interface SharedHeaderProps {
  pageType: "landing" | "chat"
}

export function SharedHeader({ pageType }: SharedHeaderProps) {
  const handleNewChat = () => {
    window.location.reload()
  }

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between px-6 py-4 bg-white shadow-sm">
      <div className="flex items-center space-x-2">
        <div className="w-6 h-6 bg-earth-600 rounded"></div>
        <span className="text-xl font-semibold text-gray-900">Elara</span>
        <span className="ml-2 text-xs text-gray-500 font-normal">(Informational purposes only)</span>
      </div>
      {pageType === "landing" && (
        <Link href="/chat">
          <Button className="bg-earth-600 hover:bg-earth-700 text-white px-6 py-2 rounded-full">Start Chat</Button>
        </Link>
      )}
      {pageType === "chat" && (
        <div className="flex items-center space-x-4">
          <Button onClick={handleNewChat} className="bg-earth-600 hover:bg-earth-700 text-white px-6 py-2 rounded-full">
            Start new chat
          </Button>
          <Button variant="ghost" size="icon" aria-label="Menu">
            <Menu className="h-5 w-5" />
          </Button>
          <Avatar>
            <AvatarImage src="/placeholder.svg?height=40&width=40" />
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
        </div>
      )}
    </header>
  )
}
