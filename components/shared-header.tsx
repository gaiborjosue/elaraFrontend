"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Menu, LogOut, BookOpen } from "lucide-react"
import { LoginDialog } from "@/components/login-dialog"
import { useAuth } from "@/context/auth-context"
import { SavedRecipesDrawer } from "@/components/saved-recipes-drawer"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface SharedHeaderProps {
  pageType: "landing" | "chat"
}

export function SharedHeader({ pageType }: SharedHeaderProps) {
  const { isAuthenticated, user, logout } = useAuth()
  
  const handleNewChat = () => {
    window.location.reload()
  }

  const handleLogout = () => {
    logout()
    if (pageType === "chat") {
      window.location.href = "/"
    }
  }

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between px-6 py-4 bg-white shadow-sm">
      <div className="flex items-center space-x-2">
        <div className="w-6 h-6 bg-earth-600 rounded"></div>
        <span className="text-xl font-semibold text-gray-900">Elara</span>
        <span className="ml-2 text-xs text-gray-500 font-normal">(Informational purposes only)</span>
      </div>
      
      {pageType === "landing" && isAuthenticated && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <SavedRecipesDrawer>
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <BookOpen className="mr-2 h-4 w-4" />
                Saved Recipes
              </DropdownMenuItem>
            </SavedRecipesDrawer>
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Log Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      
      {pageType === "chat" && (
        <div className="flex items-center space-x-4">
          <Button onClick={handleNewChat} className="bg-earth-600 hover:bg-earth-700 text-white px-6 py-2 rounded-full">
            Start new chat
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <SavedRecipesDrawer>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  <BookOpen className="mr-2 h-4 w-4" />
                  Saved Recipes
                </DropdownMenuItem>
              </SavedRecipesDrawer>
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Log Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </header>
  )
}
