import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import styles from './home.module.css'

export default async function Home() {
  const { userId } = await auth()

  // Signed in → go straight to book
  if (userId) redirect('/book')

  return (
    <main className={styles.root}>
      <div className={styles.content}>
        <h1 className={styles.title}>streak</h1>
        <p className={styles.sub}>send a canvas. get one back. keep the streak.</p>

        <div className={styles.actions}>
          <Link href="/sign-up" className={styles.btnPrimary}>Get started</Link>
          <Link href="/sign-in" className={styles.btnGhost}>Sign in</Link>
        </div>
      </div>
    </main>
  )
}
