import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// ─── Image upload ─────────────────────────────────────────────────────────────

async function uploadImage(dataUrl, canvasId) {
  const blob = await (await fetch(dataUrl)).blob()
  const path = `canvases/${canvasId}.png`

  const { error } = await supabase.storage
    .from('canvas-images')
    .upload(path, blob, { contentType: 'image/png', upsert: true })

  if (error) throw error

  const { data } = supabase.storage.from('canvas-images').getPublicUrl(path)
  return data.publicUrl
}

// ─── Upsert canvas ────────────────────────────────────────────────────────────

export async function saveCanvas({ ownerId, jsonState, imageDataUrl, existingId }) {
  // If updating, upload image to same path
  const id = existingId ?? crypto.randomUUID()
  const imageUrl = await uploadImage(imageDataUrl, id)

  const { data, error } = await supabase
    .from('canvases')
    .upsert({ id, owner_id: ownerId, json_state: jsonState, image_url: imageUrl })
    .select('id, share_token')
    .single()

  if (error) throw error
  return data // { id, share_token }
}

// ─── Fetch by share token (public) ───────────────────────────────────────────

export async function getCanvasByToken(token) {
  const { data, error } = await supabase
    .from('canvases')
    .select('*')
    .eq('share_token', token)
    .single()

  if (error) throw error
  return data
}

// ─── Create streak once both sides have canvases ─────────────────────────────

export async function createStreak({ userA, userB, canvasAId, canvasBId }) {
  const { data, error } = await supabase
    .from('streaks')
    .insert({ user_a: userA, user_b: userB, canvas_a_id: canvasAId, canvas_b_id: canvasBId })
    .select('id')
    .single()

  if (error) throw error

  // Notify user A that user B responded
  await supabase.from('notifications').insert({ user_id: userA, streak_id: data.id })

  return data
}

// ─── Fetch streaks for book view ──────────────────────────────────────────────

export async function getStreaksForUser(userId) {
  const { data, error } = await supabase
    .from('streaks')
    .select(`
      id, created_at,
      canvas_a:canvas_a_id (id, image_url, owner_id),
      canvas_b:canvas_b_id (id, image_url, owner_id)
    `)
    .or(`user_a.eq.${userId},user_b.eq.${userId}`)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}
