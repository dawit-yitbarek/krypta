import { BrowserRouter, Routes, Route } from "react-router-dom"
import { MainLayout } from "@/components/layout/MainLayout"
import { HomePage } from "@/pages/HomePage"
import { TradePage } from "@/pages/TradePage"
import { BinanceSocketProvider } from "@/context/BinanceSocketContext"
import { TickerProvider } from "./context/TickerContext"

export default function App() {

  return (
    <BinanceSocketProvider>
      <TickerProvider>
        <BrowserRouter>
          <Routes>
            <Route
              element={
                <MainLayout />
              }
            >
              <Route path="/" element={<HomePage />} />
              <Route path="/trade/:symbol" element={<TradePage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </TickerProvider>
    </BinanceSocketProvider>
  )
}