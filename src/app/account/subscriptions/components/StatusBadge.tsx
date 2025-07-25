//src/app/account/subscriptions/components/StatusBadge.tsx
"use client";

interface StatusBadgeProps {
  status: string;
}

const StatusBadge = ({ status }: StatusBadgeProps) => {
  let bgColor = "bg-gray-100 text-gray-800";
  
  switch (status.toLowerCase()) {
    case "active":
      bgColor = "bg-green-100 text-green-800";
      break;
    case "paused":
      bgColor = "bg-yellow-100 text-yellow-800";
      break;
    case "cancelled":
    case "canceled":
      bgColor = "bg-red-100 text-red-800";
      break;
    case "cancelling":
      bgColor = "bg-orange-100 text-orange-800";
      break;
    case "pending":
      bgColor = "bg-blue-100 text-blue-800";
      break;
    case "past_due":
      bgColor = "bg-orange-100 text-orange-800";
      break;
    case "trialing":
      bgColor = "bg-purple-100 text-purple-800";
      break;
    default:
      bgColor = "bg-gray-100 text-gray-800";
  }
  
  // Display a clear status text
  const displayStatus = () => {
    switch (status.toLowerCase()) {
      case "cancelling":
        return "Cancelling"; // Show "Cancelling" for period-end cancellation
      case "cancelled":
      case "canceled":
        return "Cancelled"; // Show "Cancelled" for immediate cancellation
      case "past_due":
        return "Past Due";
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bgColor}`}>
      {displayStatus()}
    </span>
  );
};

export default StatusBadge;