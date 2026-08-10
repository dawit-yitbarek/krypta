import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

interface CoinListSkeletonProps {
    count?: number
    collapsed?: boolean
}

export function CoinListSkeleton({ count = 12, collapsed = false }: CoinListSkeletonProps) {

    return (
        <div className="flex flex-col gap-1 py-1 px-1.5 w-full select-none">
            {Array.from({ length: count }).map((_, i) => {

                return (
                    <div
                        key={i}
                        className={cn(
                            "flex items-center justify-between px-2 py-2 rounded-md w-full bg-[#18181b]/40 border border-[#27272a]/40",
                            collapsed && "justify-center px-0 bg-transparent border-none"
                        )}
                    >

                        <div className="flex items-center gap-2.5 min-w-0">
                            <Skeleton className="w-8 h-8 rounded-full shrink-0 bg-[#3f3f46] shadow-sm shadow-[#3f3f46]/20" />

                            {!collapsed && (
                                <div className="flex flex-col gap-1.5">
                                    <Skeleton className="h-3.5 rounded-sm bg-[#52525b] w-16" />
                                    <Skeleton className="h-2.5 w-10 rounded-sm bg-[#3f3f46]/80" />
                                </div>
                            )}
                        </div>

                        {!collapsed && (
                            <div className="flex flex-col items-end gap-1.5 pl-1 shrink-0">
                                <Skeleton className="h-3.5 rounded-sm bg-[#52525b] w-14" />
                                <Skeleton className="h-2.5 w-8 rounded-sm bg-[#3f3f46]/80" />
                            </div>
                        )}
                    </div>
                )
            })}
        </div>
    )
}