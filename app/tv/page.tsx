"use client"

import { TVDisplay } from "@/components/tv/tv-display"
import { Suspense } from "react"

export default function DefaultTVPage() {
  return (
    <Suspense fallback={<div className="bg-[#003B71] h-screen w-screen" />}>
      <TVDisplay />
    </Suspense>
  )
}
