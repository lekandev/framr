import { getCanvasByToken } from '@/lib/supabase'
import ViewClient from './ViewClient'

export default async function ViewPage({ params }) {
  const canvas = await getCanvasByToken(params.token).catch(() => null)
  if (!canvas) return <p>Canvas not found.</p>

  return <ViewClient canvas={canvas} />
}
