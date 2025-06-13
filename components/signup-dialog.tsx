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
import { CheckCircle, Mail, AlertCircle } from 'lucide-react'

interface SignupDialogProps {
  children: React.ReactNode
}

export function SignupDialog({ children }: SignupDialogProps) {
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState<'signup' | 'verification' | 'success'>('signup')
  const [open, setOpen] = useState(false)
  const { register } = useAuth()
  const { toast } = useToast()

  const validateForm = () => {
    if (!email || !username || !password || !confirmPassword) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      })
      return false
    }

    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      })
      return false
    }

    if (password.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      })
      return false
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      toast({
        title: "Error",
        description: "Please enter a valid email address",
        variant: "destructive",
      })
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setIsLoading(true)
    try {
      const success = await register(email, username, password)
      
      if (success) {
        setStep('verification')
        toast({
          title: "Registration Successful",
          description: "Please check your email for verification instructions",
        })
      }
    } catch (error) {
      // Error handling is done in the register function
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendVerification = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API_URL}/resend-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      if (response.ok) {
        toast({
          title: "Email Sent",
          description: "Verification email has been resent",
        })
      } else {
        throw new Error('Failed to resend verification email')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to resend verification email",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setEmail('')
    setUsername('')
    setPassword('')
    setConfirmPassword('')
    setStep('signup')
  }

  const handleClose = () => {
    setOpen(false)
    setTimeout(resetForm, 200)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {step === 'signup' && 'Create Account'}
            {step === 'verification' && 'Verify Your Email'}
            {step === 'success' && 'Welcome to Elara!'}
          </DialogTitle>
          <DialogDescription>
            {step === 'signup' && 'Create your Elara account to access personalized herbal remedies'}
            {step === 'verification' && 'We sent a verification link to your email address'}
            {step === 'success' && 'Your account has been verified successfully'}
          </DialogDescription>
        </DialogHeader>

        {step === 'signup' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup-username">Username</Label>
              <Input
                id="signup-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Choose a username"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup-password">Password</Label>
              <Input
                id="signup-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a secure password"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                required
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-earth-600 hover:bg-earth-700"
              disabled={isLoading}
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>
        )}

        {step === 'verification' && (
          <div className="space-y-4 text-center">
            <div className="flex justify-center">
              <Mail className="h-16 w-16 text-earth-600" />
            </div>
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                We've sent a verification link to:
              </p>
              <p className="font-medium text-earth-700">{email}</p>
            </div>
            <div className="space-y-3">
              <p className="text-sm text-gray-500">
                Click the link in your email to verify your account and complete registration.
              </p>
              <Button 
                variant="outline" 
                onClick={handleResendVerification}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? 'Sending...' : 'Resend Verification Email'}
              </Button>
              <Button 
                variant="ghost" 
                onClick={handleClose}
                className="w-full"
              >
                Close
              </Button>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="space-y-4 text-center">
            <div className="flex justify-center">
              <CheckCircle className="h-16 w-16 text-green-600" />
            </div>
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                Your email has been verified successfully!
              </p>
              <p className="text-sm text-gray-500">
                You can now log in to your account.
              </p>
            </div>
            <Button 
              onClick={handleClose}
              className="w-full bg-earth-600 hover:bg-earth-700"
            >
              Continue to Login
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
