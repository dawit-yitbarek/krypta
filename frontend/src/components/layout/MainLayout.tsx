import { Outlet } from "react-router-dom"
import { Sidebar } from "@/components/layout/Sidebar"
import { Toaster } from "@/components/ui/toaster"
import { useTicker } from "@/context/TickerContext"
import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"

export function MainLayout() {
    const { sidebarCollapsed } = useTicker()
    const isMobile = useIsMobile()

    return (
        <div className="flex h-dvh w-screen bg-[#09090b] text-[#e4e4e7] overflow-hidden select-none">
            {/* Fixed Sidebar */}
            <Sidebar />
            <Toaster />

            <main
                className={cn(
                    "flex-1 flex flex-col min-w-0 h-full p-1.5 overflow-y-auto transition-all duration-200",
                    sidebarCollapsed ? (isMobile ? "pl-16" : "pl-13") : (isMobile ? "pl-0" : "pl-73")
                )}
            >
                <Outlet />
            </main>
        </div>
    )
}