"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Home, Search } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md glass-effect border-teal-500/20">
        <CardHeader className="text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-teal-500/20 flex items-center justify-center mb-4">
            <Search className="h-8 w-8 text-teal-400" />
          </div>
          <CardTitle className="text-2xl text-white">Page Not Found</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-slate-400">The page you're looking for doesn't exist or has been moved.</p>
          <Link href="/dashboard">
            <Button className="w-full gradient-primary text-white">
              <Home className="mr-2 h-4 w-4" />
              Go to Dashboard
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
