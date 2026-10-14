
import { useState } from 'react'
import { Link } from 'react-router-dom'

const modes = {
  lost: {
    label: 'I lost an item',
    eyebrow: 'YOUR SEARCH STARTS HERE',
    title: 'Lost something? ',
    highlight: 'Let’s find it.',
    description:
      'Report your missing asset, submit the details securely, and follow the recovery process in one place.',
    action: 'Report a lost item',
    icon: '⌕',
  },
  found: {
    label: 'I found an item',
    eyebrow: 'MAKE A DIFFERENCE TODAY',
    title: 'Found something? ',
    highlight: 'Help return it.',
    description:
      'Register a found item, help verify its rightful owner, and make the recovery process easier for everyone.',
    action: 'Report a found item',
    icon: '✓',
  },
}

const previewItems = [
  {
    name: 'Laptop',
    category: 'Electronics',
    status: 'Claim review',
    color: 'bg-blue-100 text-blue-700',
    symbol: 'L',
  },
  {
    name: 'Student ID Card',
    category: 'Identification',
    status: 'Matched',
    color: 'bg-teal-100 text-teal-700',
    symbol: 'I',
  },
  {
    name: 'Backpack',
    category: 'Personal belongings',
    status: 'Under review',
    color: 'bg-violet-100 text-violet-700',
    symbol: 'B',
  },
]

export default function HeroSection() {
  const [intent, setIntent] = useState('lost')
  const content = modes[intent]

  return (
    <section
      id="home"
      className="relative isolate overflow-hidden bg-white"
    >
      {/* Decorative background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 -top-32 -z-10 h-96 w-96 rounded-full bg-blue-100/70 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-40 -left-32 -z-10 h-96 w-96 rounded-full bg-teal-100/60 blur-3xl"
      />

      <div className="mx-auto grid max-w-7xl items-center gap-14 px-6 py-20 sm:px-8 sm:py-24 lg:grid-cols-2 lg:gap-16 lg:px-12 lg:py-28">
        {/* Hero copy */}
        <div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-800">
            <span className="h-2 w-2 rounded-full bg-teal-500" />
            A smarter way to recover your assets
          </div>

          <p className="mb-4 text-xs font-bold tracking-[0.22em] text-blue-700">
            {content.eyebrow}
          </p>

          <h1 className="max-w-xl text-4xl font-bold leading-tight tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
            {content.title}
            <span className="text-blue-700">{content.highlight}</span>
          </h1>

          <p className="mt-6 max-w-lg text-base leading-8 text-slate-600 sm:text-lg">
            {content.description}
          </p>

          {/* Interactive intent selector */}
          <div className="mt-8 inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1.5">
            {Object.entries(modes).map(([key, mode]) => (
              <button
                key={key}
                type="button"
                onClick={() => setIntent(key)}
                aria-pressed={intent === key}
                className={`rounded-lg px-4 py-3 text-sm font-semibold transition-all duration-200 sm:px-5 ${
                  intent === key
                    ? 'bg-white text-blue-700 shadow-sm ring-1 ring-slate-200'
                    : 'text-slate-600 hover:text-slate-950'
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>

          {/* Calls to action */}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/register"
              state={{ intent }}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-6 py-4 text-sm font-semibold text-white shadow-lg shadow-blue-700/20 transition duration-200 hover:-translate-y-0.5 hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
            >
              {content.action}
              <span aria-hidden="true">→</span>
            </Link>

            <a
              href="#how-it-works"
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-4 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
            >
              See how it works
            </a>
          </div>

          <p className="mt-5 text-xs leading-6 text-slate-500">
            Secure reporting. Verified claims. Transparent recovery.
          </p>
        </div>

        {/* Illustrative dashboard preview */}
        <div className="relative mx-auto w-full max-w-xl">
          <div
            aria-hidden="true"
            className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-blue-100 via-white to-teal-100 blur-xl"
          />

          <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-7">
              <div>
                <p className="text-xs font-medium text-slate-500">
                  BLOCKFIND WORKSPACE
                </p>
                <h2 className="mt-1 text-lg font-bold text-slate-900">
                  Recovery overview
                </h2>
              </div>

              <div className="flex gap-1.5" aria-hidden="true">
                <span className="h-2.5 w-2.5 rounded-full bg-red-300" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
                <span className="h-2.5 w-2.5 rounded-full bg-teal-400" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 bg-slate-50/80 p-5 sm:gap-4 sm:p-7">
              <div className="rounded-xl border border-slate-100 bg-white p-4">
                <p className="text-sm text-slate-500">Lost reports</p>
                <p className="mt-3 text-3xl font-bold text-slate-900">—</p>
                <p className="mt-1 text-xs text-slate-500">
                  Your reports appear here
                </p>
              </div>

              <div className="rounded-xl border border-slate-100 bg-white p-4">
                <p className="text-sm text-slate-500">Recovery status</p>
                <p className="mt-3 text-3xl font-bold text-teal-700">—</p>
                <p className="mt-1 text-xs text-slate-500">
                  Track updates here
                </p>
              </div>

              <div className="col-span-2 rounded-xl border border-slate-100 bg-white p-4 sm:p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h3 className="font-semibold text-slate-900">
                    Example recovery activity
                  </h3>
                  <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                    Preview only
                  </span>
                </div>

                <div className="space-y-4">
                  {previewItems.map((item) => (
                    <div
                      key={item.name}
                      className="flex items-center gap-3"
                    >
                      <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${item.color}`}
                      >
                        {item.symbol}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-800">
                          {item.name}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {item.category}
                        </p>
                      </div>

                      <span className="max-w-28 text-right text-xs font-medium text-slate-600">
                        {item.status}
                      </span>
                    </div>
                  ))}
                </div>

                <p className="mt-5 border-t border-slate-100 pt-3 text-xs leading-5 text-slate-400">
                  Illustrative examples, not live user records.
                </p>
              </div>
            </div>
          </div>

          <div className="relative mt-4 flex items-center justify-center gap-2 text-xs text-slate-500">
            <span className="h-2 w-2 rounded-full bg-teal-500" />
            A single workspace for the recovery journey
          </div>
        </div>
      </div>
    </section>
  )
}
