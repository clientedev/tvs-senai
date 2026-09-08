import Link from "next/link"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#003B71] to-[#001d38] flex items-center justify-center p-8">
      <div className="max-w-2xl w-full text-center">
        <div className="mb-8">
          <div className="w-24 h-24 bg-white rounded-2xl mx-auto flex items-center justify-center mb-6 shadow-xl">
            <span className="text-[#E30613] text-4xl font-bold">S</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">TV Corporativa SENAI-SP</h1>
          <p className="text-white/70 text-lg">Sistema de Mídia Indoor Institucional</p>
        </div>

        <div className="space-y-4">
          <Link
            href="/login"
            className="block w-full py-4 px-6 bg-[#E30613] hover:bg-[#B8050F] text-white font-semibold rounded-xl transition-colors text-lg shadow-lg"
          >
            Acessar Painel Administrativo
          </Link>
          <div className="p-4 bg-white/10 rounded-xl border border-white/10">
            <p className="text-white/80 text-sm mb-2">Para configurar uma nova TV:</p>
            <ol className="text-left text-white/70 text-sm space-y-1 list-decimal list-inside">
              <li>Acesse o Painel Administrativo</li>
              <li>Vá em "TVs" e adicione um dispositivo</li>
              <li>Copie o Link gerado e abra na TV</li>
            </ol>
          </div>
        </div>

        <p className="mt-8 text-white/50 text-sm">Versão 1.0 (Supabase) • Desenvolvido para SENAI-SP</p>
      </div>
    </div>
  )
}
