
import { useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import Logo from '../common/Logo'

const navigation = [
  { label: 'Home', href: '/#home' },
  { label: 'Features', href: '/#security' },
  { label: 'How it works', href: '/#how-it-works' },
  { label: 'FAQ', href: '/#faq' },
]

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()

  function closeMenu() {
    setMenuOpen(false)
  }

  function handleSectionNavigation(event, href) {
    if (!href.startsWith('/#')) return

    const sectionId = href.slice(2)

    if (location.pathname === '/') {
      event.preventDefault()
      document.getElementById(sectionId)?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
      window.history.replaceState(null, '', href)
      closeMenu()
    } else {
      closeMenu()
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
      <nav
        className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-4 sm:px-8 lg:px-12"
        aria-label="Main navigation"
      >
        <div className="shrink-0" onClick={closeMenu}>
          <Logo />
        </div>

        <div className="hidden items-center gap-7 lg:flex">
          {navigation.map((item) => (
            <Link
              key={item.label}
              to={item.href}
              onClick={(event) =>
                handleSectionNavigation(event, item.href)
              }
              className="text-sm font-medium text-slate-600 transition hover:text-blue-700"
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          <NavLink
            to="/login"
            className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Sign in
          </NavLink>

          <Link
            to="/register"
            className="rounded-xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800"
          >
            Get started
          </Link>
        </div>

        <button
          type="button"
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 text-slate-700 transition hover:bg-slate-50 lg:hidden"
          aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={menuOpen}
          aria-controls="mobile-navigation"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span className="text-2xl leading-none" aria-hidden="true">
            {menuOpen ? '×' : '☰'}
          </span>
        </button>
      </nav>

      {menuOpen && (
        <div
          id="mobile-navigation"
          className="border-t border-slate-100 bg-white px-6 py-5 shadow-lg lg:hidden sm:px-8"
        >
          <div className="mx-auto flex max-w-7xl flex-col gap-2">
            {navigation.map((item) => (
              <Link
                key={item.label}
                to={item.href}
                onClick={(event) =>
                  handleSectionNavigation(event, item.href)
                }
                className="rounded-xl px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-blue-50 hover:text-blue-700"
              >
                {item.label}
              </Link>
            ))}

            <div className="mt-3 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4">
              <Link
                to="/login"
                onClick={closeMenu}
                className="rounded-xl border border-slate-200 px-4 py-3 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Sign in
              </Link>

              <Link
                to="/register"
                onClick={closeMenu}
                className="rounded-xl bg-blue-700 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-blue-800"
              >
                Get started
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
