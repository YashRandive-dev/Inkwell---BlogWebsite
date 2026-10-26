import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

// Slim bar at the very top of the page. It appears whenever the app is navigating or
// waiting on the API, so the user always gets feedback that something is happening.
export default function RouteProgress() {
  const { pathname } = useLocation();
  const [busy, setBusy] = useState(false);
  const [navigating, setNavigating] = useState(false);
  const showTimer = useRef(null);

  // Any API request in flight (shown only if it takes longer than ~120ms to avoid flicker).
  useEffect(() => {
    const onPending = (e) => {
      clearTimeout(showTimer.current);
      if (e.detail > 0) showTimer.current = setTimeout(() => setBusy(true), 120);
      else setBusy(false);
    };
    window.addEventListener('api:pending', onPending);
    return () => {
      window.removeEventListener('api:pending', onPending);
      clearTimeout(showTimer.current);
    };
  }, []);

  // A short sweep on every route change.
  useEffect(() => {
    setNavigating(true);
    const t = setTimeout(() => setNavigating(false), 450);
    return () => clearTimeout(t);
  }, [pathname]);

  const active = busy || navigating;

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          key="progress"
          className="pointer-events-none fixed left-0 right-0 top-0 z-[90] h-[3px] overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.25 } }}
          role="progressbar"
          aria-label="Loading"
        >
          <motion.div
            className="h-full w-1/3 rounded-full bg-gradient-to-r from-brand-500 via-accent-400 to-brand-500"
            initial={{ x: '-100%' }}
            animate={{ x: '300%' }}
            transition={{ duration: 1.1, ease: 'easeInOut', repeat: Infinity }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
