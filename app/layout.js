import './globals.css'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'The Syndicate — The Motherboard',
  description: 'Business coaching KPI tracking platform',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Orbitron:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-zinc-950 text-white min-h-screen font-sans">
        {children}
      </body>
    </html>
  )
}
