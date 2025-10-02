import { LoadingSpinner } from "@/components/ui/loading-spinner"

export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
      <div className="flex items-center gap-3">
        <LoadingSpinner size="lg" />
        <span className="text-white text-lg">Loading...</span>
      </div>
    </div>
  )
}
