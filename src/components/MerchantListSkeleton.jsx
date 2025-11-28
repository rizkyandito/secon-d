import { memo, useMemo } from "react"
import MerchantCardSkeleton from "./MerchantCardSkeleton"

function MerchantListSkeleton({ count = 6 }) {
  const skeletons = useMemo(
    () => Array.from({ length: count }, (_, i) => <MerchantCardSkeleton key={i} />),
    [count]
  )

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {skeletons}
    </div>
  )
}

export default memo(MerchantListSkeleton)

