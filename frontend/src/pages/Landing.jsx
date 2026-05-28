import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import {
  Sparkles,
  GitBranch,
  Calendar,
  Users,
  TrendingUp,
  Bell,
  Shield,
  FileSpreadsheet,
  Pencil,
  CheckCircle2,
  BarChart3,
  Download,
  User,
  Settings,
  ArrowRight,
  Zap,
  ExternalLink,
} from 'lucide-react';

/* ────────────────────── animation helpers ────────────────────── */
const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.12 } },
};
const item = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

function SectionReveal({ children, className = '' }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      viewport={{ once: true, margin: '-60px' }}
    >
      {children}
    </motion.div>
  );
}

/* ────────── count-up stat ────────── */
function CountUpStat({ label, value, suffix = '' }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  return (
    <div ref={ref} className="text-center px-6 py-5">
      <div className="text-3xl md:text-4xl font-black text-blue-400">
        {isInView ? value : 0}{suffix}
      </div>
      <div className="mt-1 text-sm text-slate-400 font-medium">{label}</div>
    </div>
  );
}

/* ────────── feature data ────────── */
const features = [
  { icon: Sparkles, title: 'AI Goal Suggestions', desc: 'Describe your goal in plain words. Our LLaMA 3.3-70b AI structures it perfectly.', color: 'blue', badge: 'Powered by Groq' },
  { icon: GitBranch, title: 'Smart Approval Workflow', desc: 'Managers review, edit targets inline and approve with one click.', color: 'indigo' },
  { icon: Calendar, title: 'Quarterly Check-ins', desc: 'Structured Q1-Q4 progress tracking with auto-computed performance scores.', color: 'violet' },
  { icon: Users, title: 'Shared Goals', desc: 'Push departmental KPIs to entire teams. Achievement syncs automatically.', color: 'blue' },
  { icon: TrendingUp, title: 'Analytics Dashboard', desc: 'QoQ trends, completion heatmaps and manager effectiveness charts.', color: 'indigo' },
  { icon: Bell, title: 'Escalation Engine', desc: 'Rule-based auto-escalation. Never miss a deadline silently again.', color: 'amber' },
  { icon: Shield, title: 'Audit Trail', desc: 'Complete change history. Know who changed what and exactly when.', color: 'green' },
  { icon: FileSpreadsheet, title: 'Export Reports', desc: 'One-click Excel and CSV exports for appraisal season.', color: 'blue' },
];

const iconColorMap = {
  blue: 'bg-blue-500/10 text-blue-400',
  indigo: 'bg-indigo-500/10 text-indigo-400',
  violet: 'bg-violet-500/10 text-violet-400',
  amber: 'bg-amber-500/10 text-amber-400',
  green: 'bg-green-500/10 text-green-400',
};

const borderColorMap = {
  blue: 'border-l-blue-500',
  indigo: 'border-l-indigo-500',
  violet: 'border-l-violet-500',
};

const steps = [
  { icon: Pencil, title: 'Set Goals', desc: 'Employees create structured goals with targets, weightage and UoM types', color: 'blue' },
  { icon: CheckCircle2, title: 'Manager Approval', desc: 'Managers review, edit inline and approve goal sheets which then get locked', color: 'indigo' },
  { icon: BarChart3, title: 'Track Progress', desc: 'Quarterly check-ins with auto-calculated progress scores', color: 'violet' },
  { icon: Download, title: 'Analyze & Export', desc: 'Analytics dashboard, heatmaps and Excel/CSV reports for appraisals', color: 'blue' },
];

const roles = [
  {
    icon: User,
    title: 'Employee',
    color: 'blue',
    items: [
      'Create and manage goals',
      'AI-powered goal suggestions',
      'Submit quarterly check-ins',
      'Track progress in real-time',
      'View manager feedback',
    ],
  },
  {
    icon: Users,
    title: 'Manager',
    color: 'indigo',
    featured: true,
    items: [
      'Review and approve goal sheets',
      'Edit targets inline before approval',
      'Push shared goals to team',
      'Conduct quarterly check-ins',
      'Add structured feedback',
    ],
  },
  {
    icon: Settings,
    title: 'Admin / HR',
    color: 'violet',
    items: [
      'Manage org hierarchy and users',
      'Configure cycle windows',
      'View analytics and heatmaps',
      'Export achievement reports',
      'Monitor escalations and audit logs',
    ],
  },
];

/* ═══════════════════════════════════════════ */
/*                  LANDING                    */
/* ═══════════════════════════════════════════ */
function Landing() {
  const navigate = useNavigate();
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const featuresRef = useRef(null);

  const handleMouse = (e) => {
    setMouse({ x: e.clientX, y: e.clientY });
  };

  const scrollToFeatures = () => {
    featuresRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="bg-[#0f172a] text-white overflow-x-hidden">
      {/* ─────── HERO ─────── */}
      <section
        className="relative min-h-screen flex items-center"
        onMouseMove={handleMouse}
        style={{
          backgroundImage:
            'linear-gradient(rgba(59,130,246,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.03) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
        }}
      >
        {/* mouse glow */}
        <div
          className="fixed top-0 left-0 w-96 h-96 rounded-full bg-blue-500/5 blur-3xl pointer-events-none z-0"
          style={{
            transform: `translate(${mouse.x - 192}px, ${mouse.y - 192}px)`,
            transition: 'transform 0.1s ease-out',
          }}
        />

        <div className="relative z-10 mx-auto max-w-7xl w-full px-6 py-20 grid lg:grid-cols-2 gap-12 items-center">
          {/* LEFT */}
          <motion.div variants={container} initial="hidden" animate="show">
            <motion.div variants={item}>
              <span className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-sm font-medium text-blue-400">
                ✦ High Performance Goal Tracking
              </span>
            </motion.div>

            <motion.h1
              variants={item}
              className="mt-8 text-5xl sm:text-6xl font-black leading-[1.08] tracking-tight text-[#f8fafc]"
            >
              Align Goals.
            </motion.h1>
            <motion.h1
              variants={item}
              className="text-5xl sm:text-6xl font-black leading-[1.08] tracking-tight text-[#f8fafc]"
            >
              Track Progress.
            </motion.h1>
            <motion.h1
              variants={item}
              className="text-5xl sm:text-6xl font-black leading-[1.08] tracking-tight bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent"
            >
              Achieve More.
            </motion.h1>

            <motion.p
              variants={item}
              className="mt-6 max-w-lg text-xl text-slate-400 leading-relaxed"
            >
              The enterprise-grade goal management portal that connects employee
              ambitions to organizational outcomes.
            </motion.p>

            <motion.div variants={item} className="mt-8 flex flex-wrap gap-4">
              <button
                onClick={() => navigate('/login')}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/25"
              >
                Get Started <ArrowRight className="size-4" />
              </button>
              <button
                onClick={scrollToFeatures}
                className="border border-slate-600 hover:border-blue-500 text-slate-300 px-8 py-3 rounded-xl font-semibold transition-all duration-200"
              >
                View Demo
              </button>
            </motion.div>

            <motion.div
              variants={item}
              className="mt-5 flex flex-wrap gap-4 text-sm text-slate-500"
            >
              <span>✓ Free to use</span>
              <span>✓ No credit card</span>
              <span>✓ 3 roles</span>
            </motion.div>
          </motion.div>

          {/* RIGHT — floating dashboard preview */}
          <motion.div
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="hidden lg:block"
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-[0_0_80px_rgba(59,130,246,0.15)]"
            >
              {/* top badge */}
              <div className="flex items-center gap-2 mb-5">
                <span className="relative flex size-2.5">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex size-2.5 rounded-full bg-green-500" />
                </span>
                <span className="text-sm font-semibold text-green-400">
                  Q2 Check-in Active
                </span>
              </div>

              {/* mini stat cards */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                {[
                  { label: 'Goals', value: '8' },
                  { label: 'Score', value: '92%' },
                  { label: 'Approved', value: '3' },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="rounded-xl bg-white/5 border border-white/10 p-3 text-center"
                  >
                    <div className="text-xl font-bold text-white">{s.value}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* progress bars */}
              {[
                { label: 'Sales Revenue', pct: 85 },
                { label: 'Customer Satisfaction', pct: 92 },
                { label: 'Cost Reduction', pct: 78 },
              ].map((goal) => (
                <div key={goal.label} className="mb-4 last:mb-0">
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="text-slate-300">{goal.label}</span>
                    <span className="text-blue-400 font-semibold">{goal.pct}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${goal.pct}%` }}
                      transition={{ duration: 1.2, delay: 0.8, ease: 'easeOut' }}
                    />
                  </div>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ─────── STATS BAR ─────── */}
      <section className="bg-slate-900 border-y border-slate-800">
        <div className="mx-auto max-w-7xl grid grid-cols-2 md:grid-cols-4 divide-x divide-slate-800">
          <CountUpStat label="User Roles" value={3} />
          <CountUpStat label="Goal Types" value={8} />
          <CountUpStat label="Quarter Cycles" value={4} />
          <div className="text-center px-6 py-5 flex flex-col items-center justify-center">
            <div className="flex items-center gap-2 text-3xl md:text-4xl font-black text-blue-400">
              <Zap className="size-7" /> AI
            </div>
            <div className="mt-1 text-sm text-slate-400 font-medium">Powered</div>
          </div>
        </div>
      </section>

      {/* ─────── HOW IT WORKS ─────── */}
      <section className="bg-slate-50 py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-6">
          <SectionReveal className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
              How Performix Works
            </h2>
            <p className="mt-3 text-slate-500 max-w-lg mx-auto">
              From goal creation to performance insights in 4 simple steps
            </p>
          </SectionReveal>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <SectionReveal key={step.title}>
                  <motion.div
                    whileHover={{ y: -4, scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                    className="relative bg-white rounded-2xl shadow-sm border border-slate-200 hover:shadow-md hover:border-blue-200 transition-all duration-300 p-6 h-full"
                  >
                    <span className="absolute top-4 right-4 text-7xl font-black text-blue-50 select-none leading-none">
                      {i + 1}
                    </span>
                    <div
                      className={`inline-flex p-3 rounded-xl ${iconColorMap[step.color] || iconColorMap.blue}`}
                    >
                      <Icon className="size-5" />
                    </div>
                    <h3 className="mt-4 text-lg font-bold text-slate-900">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-sm text-slate-500 leading-relaxed relative z-10">
                      {step.desc}
                    </p>
                  </motion.div>
                </SectionReveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─────── FEATURES GRID ─────── */}
      <section ref={featuresRef} className="bg-slate-900 py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-6">
          <SectionReveal className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent inline-block">
              Everything You Need
            </h2>
          </SectionReveal>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((feat) => {
              const Icon = feat.icon;
              return (
                <SectionReveal key={feat.title}>
                  <motion.div
                    whileHover={{ y: -4, scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                    className="bg-slate-800/50 border border-slate-700 hover:border-blue-500/50 hover:bg-slate-800 rounded-2xl p-6 transition-all duration-300 h-full"
                  >
                    <div
                      className={`inline-flex p-3 rounded-xl ${iconColorMap[feat.color] || iconColorMap.blue}`}
                    >
                      <Icon className="size-5" />
                    </div>
                    <h3 className="mt-4 text-base font-bold text-white">
                      {feat.title}
                    </h3>
                    <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                      {feat.desc}
                    </p>
                    {feat.badge && (
                      <span className="mt-3 inline-flex items-center rounded-full bg-green-500/10 px-3 py-1 text-xs font-semibold text-green-400">
                        {feat.badge}
                      </span>
                    )}
                  </motion.div>
                </SectionReveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─────── ROLES ─────── */}
      <section className="bg-white py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-6">
          <SectionReveal className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
              Built for Every Role
            </h2>
          </SectionReveal>

          <div className="grid md:grid-cols-3 gap-6">
            {roles.map((role) => {
              const Icon = role.icon;
              return (
                <SectionReveal key={role.title}>
                  <motion.div
                    whileHover={{ y: -4 }}
                    transition={{ duration: 0.2 }}
                    className={`rounded-2xl border shadow-sm p-6 h-full transition-all duration-300 hover:shadow-md border-l-4 ${borderColorMap[role.color]} ${
                      role.featured
                        ? 'ring-2 ring-indigo-500/30 border-slate-200'
                        : 'border-slate-200'
                    }`}
                  >
                    <div
                      className={`inline-flex p-3 rounded-xl ${iconColorMap[role.color]}`}
                    >
                      <Icon className="size-5" />
                    </div>
                    <h3 className="mt-4 text-xl font-bold text-slate-900">
                      {role.title}
                    </h3>
                    <ul className="mt-4 space-y-2.5">
                      {role.items.map((li) => (
                        <li
                          key={li}
                          className="flex items-start gap-2 text-sm text-slate-600"
                        >
                          <CheckCircle2 className="size-4 text-green-500 mt-0.5 shrink-0" />
                          {li}
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                </SectionReveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─────── CTA ─────── */}
      <section className="relative bg-gradient-to-br from-blue-900 to-indigo-900 py-20 md:py-28 overflow-hidden">
        {/* gradient orbs */}
        <div className="absolute top-10 left-10 w-72 h-72 rounded-full bg-blue-500/10 blur-3xl animate-pulse" />
        <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-indigo-500/10 blur-3xl animate-pulse" />

        <SectionReveal className="relative z-10 text-center mx-auto max-w-2xl px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight">
            Ready to Transform Your Performance Culture?
          </h2>
          <p className="mt-4 text-lg text-blue-200/80">
            Join the future of goal management
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <button
              onClick={() => navigate('/login')}
              className="bg-white text-slate-900 px-8 py-3 rounded-xl font-semibold hover:bg-blue-50 transition-all duration-200 hover:shadow-lg"
            >
              Login to Performix
            </button>
          </div>
        </SectionReveal>
      </section>

      {/* ─────── FOOTER ─────── */}
      <footer className="bg-slate-950 py-12 border-t border-slate-800">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid md:grid-cols-2 gap-8 items-start">
            <div>
              <div className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-xl bg-blue-600 text-white font-bold text-sm">
                  P
                </span>
                <span className="text-lg font-bold text-white">Performix</span>
              </div>
              <p className="mt-3 text-sm text-slate-400">
                Align. Track. Achieve.
              </p>
            </div>
            <div className="text-sm text-slate-400 space-y-1">
              <div>Built with MERN Stack + Groq AI</div>
              <div>Deployed on Vercel + Render</div>
            </div>
          </div>
          <div className="mt-10 pt-6 border-t border-slate-800 text-center text-xs text-slate-500">
            © 2025 Performix. Built with ❤️
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Landing;
