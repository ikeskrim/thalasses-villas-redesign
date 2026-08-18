"use client";

import { useEffect } from "react";

/**
 * The global error boundary.
 *
 * Same register as the 404, and the same refusal to be cute: something broke,
 * it says so, and it offers the two things a stranded visitor actually wants —
 * try again, or reach a person.
 *
 * It cannot use PageShell: that reads content off the filesystem on the server,
 * and this is a client component that must render when the server work is what
 * failed. So it is deliberately self-contained and depends on nothing.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // No telemetry is wired yet. Logging keeps the digest reachable in the
    // browser console rather than swallowing it silently.
    console.error("Unhandled error", error.digest ?? "", error);
  }, [error]);

  return (
    <div className="d d-error">
      <main id="main" className="canon">
        <p className="micro d-eyebrow">Something broke</p>
        <h1 className="display c2 d-pagehead-title">Not the view we intended</h1>
        <p className="d-villa-lede">
          An error stopped this page loading. It is on our side, not yours.
        </p>
        <p className="d-villa-cta">
          <button type="button" className="btn-primary micro" onClick={reset}>
            Try again
          </button>
          <a href="/en/contact" className="micro d-link">
            Tell us what happened
          </a>
        </p>
        {error.digest ? (
          <p className="caption d-form-stub">Reference: {error.digest}</p>
        ) : null}
      </main>
    </div>
  );
}
