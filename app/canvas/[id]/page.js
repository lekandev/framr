'use client'

import dynamic from 'next/dynamic'
import { useUser } from '@clerk/nextjs'
import { useRouter, useSearchParams } from 'next/navigation'
import { saveCanvas, createStreak } from '@/lib/supabase'

const Builder = dynamic(() => import('@/components/canvas/Builder'), { ssr: false })

export default function CanvasPage() {
  const { user } = useUser()
  const router = useRouter()
  const searchParams = useSearchParams()
  const replyTo = searchParams.get('replyTo')

  const handleSave = async ({ json, imageUrl }) => {
    const { id, share_token } = await saveCanvas({
      ownerId: user.id,
      jsonState: json,
      imageDataUrl: imageUrl,
    })

    if (replyTo) {
      await createStreak({
        userA: replyTo,
        userB: user.id,
        canvasAId: replyTo,
        canvasBId: id,
      })
      router.push('/book')
      return
    }

    const link = `${window.location.origin}/view/${share_token}`
    await navigator.clipboard.writeText(link)
    alert(`Link copied!\n${link}`) // swap for a toast
  }

  return (
    <main>
      <Builder onSave={handleSave} />
    </main>
  )
}