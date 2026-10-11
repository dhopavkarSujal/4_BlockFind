const steps = [
  {
    number: '01',
    title: 'Register your asset',
    description: 'Create a digital record of your valuable belongings.',
  },
  {
    number: '02',
    title: 'Report it lost',
    description: 'Record where and when you last saw your missing item.',
  },
  {
    number: '03',
    title: 'Verify ownership',
    description: 'Submit evidence for an authorized verifier to review.',
  },
  {
    number: '04',
    title: 'Recover your item',
    description: 'Follow the recovery process and review its audit history.',
  },
]

export default function Landing() {
  return (
    <main>
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-indigo-100/70 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-6 py-20 lg:grid-cols-2 lg:px-8 lg:py-28">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white px-4 py-2 text-sm font-medium text-indigo-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              A smarter way to recover lost assets
            </span>

            <h1 className="mt-7 text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Lost something?
              <span className="mt-2 block text-indigo-600">
                Find your way back.
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
              Register your belongings, connect lost reports with found
              items, and recover assets through a transparent ownership
              verification process.
            </p>

            <div className="mt-9 flex flex-wrap gap-4">
              <a
                href="/register"
                className="rounded-xl bg-indigo-600 px-6 py-3.5 font-semibold text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700"
              >
                Start with BlockFind →
              </a>

              <a
                href="#how-it-works"
                className="rounded-xl border border-slate-300 bg-white px-6 py-3.5 font-semibold text-slate-700 hover:bg-slate-100"
              >
                Explore the process
              </a>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-200/70">
            <p className="text-sm font-medium text-slate-500">
              Recovery overview
            </p>

            <h2 className="mt-1 text-xl font-bold">
              Your assets, accounted for
            </h2>

            <div className="mt-6 space-y-4">
              <div className="flex items-center gap-4 rounded-2xl border border-slate-100 p-4">
                <span className="text-2xl">💻</span>
                <div className="flex-1">
                  <p className="font-semibold">Laptop</p>
                  <p className="text-sm text-slate-500">
                    Registered asset
                  </p>
                </div>
                <span className="text-sm font-semibold text-emerald-700">
                  Registered
                </span>
              </div>

              <div className="flex items-center gap-4 rounded-2xl border border-slate-100 p-4">
                <span className="text-2xl">🔎</span>
                <div className="flex-1">
                  <p className="font-semibold">Possible match</p>
                  <p className="text-sm text-slate-500">
                    Library · Example preview
                  </p>
                </div>
                <span className="text-sm font-semibold text-amber-700">
                  Review
                </span>
              </div>

              <div className="rounded-2xl bg-slate-900 p-5 text-white">
                <p className="font-semibold">Ownership verification</p>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-700">
                  <div className="h-full w-2/3 rounded-full bg-indigo-400" />
                </div>
                <p className="mt-3 text-sm text-slate-300">
                  Authorized verifiers review evidence and ownership claims.
                </p>
              </div>
            </div>

            <p className="mt-4 text-center text-xs text-slate-400">
              Illustrative preview · No live records yet
            </p>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-bold uppercase tracking-widest text-indigo-600">
              How it works
            </p>

            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
              From lost to found, step by step
            </h2>

            <p className="mt-4 leading-7 text-slate-600">
              A structured recovery process with clear ownership decisions.
            </p>
          </div>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step) => (
              <article
                key={step.number}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-6 transition hover:-translate-y-1 hover:shadow-lg"
              >
                <span className="text-sm font-bold text-indigo-600">
                  STEP {step.number}
                </span>

                <h3 className="mt-5 text-lg font-bold">{step.title}</h3>

                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {step.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="security" className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="rounded-3xl bg-indigo-950 px-7 py-12 text-white sm:px-12">
          <p className="text-sm font-bold uppercase tracking-widest text-indigo-300">
            Trust through accountability
          </p>

          <h2 className="mt-4 text-3xl font-bold sm:text-4xl">
            Ownership decisions deserve a clear record.
          </h2>

          <p className="mt-4 max-w-2xl leading-7 text-indigo-100/80">
            BlockFind is designed to protect private evidence, restrict
            sensitive actions to authorized roles, and maintain a verifiable
            history of important recovery events.
          </p>
        </div>
      </section>
    </main>
  )
}