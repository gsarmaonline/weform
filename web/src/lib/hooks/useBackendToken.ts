'use client'

import { useSession } from 'next-auth/react'
import { useEffect } from 'react'

export function useBackendToken() {
  const { data: session } = useSession()

  useEffect(() => {
    if (session?.backendToken) {
      sessionStorage.setItem('backendToken', session.backendToken)
    } else {
      sessionStorage.removeItem('backendToken')
    }
  }, [session?.backendToken])
}
