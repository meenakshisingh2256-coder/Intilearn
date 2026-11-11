import { useEffect, useState, type FormEvent } from 'react'

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem('token'))
  const [userEmail, setUserEmail] = useState('')
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  function logOut() {
    localStorage.removeItem('token')
    setToken(null)
    setUserEmail('')
  }

  // A saved token can be expired, so ask the server who we are before showing the page.
  useEffect(() => {
    if (!token) return
    fetch('/api/me', { headers: { Authorization: `Bearer ${token}` } }).then(async (res) => {
      if (!res.ok) return logOut()
      setUserEmail((await res.json()).email)
    })
  }, [token])

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError('')
    const res = await fetch(`/api/auth/${mode}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json()
    if (!res.ok) return setError(data.error)
    localStorage.setItem('token', data.token)
    setToken(data.token)
  }

  if (token) {
    return (
      <main className="mx-auto max-w-sm p-8">
        <h1 className="text-3xl font-bold">IntiLearn</h1>
        <p className="mt-4">Logged in as {userEmail}</p>
        <button onClick={logOut} className="mt-4 rounded border px-4 py-2">
          Log out
        </button>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-sm p-8">
      <h1 className="text-3xl font-bold">IntiLearn</h1>
      <form onSubmit={submit} className="mt-6 flex flex-col gap-3">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded border px-3 py-2"
        />
        <input
          type="password"
          placeholder="Password (8+ characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded border px-3 py-2"
        />
        {error && <p className="whitespace-pre-line text-red-600">{error}</p>}
        <button className="rounded bg-black px-4 py-2 text-white">
          {mode === 'login' ? 'Log in' : 'Sign up'}
        </button>
      </form>
      <button
        onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
        className="mt-4 text-sm underline"
      >
        {mode === 'login' ? 'No account? Sign up' : 'Have an account? Log in'}
      </button>
    </main>
  )
}
