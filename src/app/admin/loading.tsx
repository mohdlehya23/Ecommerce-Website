export default function AdminLoading() {
  return (
    <div className="container-wide py-6">
      {/* Header skeleton */}
      <div className="mb-8">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-2" />
        <div className="h-4 w-64 bg-gray-100 rounded animate-pulse" />
      </div>

      {/* Stats skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="card p-4">
            <div className="h-4 w-20 bg-gray-200 rounded animate-pulse mb-2" />
            <div className="h-8 w-16 bg-gray-300 rounded animate-pulse" />
          </div>
        ))}
      </div>

      {/* Table skeleton */}
      <div className="card p-6">
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}
