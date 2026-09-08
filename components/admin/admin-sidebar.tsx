"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Building2, ImageIcon, MessageSquare, Monitor, Settings, Tv, LogOut } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

const navItems = [
  { href: "/admin", label: "Visão Geral", icon: Settings },
  { href: "/admin/institution", label: "Instituição", icon: Building2 },
  { href: "/admin/content", label: "Conteúdos", icon: ImageIcon },
  { href: "/admin/announcements", label: "Avisos", icon: MessageSquare },
  { href: "/admin/tvs", label: "TVs", icon: Monitor },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  return (
    <aside className="w-64 min-h-screen bg-card border-r border-border flex flex-col">
      <div className="p-6 border-b border-border">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#E30613] rounded-lg flex items-center justify-center">
            <Tv className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-foreground">SENAI Cast</h1>
            <p className="text-xs text-muted-foreground">Painel Admin</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-border space-y-2">
        <Link
          href="/tv"
          target="_blank"
          className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-[#003B71] hover:bg-[#002a52] text-white rounded-lg transition-colors"
        >
          <Monitor className="w-5 h-5" />
          <span className="font-medium">Abrir TV</span>
        </Link>
        <button
          onClick={handleLogout}
          className="flex items-center justify-center gap-2 w-full py-3 px-4 text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-lg transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Sair</span>
        </button>
      </div>
    </aside>
  )
}
