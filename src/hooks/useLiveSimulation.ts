import { useEffect } from 'react';
import { simulateActivity } from '../api/client';

/**
 * Cadence for firing demo traffic. Matches the leaderboard poll so each nudge is
 * followed by a refresh that shows it — together they make the board look alive.
 */
const SIMULATE_INTERVAL_MS = 2500;

/**
 * Demo "live traffic" driver: while `enabled`, fires `POST /admin/simulate`
 * every `SIMULATE_INTERVAL_MS` so the board keeps moving. Paused while the tab
 * is hidden (don't generate load no one is watching).
 *
 * This is deliberately client-driven: the backend keeps no timer or background
 * loop, so it stays stateless (every instance is equal) — the browser is what
 * makes the deployed board feel alive. Failures are swallowed; a dropped tick is
 * harmless (the next one covers it), and if the simulator is disabled server-
 * side (`ENABLE_SIMULATOR=false`) the 403s are simply ignored.
 */
export function useLiveSimulation(enabled: boolean): void {
  useEffect(() => {
    if (!enabled) return;

    const tick = () => {
      if (document.hidden) return;
      void simulateActivity().catch(() => {
        /* dropped/disabled tick — the next one covers it */
      });
    };

    const id = window.setInterval(tick, SIMULATE_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [enabled]);
}
