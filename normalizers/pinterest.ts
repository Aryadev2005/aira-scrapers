// normalizers/pinterest.ts

import { extractHashtags } from "../utils/helpers";
import type { PinterestPin } from "../types/index";

export function normalizePin(raw: Record<string, unknown>): PinterestPin | null {
  if (!raw || typeof raw !== "object") return null;

  // New shape uses `id`, old shape uses `pin_id`
  const pinId = String(raw.id || raw.pin_id || raw.node_id || "");
  if (!pinId || pinId.startsWith("Rmls") || pinId.startsWith("UGlu")) {
    // base64 node_ids are internal — use the decoded id field instead
  }
  const realId = String(raw.id || raw.pin_id || "");
  if (!realId) return null;

  // Images — new shape
  const images = (raw.images as Record<string, Record<string, string>>) || {};
  const imageUrl =
    images?.orig?.url ||
    images?.["736x"]?.url ||
    images?.["474x"]?.url ||
    images?.["236x"]?.url ||
    (raw.image_url as string) || "";

  // Title — new shape has closeup_unified_title as object
  const rawTitle = raw.title || raw.closeup_unified_title || "";
  const title =
    typeof rawTitle === "string"
      ? rawTitle
      : (rawTitle as any)?.full || (rawTitle as any)?.text || "";

  // Description
  const rawDesc = raw.description || raw.grid_description || "";
  const description =
    typeof rawDesc === "string"
      ? rawDesc
      : (rawDesc as any)?.full || "";

  // Saves — new shape has aggregated_pin_data.aggregated_stats.saves
  const aggStats = (
    (raw.aggregated_pin_data as any)?.aggregated_stats
  );
  const saves = Number(
    aggStats?.saves ??
    raw.repin_count ??
    raw.repinCount ??
    raw.save_count ??
    raw.saves ??
    0
  );

  // Pinner
  const pinner = (raw.pinner || raw.native_creator || {}) as Record<string, unknown>;
  const board  = (raw.board || {}) as Record<string, unknown>;
  const owner  = (board.owner || {}) as Record<string, unknown>;

  const text = `${title} ${description}`;

  return {
    pin_id:           realId,
    title:            String(title).trim().slice(0, 300),
    description:      String(description).trim().slice(0, 500),
    image_url:        imageUrl,
    image_url_236:    images?.["236x"]?.url || "",
    image_url_474:    images?.["474x"]?.url || "",
    image_url_736:    images?.["736x"]?.url || "",
    pin_url:          String(raw.link || raw.url || `https://www.pinterest.com/pin/${realId}/`),
    board_name:       String(board.name || "").slice(0, 200),
    board_owner:      String(owner.username || owner.full_name || ""),
    pinner_username:  String(pinner.username || pinner.full_name || ""),
    pinner_followers: Number(pinner.follower_count || 0),
    saves,
    clicks:           Number(raw.click_count || raw.clickCount || 0),
    hashtags:         extractHashtags(text),
    pin_type:         String(raw.type || raw.pin_type || "pin"),
    dominant_color:   String(raw.dominant_color || ""),
    created_at:       (raw.created_at as string) || null,
  };
}