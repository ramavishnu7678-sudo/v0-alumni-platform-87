export default function ResetPasswordLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md border border-border/50 rounded-lg shadow-lg overflow-hidden bg-card">
        {/* Header */}
        <div className="p-6 space-y-2 text-center border-b border-border/50">
          <div className="h-8 w-32 bg-muted rounded mx-auto animate-pulse" />
          <div className="h-4 w-40 bg-muted rounded mx-auto mt-2 animate-pulse" />
          <div className="h-3 w-48 bg-muted rounded mx-auto mt-4 animate-pulse" />
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Password Input */}
          <div className="space-y-2">
            <div className="h-4 w-24 bg-muted rounded animate-pulse" />
            <div className="h-11 bg-muted rounded animate-pulse" />
          </div>

          {/* Confirm Password Input */}
          <div className="space-y-2">
            <div className="h-4 w-24 bg-muted rounded animate-pulse" />
            <div className="h-11 bg-muted rounded animate-pulse" />
          </div>

          {/* Password Requirements */}
          <div className="space-y-2">
            <div className="h-3 w-32 bg-muted rounded animate-pulse" />
            <div className="space-y-1">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-3 w-full bg-muted rounded animate-pulse" />
              ))}
            </div>
          </div>

          {/* Reset Button */}
          <div className="h-11 bg-muted rounded animate-pulse mt-6" />

          {/* Back to login */}
          <div className="pt-4 text-center">
            <div className="h-4 w-32 bg-muted rounded mx-auto animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  )
}
