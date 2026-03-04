import styles from './Spread.module.css'

export default function Spread({ left, right, myId }) {
  const myCanvas    = left?.owner_id  === myId ? left  : right
  const theirCanvas = left?.owner_id  !== myId ? left  : right

  return (
    <div className={styles.spread}>
      <Page canvas={myCanvas}    label="you" />
      <Page canvas={theirCanvas} label="them" />
    </div>
  )
}

function Page({ canvas, label }) {
  return (
    <div className={styles.page}>
      <span className={styles.label}>{label}</span>
      {canvas?.image_url
        ? <img src={canvas.image_url} alt={label} className={styles.image} />
        : <div className={styles.blank}><span>waiting…</span></div>
      }
    </div>
  )
}
