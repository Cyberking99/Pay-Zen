import { LoadingSpinner } from "@/components/ui/loading-spinner"

export default function Loading() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="flex items-center gap-3">
        <LoadingSpinner size="lg" />
        <span className="text-white text-lg">Loading...</span>
      </div>
    </div>
  )
}
