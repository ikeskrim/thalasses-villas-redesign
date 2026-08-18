/**
 * The route-level loading state.
 *
 * Deliberately NOT a spinner and NOT a skeleton: it is the limestone ground,
 * held. A white flash between routes is the single cheapest way to make an
 * expensive site feel cheap, and a spinner announces waiting where the pelagos
 * wipe is already covering the gap.
 *
 * The only content is a screen-reader status, so the wait is announced to
 * someone who cannot see the ground stay still.
 */
export default function Loading() {
  return (
    <div className="d d-loading" role="status" aria-live="polite">
      <span className="sr-only">Loading</span>
    </div>
  );
}
