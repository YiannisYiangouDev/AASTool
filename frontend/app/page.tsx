

import Link from "next/link";
import Header from "../components/Header";

const quickLinks = [
  {
    href: "/dashboard",
    icon: "📊",
    label: "Dashboard",
    description: "View analytics, scoring insights, and assessment summaries.",
    color: "from-cyan-500 to-blue-600",
  },
  {
    href: "/building",
    icon: "🏢",
    label: "Building Types",
    description: "Manage and classify building accessibility categories.",
    color: "from-indigo-500 to-purple-600",
  },
  {
    href: "/disability",
    icon: "♿",
    label: "Disability Types",
    description: "Assess accessibility coverage for diverse disability groups.",
    color: "from-emerald-500 to-teal-600",
  },
  {
    href: "/dimensions",
    icon: "📐",
    label: "Dimensions",
    description: "Analyze accessibility dimensions and evaluation metrics.",
    color: "from-orange-500 to-amber-600",
  },
  {
    href: "/certification",
    icon: "🏆",
    label: "Certification",
    description: "Generate OBS, NEB, TIS(i), and CIS(j) certification results.",
    color: "from-pink-500 to-rose-600",
  },
];

export default function Home() {
  const year = new Date().getFullYear();

  return (
    <div
      className="min-h-screen bg-[#0b1120] text-white overflow-hidden"
      id="home"
    >
      <Header />

      <div className="absolute inset-0 -z-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-cyan-500/10 blur-3xl rounded-full" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-600/10 blur-3xl rounded-full" />
      </div>

      <main id="main-content" className="pt-32 px-6 lg:px-10">
        <section className="max-w-5xl mx-auto text-center mb-24">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 text-sm mb-6">
            Accessibility Intelligence Platform
          </div>

          <h1 className="text-5xl md:text-7xl font-black leading-tight mb-6">
            Smart Building{' '}
            <span className="block bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-500 bg-clip-text text-transparent">
              Accessibility Assessment
            </span>
          </h1>

          <p className="max-w-3xl mx-auto text-lg md:text-xl text-slate-300 leading-relaxed mb-10">
            Evaluate accessibility performance using advanced scoring
            frameworks including OBS, NEB, TIS(i), and CIS(j).
            Deliver measurable accessibility insights for modern
            buildings and inclusive environments.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/dashboard"
              className="group inline-flex items-center gap-3 bg-gradient-to-r from-cyan-500 to-blue-600 px-8 py-4 rounded-2xl font-semibold text-white shadow-lg shadow-cyan-500/20 hover:scale-105 transition-all duration-300"
            >
              Start Assessment{' '}
              <span className="group-hover:translate-x-1 transition-transform">
                →
              </span>
            </Link>

            <Link
              href="/certification"
              className="inline-flex items-center gap-2 border border-slate-700 bg-slate-900/60 hover:bg-slate-800/80 px-8 py-4 rounded-2xl font-semibold text-slate-200 transition-all duration-300"
            >
              View Certifications
            </Link>
          </div>


        </section>

        {/* QUICK LINKS */}
        <section className="max-w-7xl mx-auto mb-24">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-3xl font-bold mb-2">
                Assessment Modules
              </h2>

              <p className="text-slate-400">
                Navigate through accessibility evaluation tools and
                certification workflows.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-6">
            {quickLinks.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="group relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/60 p-6 hover:border-cyan-500/40 hover:-translate-y-2 transition-all duration-300"
              >
                <div
                  className={`absolute inset-0 opacity-0 group-hover:opacity-10 bg-gradient-to-br ${item.color} transition-opacity duration-300`}
                />

                <div className="relative z-10">
                  <div
                    className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center text-3xl mb-6 shadow-lg`}
                  >
                    {item.icon}
                  </div>

                  <h3 className="text-xl font-bold mb-3 text-white">
                    {item.label}
                  </h3>

                  <p className="text-sm text-slate-400 leading-relaxed mb-6">
                    {item.description}
                  </p>

                  <div className="flex items-center text-cyan-400 font-medium">
                    Open Module{' '}
                    <span className="ml-2 group-hover:translate-x-1 transition-transform">
                      →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* FOOTER */}
        <footer className="max-w-7xl mx-auto pb-12 text-center">
          <p className="text-slate-500 text-sm">
            AASTool by Serg | Dev by Y
          </p>
        </footer>
      </main>
    </div>
  );
}