import { Clause } from "@/components/ui/Clause";
import { Field } from "@/components/ui/Field";

export interface HeroProps {
  image: string;
  alt: string;
  horizonY?: number;
  gerund: string;
  tail: string;
  eyebrow?: string;
}

/**
 * Beat 01 (DESIGN-PLAN §5.5).
 *
 * One still photograph. Never video, never a slider — the legacy hero's slides
 * 2–6 carry no copy at all (T-036), so a carousel would be motion for its own
 * sake. No scroll cue: the C1 clause sitting on the lower third is the cue.
 */
export function Hero({ image, alt, horizonY, gerund, tail, eyebrow }: HeroProps) {
  return (
    <Field src={image} alt={alt} horizonY={horizonY} height="100svh" priority>
      <div className="canon clause-field" style={{ padding: 0 }}>
        {eyebrow ? (
          <p className="micro" style={{ marginBottom: "var(--spacing-step-4)" }}>
            {eyebrow}
          </p>
        ) : null}
        <Clause gerund={gerund} tail={tail} scale="c1" animate as="h1" />
      </div>
    </Field>
  );
}
