'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { getStreaksForUser } from '@/lib/supabase'
import Spread from './Spread'
import styles from './Book.module.css'

export default function Book() {
  const { user, isLoaded } = useUser()
  const [streaks, setStreaks] = useState([])
  const [active, setActive] = useState(0)

  useEffect(() => {
    if (!user) return
    getStreaksForUser(user.id).then(setStreaks)
  }, [user])

  if (!isLoaded) return null
  if (!streaks.length) return (
    <div className={styles.empty}>
      <p>No streaks yet.</p>
      <a href="/canvas/new">Start one →</a>
    </div>
  )

  const streak = streaks[active]

  return (
    <div className={styles.root}>
      <div className={styles.book}>
        <Spread
          left={streak.canvas_a}
          right={streak.canvas_b}
          myId={user.id}
        />

        {/* Spine shadow */}
        <div className={styles.spine} />
      </div>

      {/* Pagination dots */}
      {streaks.length > 1 && (
        <div className={styles.dots}>
          {streaks.map((_, i) => (
            <button
              key={i}
              className={`${styles.dot} ${i === active ? styles.dotActive : ''}`}
              onClick={() => setActive(i)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
