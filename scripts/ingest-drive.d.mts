/* Types for the two pure helpers tests/ingest-drive.spec.ts imports. */
export function parseDriveLink(raw: string): { kind: "folder" | "file" | "either"; id: string } | null;
export function sniff(buf: Uint8Array): { kind: "image" | "video"; type: string } | null;
