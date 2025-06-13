import { Suspense } from 'react'
import { EmailVerification } from '@/components/email-verification'

function EmailVerificationFallback() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin h-8 w-8 border-4 border-earth-600 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<EmailVerificationFallback />}>
      <EmailVerification />
    </Suspense>
  )
}
