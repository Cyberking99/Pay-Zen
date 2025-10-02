"use client"

import { useAuth } from "@/hooks/use-auth"
import { AuthView } from "@/components/auth/auth-view"
import { OnboardingView } from "@/components/auth/onboarding-view"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { useIsRegistered } from "@/hooks/use-blockchain"

export default function HomePage() {
  const { ready, authenticated, loading } = useAuth()
  const router = useRouter()
  const { isRegistered, loading: regLoading } = useIsRegistered()

  useEffect(() => {
    console.log("isRegistered", isRegistered)
    if (ready && authenticated && isRegistered) {
      router.push("/dashboard")
    }
  }, [ready, authenticated, isRegistered, router])

  if (!ready || loading || (authenticated && regLoading && isRegistered === null)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Initializing...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      {!authenticated ? <AuthView /> : isRegistered ? null : <OnboardingView />}
    </div>
  )
}
