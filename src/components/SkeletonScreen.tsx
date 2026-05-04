import { motion } from 'framer-motion';

function SkeletonPulse({ className }: { className: string }) {
  return (
    <div className={`animate-pulse bg-slate-200 dark:bg-slate-700 rounded-xl ${className}`} />
  );
}

export default function SkeletonScreen() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-[#F2F2F7] dark:bg-black p-4"
    >
      <div className="max-w-md mx-auto space-y-4 pt-2">
        {/* Relógio */}
        <div className="ios-card rounded-2xl p-6 shadow-xl space-y-4">
          <SkeletonPulse className="h-4 w-32 mx-auto" />
          <SkeletonPulse className="h-16 w-48 mx-auto" />
          <SkeletonPulse className="h-10 w-full" />
        </div>

        {/* Botão */}
        <div className="ios-card rounded-2xl p-6 shadow-xl space-y-4">
          <SkeletonPulse className="h-14 w-full" />
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-slate-50 dark:bg-slate-800 p-4 space-y-2">
              <SkeletonPulse className="h-3 w-20 mx-auto" />
              <SkeletonPulse className="h-7 w-16 mx-auto" />
            </div>
            <div className="rounded-2xl bg-slate-50 dark:bg-slate-800 p-4 space-y-2">
              <SkeletonPulse className="h-3 w-16 mx-auto" />
              <SkeletonPulse className="h-7 w-16 mx-auto" />
            </div>
          </div>
          <SkeletonPulse className="h-3 w-40 mx-auto" />
        </div>

        {/* Timeline */}
        <div className="ios-card rounded-2xl p-6 shadow-xl space-y-3">
          <SkeletonPulse className="h-4 w-32" />
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl">
              <SkeletonPulse className="h-10 w-10 rounded-xl shrink-0" />
              <div className="flex-1 space-y-1.5">
                <SkeletonPulse className="h-3.5 w-20" />
                <SkeletonPulse className="h-3 w-14" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tab bar skeleton */}
      <div className="fixed bottom-0 left-0 right-0 z-50 pb-safe">
        <div className="max-w-md mx-auto px-4 pb-4 pt-2">
          <div className="ios-card rounded-2xl flex items-center justify-around p-2 shadow-2xl">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl">
                <SkeletonPulse className="h-5 w-5" />
                <SkeletonPulse className="h-2.5 w-10" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
