import { ClerkProvider } from '@clerk/nextjs'
import { Dancing_Script, Cormorant_Garamond } from 'next/font/google'
import './globals.css'

const dancing = Dancing_Script({
  variable: '--font-dancing',
  subsets: ['latin'],
  weight: ['400', '600'],
})

const cormorant = Cormorant_Garamond({
  variable: '--font-cormorant',
  subsets: ['latin'],
  weight: ['300', '400'],
})

export const metadata = {
  title: 'streak',
  description: 'send a canvas. get one back.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
        <body className={`${dancing.variable} ${cormorant.variable} antialiased`}>
        <ClerkProvider>{children}</ClerkProvider>
        </body>
      </html>
  )
}