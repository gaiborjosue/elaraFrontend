"use client"

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { useToast } from '@/hooks/use-toast'

export function EmailVerification() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'expired'>('loading')
  const [message, setMessage] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token')
      
      if (!token) {
        setStatus('error')
        setMessage('Invalid verification link')
        return
      }

      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API_URL}/verify-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        })

        const data = await response.json()

        if (response.ok) {
          setStatus('success')
          setMessage('Your email has been verified successfully!')
          toast({
            title: "Email Verified",
            description: "Your account is now active. You can log in.",
          })
        } else if (response.status === 410) {
          setStatus('expired')
          setMessage('This verification link has expired. Please request a new one.')
        } else {
          setStatus('error')
          setMessage(data.detail || 'Email verification failed')
        }
      } catch (error) {
        setStatus('error')
        setMessage('An error occurred during verification')
      }
    }

    verifyEmail()
  }, [searchParams, toast])

  const handleResendVerification = async () => {
    const email = searchParams.get('email')
    if (!email) {
      toast({
        title: "Error",
        description: "Email address not found. Please try registering again.",
        variant: "destructive",
      })
      return
    }

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
          description: "A new verification email has been sent",
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
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
        {status === 'loading' && (
          <div className="space-y-4">
            <Loader2 className="h-16 w-16 text-earth-600 mx-auto animate-spin" />
            <h2 className="text-xl font-semibold text-gray-900">Verifying Your Email</h2>
            <p className="text-gray-600">Please wait while we verify your email address...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-4">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto" />
            <h2 className="text-xl font-semibold text-gray-900">Email Verified!</h2>
            <p className="text-gray-600">{message}</p>
            <Button 
              onClick={() => router.push('/')}
              className="bg-earth-600 hover:bg-earth-700"
            >
              Continue to Elara
            </Button>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4">
            <AlertCircle className="h-16 w-16 text-red-600 mx-auto" />
            <h2 className="text-xl font-semibold text-gray-900">Verification Failed</h2>
            <p className="text-gray-600">{message}</p>
            <Button 
              onClick={() => router.push('/')}
              variant="outline"
            >
              Return to Home
            </Button>
          </div>
        )}

        {status === 'expired' && (
          <div className="space-y-4">
            <AlertCircle className="h-16 w-16 text-orange-600 mx-auto" />
            <h2 className="text-xl font-semibold text-gray-900">Link Expired</h2>
            <p className="text-gray-600">{message}</p>
            <div className="space-y-2">
              <Button 
                onClick={handleResendVerification}
                className="w-full bg-earth-600 hover:bg-earth-700"
              >
                Resend Verification Email
              </Button>
              <Button 
                onClick={() => router.push('/')}
                variant="outline"
                className="w-full"
              >
                Return to Home
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
