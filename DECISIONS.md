# Decisions

Owner decisions, recorded the moment they are relayed. See `CONVENTIONS.md` §19.

This file exists because of a defect, not a process improvement: the owner
approved a design direction and that approval lived only in a chat window, so a
later session read the register of a brief and built against a different
aesthetic. **A decision that is not in the repository is not a decision anyone
after you can act on.**

---

## D-001 · Direction F, "The Cretan Hotel" — the production direction

**Decided:** September 2026, by the owner.
**Relayed to the repository:** this entry.
**Status:** in force.

Direction F is the production direction. The dense, warm, credible luxury-hotel
homepage: Book Now pinned top-right, a slow hero, villa cards carrying facts and
two buttons, experiences grouped by kind, weddings, distances, a press wall, and
a real hotel footer with the operating licence in it.

**Wanted on top:** more cinematic, and unusual-but-luxurious motion, per
`MOTION-DIRECTIVE.md`.

### What that settles

- `/` is Direction F. The chooser and the four other candidate looks are removed
  from the build; their record and their findings stay in `SESSION-REPORT.md`
  and `RE-SKIN-DIRECTIVE.md`.
- Aesthetic work is measured against **this** direction. Aman-register
  minimalism, oversized display type and type-led layouts were the earlier
  candidates and are no longer the target, however strongly a later brief's
  language leans that way.
- Motion is calibrated by the weirdness dial in `MOTION-DIRECTIVE.md`:
  conversion-critical and dense zones stay at Level 1, narrative zones at Level
  2, and no more than three Level-3 set-pieces on the page.

### What it does not settle

- The Greek locale. `/el` remains unpublished; the corpus is `copyStatus:
  "draft"` with 371 questions awaiting the owner's native review.
- The fourteen quarantined non-property frames (see
  `content/flagged-quarantine.json`). Still owner-pending.
- The section quote, the press wall beyond its single verified mention, and the
  group's sister properties. All still labelled slots.
