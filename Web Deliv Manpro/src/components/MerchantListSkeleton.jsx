import MerchantCardSkeleton from "./MerchantCardSkeleton"

export default function MerchantListSkeleton({ count = 6 }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <MerchantCardSkeleton key={i} />
      ))}
    </div>
  )
}

