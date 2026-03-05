export default function ProfileLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-32 bg-muted animate-pulse rounded" />
          <div className="h-4 w-64 bg-muted animate-pulse rounded" />
        </div>
        <div className="h-10 w-24 bg-muted animate-pulse rounded" />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Overview Skeleton */}
        <div className="md:col-span-1 border border-border/50 rounded-lg p-6">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="h-24 w-24 bg-muted animate-pulse rounded-full" />
            </div>
            <div className="space-y-2">
              <div className="h-6 w-32 bg-muted animate-pulse rounded mx-auto" />
              <div className="h-4 w-40 bg-muted animate-pulse rounded mx-auto" />
              <div className="h-6 w-16 bg-muted animate-pulse rounded mx-auto" />
            </div>
          </div>
          <div className="space-y-3 mt-6">
            <div className="h-4 w-full bg-muted animate-pulse rounded" />
            <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
            <div className="h-4 w-5/6 bg-muted animate-pulse rounded" />
          </div>
        </div>

        {/* Profile Details Skeleton */}
        <div className="md:col-span-2 border border-border/50 rounded-lg p-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="h-6 w-48 bg-muted animate-pulse rounded" />
              <div className="h-4 w-64 bg-muted animate-pulse rounded" />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-4">
                <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                <div className="space-y-2">
                  <div className="h-4 w-full bg-muted animate-pulse rounded" />
                  <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
                </div>
              </div>
              <div className="space-y-4">
                <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                <div className="space-y-2">
                  <div className="h-4 w-full bg-muted animate-pulse rounded" />
                  <div className="h-4 w-2/3 bg-muted animate-pulse rounded" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
