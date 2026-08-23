import type { Facilities, FacilityItem } from "@/types/content";

/**
 * THE INVENTORY (DESIGN-PLAN §6.4).
 *
 * ~130 real amenity items per villa in six domains, of which the legacy site
 * showed only the first 65. The distribution is violently uneven — 65 / 40 /
 * 17 / 12 / 3 / 2 — so any layout treating the domains as peers is lying about
 * the data. The answer is an editorial cut, then a column flow, then honest
 * counts printed at full dignity.
 */

/** Groups that are not contents of a 60 m² villa. They belong to Location. */
export const BEYOND_THE_GATE_GROUPS = new Set([
  "Sports and Adventure",
  "Leisure",
  "Attractions",
]);

/** Domain -> the gerund that names it in the site's own grammar. */
const DOMAIN_CLAUSE: Record<string, string> = {
  Amenities: "Living",
  "Entertainment / Activities": "Playing",
  Children: "Minding",
  Cleaning: "Keeping",
  "Safety / Security": "Guarding",
  "Environment / Heating-Cooling": "Tempering",
};

export interface InventoryItem {
  id: number;
  name: string;
  /** Present only for numeric features (featureType 1/2). */
  value: string | null;
  /** The 29-odd items that carry real explanatory text. */
  description: string | null;
  /**
   * The registry's second, usually longer text for the same item.
   *
   * `description` and `extraDescription` were collapsed with `??`, so any item
   * carrying both showed only the short one and the richer one was discarded.
   * Sixteen items across the six facilities files did carry both, and **269
   * words** went unrendered — including "On your arrival you will find coffee,
   * sugar, salt, spices, some basic cleaning supplies, kitchen and toilet
   * paper, bottled water", which is exactly the kind of thing a guest wants to
   * know and exactly the kind of thing Phase 0 was for. (T4-7.)
   */
  extra: string | null;
}

export interface InventorySubgroup {
  name: string;
  items: InventoryItem[];
}

export interface InventoryGroup {
  clause: string;
  domain: string;
  count: number;
  subgroups: InventorySubgroup[];
}

export interface Inventory {
  groups: InventoryGroup[];
  total: number;
  /** Rows cut to the Location page rather than deleted. */
  movedToLocation: number;
  /** featureType 7 rows we cannot resolve without the CMS lookup table. */
  omittedUnresolved: number;
}

/**
 * featureType semantics, from the recovered payload:
 *   5 / 6  boolean amenity  -> print the name, nothing else
 *   1 / 2  numeric value    -> print "Name · N"
 *   7      enum id          -> OMIT SILENTLY. The value is a foreign key into a
 *          lookup table we do not have, so printing it would put a raw integer
 *          under a headline claiming completeness.
 */
function renderable(item: FacilityItem): boolean {
  return item.featureType !== 7;
}

function toItem(item: FacilityItem): InventoryItem {
  const numeric = item.featureType === 1 || item.featureType === 2;
  return {
    id: item.featureId,
    name: item.name,
    value: numeric && item.value != null ? String(item.value) : null,
    description: item.description ?? item.extraDescription ?? null,
    /* Only when it is a SECOND text, not a repeat of the one above. */
    extra:
      item.description && item.extraDescription && item.description !== item.extraDescription
        ? item.extraDescription
        : null,
  };
}

export function buildInventory(facilities: Facilities): Inventory {
  const groups: InventoryGroup[] = [];
  let movedToLocation = 0;
  let omittedUnresolved = 0;

  for (const tab of facilities.tabs) {
    const subgroups: InventorySubgroup[] = [];

    for (const g of tab.groups) {
      if (BEYOND_THE_GATE_GROUPS.has(g.group)) {
        movedToLocation += g.items.length;
        continue;
      }
      omittedUnresolved += g.items.filter((i) => !renderable(i)).length;
      const items = g.items.filter(renderable).map(toItem);
      if (items.length) subgroups.push({ name: g.group, items });
    }

    const count = subgroups.reduce((a, s) => a + s.items.length, 0);
    // A domain whose every row was an unresolved enum id has nothing honest to
    // show, so it is not printed at all rather than printed empty.
    if (!count) continue;

    groups.push({
      clause: DOMAIN_CLAUSE[tab.tab] ?? tab.tab,
      domain: tab.tab,
      count,
      subgroups,
    });
  }

  return {
    groups,
    total: groups.reduce((a, g) => a + g.count, 0),
    movedToLocation,
    omittedUnresolved,
  };
}

/** The groups cut from the villa page, for "Beyond the Gate" on Location. */
export function beyondTheGate(facilities: Facilities): InventorySubgroup[] {
  const out: InventorySubgroup[] = [];
  for (const tab of facilities.tabs) {
    for (const g of tab.groups) {
      if (!BEYOND_THE_GATE_GROUPS.has(g.group)) continue;
      const items = g.items.filter(renderable).map(toItem);
      if (items.length) out.push({ name: g.group, items });
    }
  }
  return out;
}
