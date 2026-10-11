import { Link } from 'react-router-dom'
import Logo from '../common/Logo'

export default function Navbar() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-8">
        <Logo />

        <div className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">
          <a href="#how-it-works" className="transition hover:text-indigo-600">
            How it works
          </a>

          <a href="#security" className="transition hover:text-indigo-600">
            Security
          </a>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="hidden rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 sm:inline-flex"
          >
            Sign in
          </Link>

          <Link
            to="/register"
            className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            Get started
          </Link>
        </div>
      </nav>
    </header>
  )
}