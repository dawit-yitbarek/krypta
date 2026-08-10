import { Outlet } from "react-router-dom"
import { Sidebar } from "@/components/layout/Sidebar"
import { Toaster } from "@/components/ui/toaster"


export function MainLayout() {

    return (
        <div className="flex h-screen bg-[#09090b] text-[#e4e4e7] overflow-hidden select-none">
            <Sidebar />
            <Toaster />

            <main className="flex-1 flex flex-col min-w-0 min-h-0 p-1.5 overflow-hidden">
                <Outlet />
            </main>
        </div>
    )
}