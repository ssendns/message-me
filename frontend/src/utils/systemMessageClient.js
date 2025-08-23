function nameById(id, participants, currentUserId, fallback) {
  if (id == null) return "system";
  if (String(id) === String(currentUserId)) return "you";
  const user = (participants || []).find((p) => String(p.id) === String(id));
  return user?.username ?? fallback ?? `user#${id}`;
}

export function systemPreview(message, participants, currentUserId) {
  const text = systemText(message, participants, currentUserId);
  return text;
}

export function systemText(message, participants, currentUserId) {
  if (!message || message.type !== "SYSTEM") return message?.text ?? "";
  const meta = message.meta || {};
  const user = nameById(
    meta?.userId ?? message.fromId,
    participants,
    currentUserId,
    meta?.userName
  );
  const target = nameById(
    meta?.targetId,
    participants,
    currentUserId,
    meta?.targetName
  );

  switch (meta.action) {
    case "member_added":
      return `${user} added ${target}`;
    case "member_removed":
      return `${user} removed ${target}`;
    case "member_left":
      return `${user} left the group`;
    case "promoted_to_admin":
      return `${user} made ${target} admin`;
    case "demoted_from_admin":
      return `${user} removed admin from ${target}`;
    case "title_changed":
      if (meta?.title) {
        return `${user} renamed the group: “${meta.title}”`;
      }
      return `${user} renamed the group`;
    case "avatar_changed":
      return `${user} changed the group avatar`;
    case "chat_deleted":
      return `${user} deleted the group`;
    default:
      return "system update";
  }
}
