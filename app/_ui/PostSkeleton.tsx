export function PostSkeleton() {
  return (
    <div className="card animate-pulse flex gap-3 md:gap-4 items-start w-full">
      {/* Avatar skeleton */}
      <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 animate-pulse-slow flex-shrink-0" />

      <div className="flex-1 space-y-3 md:space-y-4">
        {/* Header skeleton */}
        <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-2">
          <div className="h-3 md:h-4 w-20 md:w-24 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded animate-pulse-slow" />
          <div className="h-3 w-16 md:w-16 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded animate-pulse-slow" />
          <div className="h-3 w-16 md:w-20 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded animate-pulse-slow md:ml-auto" />
        </div>

        {/* Content skeleton */}
        <div className="space-y-2">
          <div className="h-4 md:h-5 w-3/4 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded animate-pulse-slow" />
          <div className="h-4 md:h-5 w-1/2 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded animate-pulse-slow" />
        </div>

        {/* Poll options skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3 mt-3 md:mt-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-10 md:h-12 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-xl animate-pulse-slow" />
              <div className="h-2 md:h-3 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-full animate-pulse-slow" />
            </div>
          ))}
        </div>

        {/* Actions skeleton */}
        <div className="flex gap-4 md:gap-6 mt-3 md:mt-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-8 w-8 md:h-6 md:w-6 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-full animate-pulse-slow"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
