const sameAvatar = (a, b) =>
  JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

export function buildUserPayload({
  name,
  password,
  initialName,
  avatarDraft,
  initialAvatar,
}) {
  const body = {};
  if (name.trim() !== initialName) body.newUsername = name.trim();
  if (password.trim()) body.newPassword = password.trim();
  if (!sameAvatar(avatarDraft, initialAvatar)) {
    body.avatarUrl = avatarDraft?.url ?? null;
    body.avatarPublicId = avatarDraft?.publicId ?? null;
  }
  return body;
}

export function buildGroupPayload({
  name,
  initialName,
  avatarDraft,
  initialAvatar,
}) {
  const body = {};
  if (name.trim() !== initialName) body.newTitle = name.trim();
  if (!sameAvatar(avatarDraft, initialAvatar)) {
    body.avatarUrl = avatarDraft?.url ?? null;
    body.avatarPublicId = avatarDraft?.publicId ?? null;
  }
  return body;
}
