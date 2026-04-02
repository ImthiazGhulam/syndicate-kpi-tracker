import './globals.css'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'The Syndicate — The Motherboard',
  description: 'Business coaching KPI tracking platform',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-zinc-950 text-white min-h-screen">
        {children}
      </body>
    </html>
  )
}
