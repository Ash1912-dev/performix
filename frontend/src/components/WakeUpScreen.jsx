import { useEffect, useState } from 'react';

const TIPS = [
  'Setting up your goal tracking workspace...',
  'Loading performance analytics...',
  'Preparing your team dashboard...',
  'Almost ready! Syncing your goals...',
];

const PROGRESS_DURATION = 40000; // 40 seconds to reach 95%
const PROGRESS_MAX = 95;
const TIP_ROTATE_INTERVAL = 8000;

export default function WakeUpScreen({ hasTimedOut = false }) {
  const [progress, setProgress] = useState(0);
  const [tipIndex, setTipIndex] = useState(0);

  // Animated progress bar — increments smoothly to 95% over 40 seconds
  useEffect(() => {
    const startTime = Date.now();
    const tick = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min((elapsed / PROGRESS_DURATION) * PROGRESS_MAX, PROGRESS_MAX);
      setProgress(pct);
      if (pct >= PROGRESS_MAX) clearInterval(tick);
    }, 200);
    return () => clearInterval(tick);
  }, []);

  // Rotate tip messages every 8 seconds
  useEffect(() => {
    const id = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % TIPS.length);
    }, TIP_ROTATE_INTERVAL);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4"
      style={{
        background: 'linear-gradient(180deg, #f8fafc 0%, #eff6ff 100%)',
      }}
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-12 text-center shadow-xl">
        {/* Logo */}
        <div className="mb-8 flex items-center justify-center gap-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-900">
            <span className="text-2xl font-bold text-white">P</span>
          </div>
          <span className="text-2xl font-bold text-slate-900">Performix</span>
        </div>

        {hasTimedOut ? (
          /* Timeout state */
          <>
            <div className="mb-4 flex justify-center">
              <svg
                className="h-12 w-12 text-amber-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="mb-2 text-lg font-semibold text-slate-900">
              Taking longer than usual
            </h2>
            <p className="mb-6 text-sm text-gray-500">
              The server is taking longer than expected to respond. Please
              refresh the page to try again.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-xl bg-blue-500 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-600"
            >
              Refresh Page
            </button>
          </>
        ) : (
          /* Loading state */
          <>
            {/* Spinner */}
            <div className="mb-6 flex justify-center">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
            </div>

            {/* Main message */}
            <h2 className="mb-2 text-lg font-semibold text-slate-900">
              Performix is starting up...
            </h2>
            <p className="mb-6 text-sm text-gray-500">
              Our free server needs a moment to wake up. This usually takes
              20–30 seconds.
            </p>

            {/* Progress bar */}
            <div className="mx-auto mb-6 w-full overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-2 rounded-full bg-blue-500 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Rotating tip */}
            <p className="animate-pulse text-sm italic text-blue-600">
              {TIPS[tipIndex]}
            </p>
          </>
        )}

        {/* Footer */}
        <p className="mt-8 text-xs text-gray-400">
          Powered by Render Free Tier
        </p>
      </div>
    </div>
  );
}
