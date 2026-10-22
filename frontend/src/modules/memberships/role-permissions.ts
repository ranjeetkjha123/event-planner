export type WeddingRole = "ADMIN" | "MANAGER" | "VIEWER";

export function canWriteWeddingContent(role: WeddingRole) {
  return role !== "VIEWER";
}
