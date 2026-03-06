export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <div className="h-8 w-48 animate-pulse rounded-lg bg-secondary" />
        <div className="mt-2 h-4 w-72 animate-pulse rounded-md bg-secondary" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="glass-card flex flex-col gap-3 rounded-2xl p-5"
          >
            <div className="flex items-center justify-between">
              <div className="h-4 w-20 animate-pulse rounded bg-secondary" />
              <div className="h-8 w-8 animate-pulse rounded-xl bg-secondary" />
            </div>
            <div>
              <div className="h-7 w-28 animate-pulse rounded bg-secondary" />
              <div className="mt-1 h-3 w-16 animate-pulse rounded bg-secondary" />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <div className="glass-card h-72 animate-pulse rounded-2xl bg-secondary" />
        </div>
        <div className="lg:col-span-2">
          <div className="glass-card h-72 animate-pulse rounded-2xl bg-secondary" />
        </div>
      </div>

      <div className="glass-card rounded-2xl p-5">
        <div className="mb-4 h-5 w-40 animate-pulse rounded bg-secondary" />
        <div className="space-y-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between px-2 py-3">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 animate-pulse rounded-full bg-secondary" />
                <div>
                  <div className="h-4 w-24 animate-pulse rounded bg-secondary" />
                  <div className="mt-1 h-3 w-16 animate-pulse rounded bg-secondary" />
                </div>
              </div>
              <div className="text-right">
                <div className="h-4 w-16 animate-pulse rounded bg-secondary" />
                <div className="mt-1 h-3 w-12 animate-pulse rounded bg-secondary" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
