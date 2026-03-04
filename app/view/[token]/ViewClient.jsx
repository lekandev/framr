'use client'

import { useUser, SignInButton } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import styles from './ViewClient.module.css'

export default function ViewClient({ canvas }) {
  const { isSignedIn, isLoaded } = useUser()
  const router = useRouter()

  const handleRespond = () => {
    // New canvas, carry the streak context in search params
    router.push(`/canvas/new?replyTo=${canvas.id}`)
  }

  return (
    <div className={styles.root}>
      <div className={styles.frame}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={canvas.image_url} alt="Canvas" className={styles.image} />
      </div>

      <div className={styles.actions}>
        {!isLoaded ? null : isSignedIn ? (
          <button className={styles.respondBtn} onClick={handleRespond}>
            Respond
          </button>
        ) : (
          <div className={styles.gate}>
            <p>Create an account to respond</p>
            <SignInButton mode="modal" redirectUrl={`/view/${canvas.share_token}`}>
              <button className={styles.respondBtn}>Sign up to respond</button>
            </SignInButton>
          </div>
        )}
      </div>
    </div>
  )
}
