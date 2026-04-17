import { Show, SignInButton, SignUpButton, useAuth } from '@clerk/react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { Header } from './components/Header'
import { Hero } from './components/Hero'
import { PublicHeader } from './components/PublicHeader'
import { Translator } from './components/Translator'
import { HealthBadge } from './components/HealthBadge'

function AppFooter() {
  return (
    <footer className="border-t border-rule">
      <div className="mx-auto w-full max-w-[1320px] px-6 h-14 flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-muted">
          Mangaku · {new Date().getFullYear()}
        </span>
        <HealthBadge />
      </div>
    </footer>
  )
}

function HomePage() {
  const { isSignedIn, isLoaded } = useAuth()

  if (!isLoaded) {
    return (
      <div className="min-h-full flex flex-col">
        <PublicHeader />
        <main className="flex-1" />
        <AppFooter />
      </div>
    )
  }

  if (isSignedIn) {
    return <Navigate to="/translate" replace />
  }

  return (
    <div className="min-h-full flex flex-col">
      <PublicHeader />
      <main className="flex-1">
        <Hero />
      </main>
      <AppFooter />
    </div>
  )
}

function TranslatePage() {
  return (
    <div className="min-h-full flex flex-col">
      <Header />
      <main className="flex-1">
        <Show when="signed-out">
          <section className="mx-auto w-full max-w-[1240px] px-6 py-20 md:py-28">
            <div className="max-w-[46ch]">
              <h1 className="font-display font-semibold text-[clamp(32px,4vw,48px)] leading-tight tracking-tight text-ink">
                Sign in to translate
              </h1>
              <p className="mt-4 text-[15px] leading-relaxed text-ink-soft">
                Use your account to run the pipeline and download results.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <SignUpButton mode="modal">
                  <button
                    type="button"
                    className="h-12 px-6 text-[13px] font-medium uppercase tracking-tight bg-ink text-paper rounded-button hover:bg-vermilion transition-colors"
                  >
                    Get started
                  </button>
                </SignUpButton>
                <SignInButton mode="modal">
                  <button
                    type="button"
                    className="h-12 px-4 text-[13px] font-medium text-ink-soft hover:text-ink transition-colors"
                  >
                    I have an account
                  </button>
                </SignInButton>
              </div>
            </div>
          </section>
        </Show>
        <Show when="signed-in">
          <Translator />
        </Show>
      </main>
      <AppFooter />
    </div>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/translate" element={<TranslatePage />} />
    </Routes>
  )
}

export default App
