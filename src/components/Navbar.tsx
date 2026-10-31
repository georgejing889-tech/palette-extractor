import { useEffect, useState } from 'react'
import { Button } from './ui'
import type { Lang } from '../lib/i18n'

interface Props {
  t: (k: string) => string
  lang: Lang
  dark: boolean
  onToggleTheme: () => void
  onToggleLang: () => void
}

export function Navbar({ t, lang, dark, onToggleTheme, onToggleLang }: Props) {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const go = (id: string) => {
    setOpen(false)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <header
      className={`sticky top-0 z-50 border-b transition-all duration-300 ${
        scrolled
          ? 'border-[var(--border)] bg-[var(--bg)]/85 backdrop-blur-xl'
          : 'border-transparent bg-[var(--bg)]/60 backdrop-blur-md'
      }`}
    >
      <nav
        aria-label="main"
        className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-4 sm:px-6"
      >
        <a
          href="#top"
          className="flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6C5CE7] rounded-lg"
        >
          <span
            aria-hidden
            className="grid h-8 w-8 grid-cols-2 grid-rows-2 overflow-hidden rounded-lg shadow-sm"
          >
            <i className="bg-[#6C5CE7]" />
            <i className="bg-[#FF6B6B]" />
            <i className="bg-[#F9C74F]" />
            <i className="bg-[#43AA8B]" />
          </span>
          <span className="text-[15px] font-bold tracking-tight text-[var(--text)]">
            {t('brand')}
          </span>
        </a>

        <div className="hidden items-center gap-1 md:flex">
          <button
            onClick={() => go('how')}
            className="rounded-lg px-3 py-2 text-sm text-[var(--text-sub)] transition-colors hover:bg-[var(--text)]/6 hover:text-[var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6C5CE7]"
          >
            {t('navHow')}
          </button>
          <button
            onClick={() => go('privacy')}
            className="rounded-lg px-3 py-2 text-sm text-[var(--text-sub)] transition-colors hover:bg-[var(--text)]/6 hover:text-[var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6C5CE7]"
          >
            {t('navPrivacy')}
          </button>
          <a
            href="https://github.com/"
            target="_blank"
            rel="noreferrer noopener"
            aria-label="GitHub"
            className="rounded-lg px-3 py-2 text-sm text-[var(--text-sub)] transition-colors hover:bg-[var(--text)]/6 hover:text-[var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6C5CE7]"
          >
            {t('navGithub')}
          </a>
          <button
            onClick={onToggleLang}
            aria-label={t('toggleLang')}
            className="ml-1 rounded-lg border border-[var(--border)] px-2.5 py-1.5 text-xs font-semibold text-[var(--text-sub)] transition-colors hover:text-[var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6C5CE7]"
          >
            {lang === 'zh' ? 'EN' : '中文'}
          </button>
          <button
            onClick={onToggleTheme}
            aria-label={t('toggleTheme')}
            className="ml-1 rounded-xl border border-[var(--border)] bg-[var(--bg-elev)] p-2 text-[var(--text)] transition-all hover:border-[#6C5CE7]/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6C5CE7]"
          >
            {dark ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
              </svg>
            )}
          </button>
        </div>

        <div className="flex items-center gap-1 md:hidden">
          <button
            onClick={onToggleLang}
            aria-label={t('toggleLang')}
            className="rounded-lg border border-[var(--border)] px-2 py-1 text-xs font-semibold text-[var(--text-sub)]"
          >
            {lang === 'zh' ? 'EN' : '中'}
          </button>
          <button
            onClick={onToggleTheme}
            aria-label={t('toggleTheme')}
            className="rounded-lg border border-[var(--border)] bg-[var(--bg-elev)] p-2 text-[var(--text)]"
          >
            {dark ? '☀' : '☾'}
          </button>
          <button
            onClick={() => setOpen((o) => !o)}
            aria-label="menu"
            aria-expanded={open}
            className="rounded-lg border border-[var(--border)] bg-[var(--bg-elev)] p-2 text-[var(--text)]"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {open ? <path d="M18 6 6 18M6 6l12 12" /> : <path d="M3 6h18M3 12h18M3 18h18" />}
            </svg>
          </button>
        </div>
      </nav>

      {open && (
        <div className="animate-fade-up border-t border-[var(--border)] bg-[var(--bg-elev)] px-4 py-3 md:hidden">
          <div className="flex flex-col gap-1">
            <button onClick={() => go('how')} className="rounded-lg px-3 py-2.5 text-left text-sm text-[var(--text)] hover:bg-[var(--text)]/6">
              {t('navHow')}
            </button>
            <button onClick={() => go('privacy')} className="rounded-lg px-3 py-2.5 text-left text-sm text-[var(--text)] hover:bg-[var(--text)]/6">
              {t('navPrivacy')}
            </button>
            <a
              href="https://github.com/"
              target="_blank"
              rel="noreferrer noopener"
              className="rounded-lg px-3 py-2.5 text-sm text-[var(--text)] hover:bg-[var(--text)]/6"
            >
              {t('navGithub')}
            </a>
          </div>
        </div>
      )}
    </header>
  )
}

export function Footer({ t }: { t: (k: string) => string }) {
  return (
    <footer className="mt-16 border-t border-[var(--border)] py-8">
      <div className="mx-auto flex max-w-[1200px] flex-col items-center gap-2 px-4 text-center sm:flex-row sm:justify-between sm:px-6">
        <p className="text-sm text-[var(--text-sub)]">{t('footerText')}</p>
        <p className="text-xs text-[var(--text-sub)]">
          © {new Date().getFullYear()} {t('brand')}
        </p>
      </div>
    </footer>
  )
}

export function PrivacySection({
  t,
  onClear,
  ButtonRef,
}: {
  t: (k: string) => string
  onClear: () => void
  ButtonRef: typeof Button
}) {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <section id="how" className="scroll-mt-20 rounded-2xl border border-[var(--border)] bg-[var(--bg-elev)] p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-[var(--text)]">{t('howTitle')}</h2>
        <ol className="mt-3 space-y-2.5">
          {['how1', 'how2', 'how3', 'how4'].map((k, i) => (
            <li key={k} className="flex gap-3 text-sm text-[var(--text-sub)]">
              <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#6C5CE7] text-[11px] font-bold text-white">
                {i + 1}
              </span>
              <span>{t(k)}</span>
            </li>
          ))}
        </ol>
      </section>

      <section id="privacy" className="scroll-mt-20 rounded-2xl border border-[var(--border)] bg-[var(--bg-elev)] p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-[var(--text)]">{t('privacyTitle')}</h2>
        <p className="mt-3 text-sm leading-relaxed text-[var(--text-sub)]">{t('privacyBody')}</p>
        <ButtonRef variant="secondary" size="sm" className="mt-4" onClick={onClear}>
          {t('clearSaved')}
        </ButtonRef>
      </section>
    </div>
  )
}
