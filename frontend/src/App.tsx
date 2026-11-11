import { useEffect, useState } from 'react'

export default function App() {
  const [status, setStatus] = useState('checking...')

  useEffect(() => {
    fetch('/api/health')
      .then((res) => setStatus(res.ok ? 'OK' : 'down'))
      .catch(() => setStatus('down'))
  }, [])

  return (
    <main className="mx-auto max-w-xl p-8">
      <h1 className="text-3xl font-bold">IntiLearn</h1>
      <p className="mt-4">API status: {status}</p>
    </main>
  )
}
