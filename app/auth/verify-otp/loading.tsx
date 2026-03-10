import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export default function VerifyOtpLoading() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="w-full max-w-md border-border/50">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-2xl">Verify OTP</CardTitle>
          <CardDescription>
            <Skeleton className="h-4 w-48 mx-auto" />
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Email skeleton */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>

          {/* OTP input skeleton */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>

          {/* Timer skeleton */}
          <div className="flex justify-between items-center">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-6 w-16" />
          </div>

          {/* Verify button skeleton */}
          <Skeleton className="h-10 w-full rounded-md" />

          {/* Resend button skeleton */}
          <Skeleton className="h-9 w-full rounded-md" />

          {/* Back button skeleton */}
          <Skeleton className="h-9 w-full rounded-md" />
        </CardContent>
      </Card>
    </div>
  )
}
