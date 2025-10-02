"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Check, User } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import { authService, userService } from "@/lib/api"
import { toast } from "sonner"
import { getAccessToken } from '@privy-io/react-auth';

export function OnboardingView() {
  const { user, accountLogin, profile, updateProfile, walletAddress } = useAuth()
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    fullName: profile?.fullName || "",
    username: profile?.username || "",
    age: profile?.age?.toString() || "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [usernameChecking, setUsernameChecking] = useState(false)
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null)

  console.log(user, profile)

  if (user) {
    // const privyToken = getAccessToken()

    getAccessToken().then((privyToken) => {
      console.log("privyToken", privyToken)
      accountLogin({
        walletAddress: walletAddress || "",
        privyToken: privyToken || "",
      })
    })
  }

  const checkUsername = async (username: string) => {
    if (username.length < 3) {
      setUsernameAvailable(null)
      return
    }

    setUsernameChecking(true)
    try {
      const result = await userService.checkUsername(username)
      console.log("result", result)
      setUsernameAvailable(result.available)
    } catch (error) {
      console.error("Username check failed:", error)
      setUsernameAvailable(null)
    } finally {
      setUsernameChecking(false)
    }
  }

  const handleNext = async () => {
    console.log("🔵 handleNext called, step:", step, "isStepValid():", isStepValid())
    if (step < 3) {
      console.log("🔵 Moving to next step")
      setStep(step + 1)
    } else {
      console.log("🔵 On step 3, calling handleComplete...")
      await handleComplete()
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  const handleComplete = async () => {
    console.log("🟢 handleComplete called")
    console.log("🟢 user exists:", !!user)
    console.log("🟢 walletAddress exists:", !!walletAddress)
    
    if (!user || !walletAddress) {
      console.log("🟢 Early return - missing user or wallet")
      return
    }

    console.log("🟢 Starting submission...")
    setIsSubmitting(true)
    
    try {
      // Register user with backend
      console.log("🟢 Calling backend registration API...")
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          privyId: user.id,
          walletAddress,
          username: formData.username,
          fullName: formData.fullName,
          age: Number.parseInt(formData.age),
          email: user.email?.address || undefined,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Registration failed")
      }

      const result = await response.json()
      console.log("🟢 Registration successful:", result)

      // Update profile locally as well
      console.log("🟢 Updating local profile...")
      await updateProfile({
        fullName: formData.fullName,
        username: formData.username,
        age: Number.parseInt(formData.age),
      })
      console.log("🟢 Profile update successful")

      toast.success("Profile setup complete!")
      console.log("🟢 Redirecting to dashboard...")
      router.push("/dashboard")
    } catch (error) {
      console.error("❌ Onboarding failed:", error)
      toast.error(error instanceof Error ? error.message : "Failed to complete setup. Please try again.")
    } finally {
      console.log("🟢 Setting isSubmitting to false")
      setIsSubmitting(false)
    }
  }

  const isStepValid = () => {
    switch (step) {
      case 1:
        return formData.fullName.trim().length > 0
      case 2:
        return formData.username.trim().length >= 3 && usernameAvailable === true
      case 3:
        return formData.age.trim().length > 0 && Number.parseInt(formData.age) >= 18
      default:
        return false
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto glass-effect border-teal-500/20">
      <CardHeader className="text-center">
        <div className="w-12 h-12 mx-auto rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center mb-4">
          <User className="h-6 w-6 text-white" />
        </div>
        <CardTitle className="text-xl font-bold text-white">Complete Your Profile</CardTitle>
        <CardDescription className="text-slate-400">Step {step} of 3</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex justify-between mb-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                i <= step ? "bg-gradient-to-br from-teal-500 to-emerald-500 text-white" : "bg-slate-700 text-slate-400"
              }`}
            >
              {i < step ? <Check className="h-4 w-4" /> : i}
            </div>
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label htmlFor="fullName" className="text-white block text-sm font-medium mb-1">
                Full Name
              </label>
              <input
                id="fullName"
                placeholder="Enter your full name"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
              />
            </div>
            <p className="text-sm text-slate-400">This will be displayed on your profile and transactions.</p>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <label htmlFor="username" className="text-white block text-sm font-medium mb-1">
                Username
              </label>
              <div className="relative">
                <input
                  id="username"
                  placeholder="Choose a unique username"
                  value={formData.username}
                  onChange={(e) => {
                    const username = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "")
                    setFormData({ ...formData, username })
                    checkUsername(username)
                  }}
                  className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                />
                {usernameChecking && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
              {formData.username.length >= 3 && !usernameChecking && (
                <p className={`text-sm ${usernameAvailable ? "text-emerald-400" : "text-red-400"}`}>
                  {usernameAvailable ? "✓ Username available" : "✗ Username taken"}
                </p>
              )}
            </div>
            <p className="text-sm text-slate-400">Others can send you money using this username.</p>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div>
              <label htmlFor="age" className="text-white block text-sm font-medium mb-1">
                Age
              </label>
              <input
                id="age"
                type="number"
                placeholder="Enter your age"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
              />
            </div>
            <p className="text-sm text-slate-400">You must be 18 or older to use PayZen.</p>
          </div>
        )}

        {/* Debug info */}
        <div className="text-xs text-slate-500 p-2 bg-slate-800/30 rounded">
          <div>Step: {step}</div>
          <div>isStepValid: {isStepValid().toString()}</div>
          <div>isSubmitting: {isSubmitting.toString()}</div>
          <div>Button disabled: {(!isStepValid() || isSubmitting).toString()}</div>
          <div>Form data: {JSON.stringify(formData)}</div>
          <div>Username available: {usernameAvailable?.toString()}</div>
        </div>

        <div className="flex gap-3">
          {step > 1 && (
            <Button variant="outline" onClick={handleBack} className="flex-1 bg-transparent">
              Back
            </Button>
          )}
          <Button
            onClick={handleNext}
            disabled={!isStepValid() || isSubmitting}
            className="flex-1 gradient-primary text-white"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Setting up...
              </>
            ) : step === 3 ? (
              "Complete Setup"
            ) : (
              "Next"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
