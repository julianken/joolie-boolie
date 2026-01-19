import { Skeleton, SkeletonCard, SkeletonButton, SkeletonText } from '@beak-gaming/ui';

/**
 * Loading skeleton for the Bingo presenter page.
 * Matches the layout of PlayPage for smooth transitions.
 */
export default function BingoPlayLoading() {
  return (
    <main className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header skeleton */}
        <header className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <Skeleton width={200} height={40} className="mb-2" />
            <Skeleton width={140} height={24} />
          </div>

          {/* Display controls skeleton */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Skeleton variant="circular" width={12} height={12} />
              <Skeleton width={80} height={20} className="hidden sm:block" />
            </div>
            <SkeletonButton size="md" width={120} />
          </div>
        </header>

        {/* Main content grid skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left column: Bingo Board */}
          <section className="lg:col-span-4 space-y-6">
            {/* Called Numbers card */}
            <div className="bg-background border border-border rounded-xl p-4 shadow-sm">
              <Skeleton width={150} height={28} className="mb-4" />
              {/* Bingo board grid placeholder */}
              <div className="grid grid-cols-5 gap-2">
                {Array.from({ length: 75 }).map((_, i) => (
                  <Skeleton
                    key={i}
                    variant="circular"
                    width={36}
                    height={36}
                  />
                ))}
              </div>
            </div>

            {/* Recent Balls card */}
            <div className="bg-background border border-border rounded-xl p-4 shadow-sm">
              <Skeleton width={120} height={24} className="mb-3" />
              <div className="flex gap-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton
                    key={i}
                    variant="circular"
                    width={48}
                    height={48}
                  />
                ))}
              </div>
            </div>
          </section>

          {/* Center column: Current Ball + Controls */}
          <section className="lg:col-span-4 space-y-6">
            {/* Current Ball Display */}
            <div className="bg-background border border-border rounded-xl p-6 shadow-sm flex flex-col items-center gap-4">
              <Skeleton width={120} height={28} />
              <Skeleton variant="circular" width={160} height={160} />
              <div className="flex items-center gap-2">
                <Skeleton width={80} height={20} />
                <Skeleton variant="circular" width={40} height={40} />
              </div>
              <Skeleton width={140} height={20} />
            </div>

            {/* Control Panel */}
            <div className="bg-background border border-border rounded-xl p-4 shadow-sm">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <SkeletonButton size="lg" width="100%" />
                  <SkeletonButton size="lg" width="100%" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <SkeletonButton size="md" width="100%" />
                  <SkeletonButton size="md" width="100%" />
                  <SkeletonButton size="md" width="100%" />
                </div>
              </div>
            </div>
          </section>

          {/* Right column: Settings */}
          <section className="lg:col-span-4 space-y-6">
            {/* Pattern Selection */}
            <div className="bg-background border border-border rounded-xl p-4 shadow-sm space-y-4">
              <Skeleton width={140} height={24} className="mb-2" />
              <Skeleton width="100%" height={44} />
              {/* Pattern preview grid */}
              <div className="grid grid-cols-5 gap-1 w-32 mx-auto">
                {Array.from({ length: 25 }).map((_, i) => (
                  <Skeleton key={i} width={20} height={20} />
                ))}
              </div>
            </div>

            {/* Settings card */}
            <div className="bg-background border border-border rounded-xl p-4 shadow-sm space-y-6">
              <Skeleton width={100} height={28} />

              {/* Toggle rows */}
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <Skeleton width={120} height={20} />
                  <Skeleton width={48} height={28} className="rounded-full" />
                </div>
              ))}

              {/* Slider */}
              <div className="space-y-2">
                <Skeleton width={100} height={20} />
                <Skeleton width="100%" height={8} className="rounded-full" />
              </div>

              {/* Voice selector */}
              <Skeleton width="100%" height={44} />
            </div>

            {/* Keyboard shortcuts card */}
            <div className="bg-background border border-border rounded-xl p-4 shadow-sm">
              <Skeleton width={180} height={24} className="mb-3" />
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex justify-between">
                    <Skeleton width={100} height={18} />
                    <Skeleton width={60} height={28} />
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
