import type React from "react"
import type { Metadata, Viewport } from "next"

export const metadata: Metadata = {
  title: "SENAI Cast – TV",
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 1,
  userScalable: false,
}

/**
 * Layout isolado para as rotas /tv/*.
 *
 * O browser da LG WebOS (e SmartTVs em geral) é baseado em versões
 * antigas de WebKit/Blink e NÃO suporta:
 *   - oklch() nas cores (Tailwind v4 usa isso por padrão)
 *   - @theme inline / @custom-variant (CSS v4)
 *   - Google Fonts com font-display swap (pode bloquear render)
 *
 * Por isso este layout:
 *   1. Herda o globals.css do root layout para ter o Tailwind compilado
 *   2. Adiciona um <style> inline que SOBRESCREVE as variáveis CSS
 *      usando valores rgb() puros — suportados em qualquer browser
 *   3. Define font-family seguro com fallbacks de sistema
 *   4. Força o body a ocupar 100vw × 100vh sem scroll
 */
export default function TVLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style
        // biome-ignore lint/security/noDangerouslySetInnerHtml: intentional inline CSS for TV compatibility
        dangerouslySetInnerHTML={{
          __html: `
            /* ── Fallbacks rgb() para LG WebOS / SmartTV browsers ── */
            :root {
              --background: #fafafa;
              --foreground: #0a0a0a;
              --primary: #c0392b;
              --primary-foreground: #fafafa;
              --secondary: #1a3a5c;
              --secondary-foreground: #fafafa;
              --muted: #f5f5f5;
              --muted-foreground: #666666;
              --border: #e5e5e5;
              --input: #e5e5e5;
              --ring: #c0392b;
              --radius: 0.625rem;
              --senai-red: #e30613;
              --senai-blue: #003b71;
            }

            /* Fonte segura para TV — evita depender do Google Fonts */
            html, body {
              font-family: "Helvetica Neue", Helvetica, Arial, sans-serif !important;
            }

            /* Garante que a TV ocupe toda a tela sem scroll */
            html {
              height: 100%;
              width: 100%;
              overflow: hidden;
            }
            body {
              margin: 0;
              padding: 0;
              width: 100vw;
              height: 100vh;
              overflow: hidden;
              background: #000;
            }

            /* Normaliza box-sizing */
            *, *::before, *::after {
              box-sizing: border-box;
            }

            /* Ticker */
            @keyframes ticker {
              0%   { transform: translateX(0); }
              100% { transform: translateX(-50%); }
            }
            .animate-ticker {
              animation: ticker 30s linear infinite;
            }

            /* Esconde scrollbar */
            .hide-scrollbar::-webkit-scrollbar { display: none; }
            .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

            /* Spin para loading */
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
            .animate-spin { animation: spin 1s linear infinite; }
          `,
        }}
      />
      {children}
    </>
  )
}
