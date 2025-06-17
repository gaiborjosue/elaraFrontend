"use client"

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useAuth } from '@/context/auth-context'
import { useToast } from '@/hooks/use-toast'
import { resendVerificationEmail, getEmailForUsername } from '@/lib/api'

interface LoginDialogProps {
  children: React.ReactNode
}

export function LoginDialog({ children }: LoginDialogProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [showResendVerification, setShowResendVerification] = useState(false)
  const [verificationEmail, setVerificationEmail] = useState('')
  const { login } = useAuth()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username || !password) {
      toast({
        title: "Error",
        description: "Please enter both username and password",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    const result = await login(username, password)
    
    if (result.success) {
      toast({
        title: "Success",
        description: "Logged in successfully!",
      })
      setOpen(false)
      setUsername('')
      setPassword('')
      setShowResendVerification(false)
    } else {
      if (result.error?.includes('verify your email')) {
        setShowResendVerification(true)
        // Try to fetch the email for this username
        try {
          const emailData = await getEmailForUsername(username)
          setVerificationEmail(emailData.email)
        } catch (error) {
          console.log('Could not fetch email for username')
        }
        toast({
          title: "Email Verification Required",
          description: "Please verify your email address to complete registration. Check your inbox and junk/spam folder.",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Error",
          description: result.error || "Invalid username or password",
          variant: "destructive",
        })
      }
    }
    setIsLoading(false)
  }

  const handleResendVerification = async () => {
    if (!verificationEmail) {
      toast({
        title: "Error",
        description: "Please enter your email address",
        variant: "destructive",
      })
      return
    }

    try {
      setIsLoading(true)
      await resendVerificationEmail(verificationEmail)
      toast({
        title: "Success",
        description: "Verification email sent! Please check your inbox and junk/spam folder.",
      })
      setShowResendVerification(false)
      setVerificationEmail('')
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to resend verification email",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      setOpen(newOpen)
      if (!newOpen) {
        // Reset state when dialog closes
        setShowResendVerification(false)
        setVerificationEmail('')
      }
    }}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Log In</DialogTitle>
          <DialogDescription>
            Enter your credentials to access Elara
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button 
            type="submit" 
            className="w-full bg-earth-600 hover:bg-earth-700"
            disabled={isLoading}
          >
            {isLoading ? 'Logging in...' : 'Log In'}
          </Button>
        </form>
        
        {showResendVerification && (
          <div className="mt-4 space-y-4 border-t pt-4">
            <p className="text-sm text-muted-foreground">
              Need to verify your email? Check your inbox and junk/spam folder.
            </p>
            <div className="space-y-2">
              <Label htmlFor="verification-email">Email Address</Label>
              <Input
                id="verification-email"
                type="email"
                placeholder="Enter your email"
                value={verificationEmail}
                onChange={(e) => setVerificationEmail(e.target.value)}
              />
            </div>
            <Button
              onClick={handleResendVerification}
              variant="outline"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Sending...' : 'Send verification email again'}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}