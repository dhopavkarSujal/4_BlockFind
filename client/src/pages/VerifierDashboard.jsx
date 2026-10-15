
import { Link } from 'react-router-dom';

const actions = [
  {
    title: 'Review claims',
    description:
      'Review pending claims and process claims under review.',
    path: '/dashboard/review-queue',
    icon: '✓',
  },
  {
    title: 'Found items',
    description:
      'Inspect reported found items and their current status.',
    path: '/dashboard/found-items',
    icon: 'F',
  },
  {
    title: 'Lost reports',
    description:
      'View lost-item reports to support claim verification.',
    path: '/dashboard/lost-assets',
    icon: 'L',
  },
];

export default function VerifierDashboard() {
  let user = {};

  try {
    user = JSON.parse(
      sessionStorage.getItem('blockfind_user') || '{}'
    );
  } catch {
    user = {};
  }

  const name = user.name || user.fullName || 'Verifier';

  return (
    <main className="space-y-8">
      <header>
        <p className="text-sm font-semibold text-indigo-600">
          VERIFICATION WORKSPACE
        </p>

        <h1 className="mt-2 text-3xl font-bold text-slate-950">
          Welcome, {name}
        </h1>

        <p className="mt-2 text-sm leading-6 text-slate-600">
          Review ownership claims, verify reported information,
          and help users recover their belongings.
        </p>
      </header>

      <section>
        <h2 className="text-lg font-bold text-slate-900">
          Verification tasks
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Select a task to continue your review work.
        </p>

        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {actions.map((action) => (
            <Link
              key={action.title}
              to={action.path}
              className="rounded-2xl border border-slate-200
                bg-white p-5 transition hover:border-indigo-300
                hover:shadow-md"
            >
              <span className="flex h-11 w-11 items-center
                justify-center rounded-xl bg-indigo-50
                font-bold text-indigo-700">
                {action.icon}
              </span>

              <h3 className="mt-4 font-semibold text-slate-900">
                {action.title}
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                {action.description}
              </p>

              <span className="mt-4 inline-block text-sm
                font-semibold text-indigo-700">
                Open task →
              </span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}