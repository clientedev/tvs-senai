import { TVDisplay } from "@/components/tv/tv-display"

interface TVPageProps {
  params: Promise<{ id: string }>
}

export default async function TVPage({ params }: TVPageProps) {
  const { id } = await params

  return <TVDisplay tvId={id} />
}
