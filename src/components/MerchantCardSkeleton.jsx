import { memo } from "react"

function MerchantCardSkeleton() {
  return (
    <div className="card p-4 h-full animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-14 h-14 bg-slate-200 dark:bg-slate-700 rounded-2xl" />
        <div className="flex-1">
          <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-2" />
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
        </div>
      </div>
      <div className="mt-3">
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-2/3" />
      </div>
    </div>
  )
}

export default memo(MerchantCardSkeleton)

