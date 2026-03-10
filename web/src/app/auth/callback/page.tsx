'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function CallbackHandler() {
  const router = useRouter()
  const params = useSearchParams()

  useEffect(() => {
    const token = params.get('token')
    if (token) {
      // Store JWT in a cookie readable by middleware
      const maxAge = 60 * 60 * 24 * 7 // 7 days
      document.cookie = `backend_token=${encodeURIComponent(token)}; path=/; max-age=${maxAge}; SameSite=Lax`
      router.replace('/dashboard')
    } else {
      router.replace('/auth/signin?error=missing_token')
    }
  }, [params, router])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-muted-foreground text-sm">Signing you in...</p>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense>
      <CallbackHandler />
    </Suspense>
  )
}
