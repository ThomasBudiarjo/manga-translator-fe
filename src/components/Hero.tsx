import { SignInButton, SignUpButton } from '@clerk/react'

const STEPS = [
  { title: 'Drop a page', body: 'JPEG or PNG, up to 10 MB.' },
  { title: 'Pick languages', body: 'Default ja → id; pick any pair.' },
  { title: 'Read it back', body: 'Re-typeset and ready to download.' },
]

export function Hero() {
  return (
    <section className="relative">
      <div className="mx-auto w-full max-w-[1240px] px-6 py-20 md:py-28 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-end">
        <div className="lg:col-span-7">
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-vermilion mb-7">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-vermilion mr-3 align-middle" />
            Manga translation, in one drop.
          </p>
          <h1 className="font-display font-semibold text-[clamp(48px,7.4vw,112px)] leading-[0.92] tracking-[-0.02em] text-ink">
            Read every<br />
            <span className="italic" style={{ fontVariationSettings: '"SOFT" 100' }}>
              panel,
            </span>{' '}
            in your<br />
            language.
          </h1>
          <p className="mt-9 max-w-[46ch] text-[16px] leading-relaxed text-ink-soft">
            Drop a JPEG or PNG. The pipeline finds speech bubbles, translates them with an LLM,
            and re-renders the page so it reads like the original.
          </p>
          <div className="mt-10 flex items-center gap-3">
            <SignUpButton mode="modal">
              <button
                type="button"
                className="h-12 px-6 text-[13px] font-medium uppercase tracking-tight bg-ink text-paper rounded-button hover:bg-vermilion transition-colors inline-flex items-center gap-2"
              >
                Get started — it's free
                <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.75">
                  <path d="M3 8h10m0 0l-4-4m4 4l-4 4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
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

        <div className="lg:col-span-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-rule-strong border border-rule-strong">
            {STEPS.map((s, i) => (
              <div
                key={s.title}
                className="bg-paper p-5 flex flex-col gap-3 min-h-[180px]"
              >
                <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-ink-muted">
                  step 0{i + 1}
                </span>
                <h3 className="font-display text-[20px] leading-tight text-ink">{s.title}</h3>
                <p className="text-[12px] text-ink-muted leading-snug mt-auto">{s.body}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.24em] text-ink-muted">
            <span>powered by paddle ocr + llm</span>
            <span>v0.1</span>
          </div>
        </div>
      </div>
    </section>
  )
}
