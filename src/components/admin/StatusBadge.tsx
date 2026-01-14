export function StatusBadge({
  status,
  type,
}: {
  status: string;
  type: "payment" | "seller" | "payout" | "product";
}) {
  const getColorClasses = () => {
    if (type === "payment") {
      switch (status) {
        case "completed":
          return "bg-green-100 text-green-800 border-green-200";
        case "pending":
          return "bg-yellow-100 text-yellow-800 border-yellow-200";
        case "failed":
          return "bg-red-100 text-red-800 border-red-200";
        default:
          return "bg-gray-100 text-gray-800 border-gray-200";
      }
    }

    if (type === "seller") {
      switch (status) {
        case "active":
          return "bg-green-100 text-green-800 border-green-200";
        case "pending":
          return "bg-yellow-100 text-yellow-800 border-yellow-200";
        case "payouts_locked":
          return "bg-orange-100 text-orange-800 border-orange-200";
        case "suspended":
          return "bg-red-100 text-red-800 border-red-200";
        default:
          return "bg-gray-100 text-gray-800 border-gray-200";
      }
    }

    if (type === "payout") {
      switch (status) {
        case "completed":
          return "bg-green-100 text-green-800 border-green-200";
        case "processing":
          return "bg-blue-100 text-blue-800 border-blue-200";
        case "pending":
          return "bg-yellow-100 text-yellow-800 border-yellow-200";
        case "held":
          return "bg-orange-100 text-orange-800 border-orange-200";
        case "failed":
          return "bg-red-100 text-red-800 border-red-200";
        default:
          return "bg-gray-100 text-gray-800 border-gray-200";
      }
    }

    if (type === "product") {
      switch (status) {
        case "published":
          return "bg-green-100 text-green-800 border-green-200";
        case "draft":
          return "bg-gray-100 text-gray-800 border-gray-200";
        case "archived":
          return "bg-red-100 text-red-800 border-red-200";
        default:
          return "bg-gray-100 text-gray-800 border-gray-200";
      }
    }

    return "bg-gray-100 text-gray-800 border-gray-200";
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getColorClasses()}`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1).replace("_", " ")}
    </span>
  );
}
