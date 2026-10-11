import { Link } from 'react-router-dom'

export default function Logo() {
  return (
    <Link to="/" className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-lg font-bold text-white">
        B
      </div>

      <div>
        <span className="block text-xl font-bold tracking-tight">
          BlockFind
        </span>
        <span className="block text-xs text-slate-500">
          Asset recovery platform
        </span>
      </div>
    </Link>
  )
}