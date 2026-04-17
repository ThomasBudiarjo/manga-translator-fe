import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/react";

export function Header() {
  return (
    <header className="sticky top-0 z-20 border-b border-rule bg-paper/85 backdrop-blur supports-[backdrop-filter]:bg-paper/70">
      <div className="mx-auto w-full max-w-[1240px] px-6 h-16 flex items-center justify-between">
        <a href="/" className="flex items-center gap-3 group">
          <span
            aria-hidden
            className="grid place-items-center h-9 w-9 rounded-button bg-ink text-paper font-display text-[18px] leading-none group-hover:bg-vermilion transition-colors"
          >
            漫
          </span>
          <span className="flex items-baseline gap-2">
            <span className="font-display text-[20px] tracking-tight text-ink">
              Mangaku
            </span>
            <span className="hidden sm:inline font-mono text-[10px] uppercase tracking-[0.24em] text-ink-muted">
              translator
            </span>
          </span>
        </a>

        <div className="flex items-center gap-1">
          <Show when="signed-out">
            <SignInButton mode="modal">
              <button className="h-9 px-3 text-[13px] font-medium text-ink-soft hover:text-ink transition-colors">
                Sign in
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="h-9 px-4 text-[12px] font-medium uppercase tracking-tight bg-ink text-paper rounded-button hover:bg-vermilion transition-colors">
                Get started
              </button>
            </SignUpButton>
          </Show>
          <Show when="signed-in">
            <UserButton afterSignOutUrl="/" />
          </Show>
        </div>
      </div>
    </header>
  );
}
