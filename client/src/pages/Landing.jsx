
import { useState } from 'react'
import { Link } from 'react-router-dom'
import HeroSection from '../components/landing/HeroSection'
import Reveal from '../components/common/Reveal'

const features = [
  {
    number: '01',
    icon: '⌕',
    title: 'Lost asset reporting',
    description:
      'Create a report with your asset details so the recovery process can begin with clear, organized information.',
    color: 'bg-blue-50 text-blue-700',
  },
  {
    number: '02',
    icon: '✓',
    title: 'Found item reporting',
    description:
      'Record found belongings and help authorized verifiers review ownership claims responsibly.',
    color: 'bg-teal-50 text-teal-700',
  },
  {
    number: '03',
    icon: '◇',
    title: 'Claim verification',
    description:
      'Submit a claim and provide relevant information so the appropriate verification process can take place.',
    color: 'bg-violet-50 text-violet-700',
  },
  {
    number: '04',
    icon: '↗',
    title: 'Recovery tracking',
    description:
      'Follow the status of your claim and recovery process from one organized workspace.',
    color: 'bg-amber-50 text-amber-700',
  },
  {
    number: '05',
    icon: '▤',
    title: 'Transparent activity',
    description:
      'Support accountable workflows through recorded actions and appropriate administrative oversight.',
    color: 'bg-indigo-50 text-indigo-700',
  },
  {
    number: '06',
    icon: '⌑',
    title: 'Centralized workspace',
    description:
      'Keep your reports, claims, and recovery information organized instead of scattered across conversations.',
    color: 'bg-rose-50 text-rose-700',
  },
]

const steps = [
  {
    number: '01',
    title: 'Report an item',
    description:
      'Register, then submit the details of a lost asset or an item you have found.',
  },
  {
    number: '02',
    title: 'Submit a claim',
    description:
      'If an item may belong to you, submit a claim with the information needed for verification.',
  },
  {
    number: '03',
    title: 'Verify and recover',
    description:
      'An authorized verifier reviews the claim. Once approved, the recovery process can be completed.',
  },
]

const faqs = [
  {
    question: 'What is BlockFind?',
    answer:
      'BlockFind is an asset recovery platform designed to organize lost-item reports, found-item records, claims, and recovery workflows in one place.',
  },
  {
    question: 'How do I report a lost item?',
    answer:
      'Create an account or sign in, then use the lost-asset reporting workflow when it is available in your dashboard.',
  },
  {
    question: 'Can I report an item I have found?',
    answer:
      'Yes. The intended workflow lets users record found items so that potential ownership claims can be reviewed.',
  },
  {
    question: 'Does submitting a claim guarantee recovery?',
    answer:
      'No. A claim must go through the required verification process. Recovery depends on the available information and the outcome of that review.',
  },
  {
    question: 'Is the activity shown in the hero dashboard real?',
    answer:
      'No. The dashboard shown on this landing page is an illustrative preview, not live user data.',
  },
]

function SectionHeading({ eyebrow, title, description }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-xs font-bold tracking-[0.2em] text-blue-700">
        {eyebrow}
      </p>

      <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
        {title}
      </h2>

      <p className="mt-4 text-base leading-7 text-slate-600 sm:text-lg">
        {description}
      </p>
    </div>
  )
}

function FeatureSection() {
  return (
    <section
      id="security"
      className="scroll-mt-24 bg-slate-50 px-6 py-20 sm:px-8 sm:py-24 lg:px-12"
    >
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="BUILT FOR RECOVERY"
          title="Everything you need to get started"
          description="A structured way to manage lost items, found belongings, ownership claims, and recovery updates."
        />

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <article
              key={feature.number}
              className="group rounded-2xl border border-slate-200/80 bg-white p-6 transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-slate-900/5 sm:p-7"
            >
              <div className="flex items-center justify-between">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl text-2xl font-semibold ${feature.color}`}
                  aria-hidden="true"
                >
                  {feature.icon}
                </div>

                <span className="text-sm font-semibold text-slate-300 transition group-hover:text-blue-600">
                  {feature.number}
                </span>
              </div>

              <h3 className="mt-6 text-lg font-bold text-slate-900">
                {feature.title}
              </h3>

              <p className="mt-3 text-sm leading-7 text-slate-600">
                {feature.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="scroll-mt-24 bg-white px-6 py-20 sm:px-8 sm:py-24 lg:px-12"
    >
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="SIMPLE BY DESIGN"
          title="Three steps toward recovery"
          description="A clear process helps everyone understand what happens next."
        />

        <div className="relative mt-14 grid gap-8 md:grid-cols-3 md:gap-6">
          {steps.map((step, index) => (
            <article key={step.number} className="relative">
              {index < steps.length - 1 && (
                <div
                  aria-hidden="true"
                  className="absolute left-12 top-6 hidden h-px w-[calc(100%-2rem)] bg-gradient-to-r from-blue-200 to-teal-200 md:block"
                />
              )}

              <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 text-sm font-bold text-blue-700">
                {step.number}
              </div>

              <h3 className="mt-6 text-xl font-bold text-slate-900">
                {step.title}
              </h3>

              <p className="mt-3 max-w-sm text-sm leading-7 text-slate-600">
                {step.description}
              </p>
            </article>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link
            to="/register"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
          >
            Get started
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </section>
  )
}

function FAQSection() {
  const [openIndex, setOpenIndex] = useState(0)

  return (
    <section
      id="faq"
      className="scroll-mt-24 bg-slate-50 px-6 py-20 sm:px-8 sm:py-24 lg:px-12"
    >
      <div className="mx-auto max-w-3xl">
        <SectionHeading
          eyebrow="GOT QUESTIONS?"
          title="Frequently asked questions"
          description="Learn how the BlockFind recovery workflow is intended to work."
        />

        <div className="mt-10 divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white px-5 sm:px-7">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index

            return (
              <article key={faq.question} className="py-1">
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-4 py-5 text-left"
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${index}`}
                  onClick={() =>
                    setOpenIndex(isOpen ? -1 : index)
                  }
                >
                  <span className="text-sm font-semibold leading-6 text-slate-900 sm:text-base">
                    {faq.question}
                  </span>

                  <span
                    aria-hidden="true"
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-lg transition ${
                      isOpen
                        ? 'rotate-45 bg-blue-100 text-blue-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    +
                  </span>
                </button>

                {isOpen && (
                  <div
                    id={`faq-answer-${index}`}
                    className="pb-5 pr-8 text-sm leading-7 text-slate-600"
                  >
                    {faq.answer}
                  </div>
                )}
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function FinalCTA() {
  return (
    <section className="px-6 py-16 sm:px-8 sm:py-20 lg:px-12">
      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-3xl bg-gradient-to-br from-blue-800 via-blue-700 to-teal-700 px-6 py-14 text-center sm:px-12 sm:py-16">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full border border-white/10"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-32 -left-12 h-72 w-72 rounded-full border border-white/10"
        />

        <div className="relative mx-auto max-w-2xl">
          <p className="text-xs font-bold tracking-[0.2em] text-blue-100">
            TAKE THE FIRST STEP
          </p>

          <h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Make recovery more organized.
          </h2>

          <p className="mt-5 text-base leading-7 text-blue-50">
            Create your BlockFind account and get ready to manage your asset
            recovery journey in one place.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              to="/register"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-semibold text-blue-800 transition hover:-translate-y-0.5 hover:bg-blue-50"
            >
              Create an account
              <span aria-hidden="true">→</span>
            </Link>

            <Link
              to="/login"
              className="inline-flex items-center justify-center rounded-xl border border-white/30 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

export default function Landing() {
  
return (
    <main>
      <HeroSection />

      <Reveal>
        <FeatureSection />
      </Reveal>

      <Reveal>
        <HowItWorks />
      </Reveal>

      <Reveal>
        <FAQSection />
      </Reveal>

      <Reveal>
        <FinalCTA />
      </Reveal>
    </main>
  )
}
