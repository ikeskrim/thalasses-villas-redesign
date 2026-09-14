/* Types for the pure helpers tests/ingest-drive.spec.ts imports. */
export function parseDriveLink(raw: string): { kind: "folder" | "file" | "either"; id: string; resourceKey?: string } | null;
export function parseFolderListing(
  html: string
): ({ kind: "folder" | "file"; id: string; name: string; resourceKey?: string } | { kind: "skipped"; id: string; name: string; reason: string })[];
export function sniff(buf: Uint8Array, tail?: Uint8Array): { kind: "image" | "video"; type: string } | null;
export function sniffFile(file: string): { kind: "image" | "video"; type: string } | null;
export function heroVariantPlan(inputRel: string, dirRel: string): { name: string; budget: boolean; args: string[] }[];
export function commandLine(args: string[], exe?: string): string;
