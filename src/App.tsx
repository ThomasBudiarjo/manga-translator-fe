import { Show } from '@clerk/react'
import { Header } from './components/Header'
import { Hero } from './components/Hero'
import { Translator } from './components/Translator'
import { HealthBadge } from './components/HealthBadge'

function App() {
  return (
    <div className="min-h-full flex flex-col">
      <Header />
      <main className="flex-1">
        <Show when="signed-out">
          <Hero />
        </Show>
        <Show when="signed-in">
          <Translator />
        </Show>
      </main>
      <footer className="border-t border-rule">
        <div className="mx-auto w-full max-w-[1320px] px-6 h-14 flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-muted">
            Mangaku · {new Date().getFullYear()}
          </span>
          <HealthBadge />
        </div>
      </footer>
    </div>
  )
}

export default App
