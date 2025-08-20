const BASE_URL = "http://localhost:3000";

async function request(endpoint, { method = "GET", token, body } = {}) {
  const headers = {};
  if (body && !(body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers,
    body: body && !(body instanceof FormData) ? JSON.stringify(body) : body,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || error.message || "request failed");
  }

  return await res.json().catch(() => ({}));
}

export function getUserByUsername(username) {
  return request(`/profile/username/${username}`);
}

export function getAllUsers(token) {
  return request("/profile/all", { token });
}

export function updateUser({ newUsername, newPassword, avatarUrl, token }) {
  const payload = {};
  if (newUsername && newUsername.trim())
    payload.newUsername = newUsername.trim();
  if (newPassword && newPassword.trim())
    payload.newPassword = newPassword.trim();
  if (avatarUrl && avatarUrl.trim()) payload.avatarUrl = avatarUrl.trim();
  if (typeof avatarUrl !== "undefined") {
    payload.avatarUrl =
      typeof avatarUrl === "string" ? avatarUrl.trim() : avatarUrl;
  }

  return request("/profile/edit", {
    method: "PATCH",
    token,
    body: payload,
  });
}

export async function upload(file) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${BASE_URL}/upload`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) throw new Error("upload failed");

  return await res.json();
}

export async function getChatMessages({
  chatId,
  token,
  limit = 30,
  cursor,
  direction = "older",
}) {
  const q = new URLSearchParams();
  if (limit) q.set("limit", String(limit));
  if (cursor != null) q.set("cursor", String(cursor));
  if (direction) q.set("direction", direction);

  const url = `/chats/${chatId}/messages?${q.toString()}`;
  const data = await request(url, { token });
  return data;
}

export async function getAllChats(token) {
  return request(`/chats`, {
    token,
  });
}

export async function signUp({ username, password }) {
  return request("/sign-up", {
    method: "POST",
    body: { username, password },
  });
}

export async function logIn({ username, password }) {
  return request("/log-in", {
    method: "POST",
    body: { username, password },
  });
}

export function updateAvatar({ token, imageUrl, imagePublicId }) {
  return request("/profile/avatar", {
    method: "PATCH",
    token,
    body: { imageUrl, imagePublicId },
  });
}

export function deleteAvatar({ token }) {
  return request("/profile/avatar", {
    method: "DELETE",
    token,
  });
}

export function getUser({ token }) {
  return request("/profile", {
    token,
  });
}

export function setChatAvatar({ chatId, token, imageUrl, imagePublicId }) {
  return request(`/chats/${chatId}/avatar`, {
    method: "PATCH",
    token,
    body: { imageUrl, imagePublicId },
  });
}

export function removeChatAvatar({ chatId, token }) {
  return request(`/chats/${chatId}/avatar`, {
    method: "DELETE",
    token,
  });
}

export function updateChat({ chatId, token, newTitle }) {
  if (!chatId) throw new Error("chatId required");
  const body = {};
  if (typeof newTitle === "string" && newTitle.trim()) {
    body.newTitle = newTitle.trim();
  }
  return request(`/chats/${chatId}`, {
    method: "PATCH",
    token,
    body,
  });
}

export function getChat({ chatId, token }) {
  return request(`/chats/${chatId}`, {
    token,
  });
}
