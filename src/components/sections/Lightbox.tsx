"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

export interface Frame {
  src: string;
  alt: string;
  caption: string | null;
}

/**
 * THE LIGHTBOX.
 *
 * Keyboard-complete and focus-trapped, because a fullscreen overlay that leaves
 * focus behind it is the most common accessibility failure in the whole gallery
 * genre: a screen-reader user tabs "past" the image into a page they cannot
 * see, with no way back and no idea the overlay is open.
 *
 *  - opens on click or Enter/Space from a real <button>
 *  - Escape closes AND returns focus to the thumbnail that opened it
 *  - Tab and Shift+Tab cycle inside the dialog, never behind it
 *  - Left/Right move between frames
 *  - the page beneath is inert (`aria-hidden`) and cannot scroll
 *
 * Captions come from the inventory only. A frame with no caption gets none —
 * inventing one to fill the space would be inventing content about a property.
 */
export function Lightbox({
  frames,
  openAt,
  onClose,
}: {
  frames: Frame[];
  openAt: number | null;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(openAt ?? 0);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (openAt !== null) setIndex(openAt);
  }, [openAt]);

  const move = useCallback(
    (delta: number) => setIndex((i) => (i + delta + frames.length) % frames.length),
    [frames.length]
  );

  useEffect(() => {
    if (openAt === null) return;

    // The page beneath must not scroll under the overlay, and must not be
    // reachable by tab.
    const { body } = document;
    const previousOverflow = body.style.overflow;
    body.style.overflow = "hidden";
    const main = document.getElementById("main");
    main?.setAttribute("aria-hidden", "true");

    closeRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        move(1);
        return;
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        move(-1);
        return;
      }
      if (e.key !== "Tab") return;

      // The trap. Without it, Tab walks out of the dialog into a page the
      // reader cannot see and cannot get back from.
      const focusables = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button, [href], [tabindex]:not([tabindex="-1"])'
      );
      if (!focusables?.length) return;
      const first = focusables[0]!;
      const last = focusables[focusables.length - 1]!;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      body.style.overflow = previousOverflow;
      main?.removeAttribute("aria-hidden");
    };
  }, [openAt, move, onClose]);

  if (openAt === null) return null;
  const frame = frames[index];
  if (!frame) return null;

  return (
    <div
      className="d-lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={`Photograph ${index + 1} of ${frames.length}`}
      ref={dialogRef}
    >
      <div className="d-lightbox-bar">
        <span className="micro d-lightbox-count tabular">
          {index + 1} / {frames.length}
        </span>
        <button ref={closeRef} type="button" className="micro d-lightbox-btn" onClick={onClose}>
          Close
        </button>
      </div>

      <div className="d-lightbox-stage">
        <Image
          key={frame.src}
          src={frame.src}
          alt={frame.alt}
          fill
          sizes="100vw"
          quality={85}
          priority
          style={{ objectFit: "contain" }}
        />
      </div>

      <div className="d-lightbox-foot">
        <button type="button" className="micro d-lightbox-btn" onClick={() => move(-1)}>
          Previous
        </button>
        {frame.caption ? <p className="caption d-lightbox-caption">{frame.caption}</p> : <span />}
        <button type="button" className="micro d-lightbox-btn" onClick={() => move(1)}>
          Next
        </button>
      </div>
    </div>
  );
}
