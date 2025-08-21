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

// auth

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

// user

export function getCurrentUser({ token }) {
  return request("/user", {
    token,
  });
}

export function getUserByUsername(username) {
  return request(`/user/username/${username}`);
}

export function getAllUsers(token) {
  return request("/user/all", { token });
}

export function editUser({
  newUsername,
  newPassword,
  avatarUrl,
  avatarPublicId,
  token,
}) {
  const payload = {};
  if (newUsername?.trim()) payload.newUsername = newUsername.trim();
  if (newPassword?.trim()) payload.newPassword = newPassword.trim();

  if (typeof avatarUrl !== "undefined") payload.avatarUrl = avatarUrl;
  if (typeof avatarPublicId !== "undefined")
    payload.avatarPublicId = avatarPublicId;

  return request("/user/edit", {
    method: "PATCH",
    token,
    body: payload,
  });
}

// chat

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

export function getChat({ chatId, token }) {
  return request(`/chats/${chatId}`, {
    token,
  });
}

// group

export function createGroup({ token, title, participantIds }) {
  return request("/chats", {
    method: "POST",
    token,
    body: {
      type: "GROUP",
      title,
      participantIds,
    },
  });
}

export function editGroup({
  chatId,
  token,
  newTitle,
  avatarUrl,
  avatarPublicId,
}) {
  const payload = {};
  if (typeof newTitle === "string" && newTitle.trim())
    payload.newTitle = newTitle.trim();

  if (typeof avatarUrl !== "undefined") payload.avatarUrl = avatarUrl;
  if (typeof avatarPublicId !== "undefined")
    payload.avatarPublicId = avatarPublicId;

  return request(`/chats/${chatId}`, { method: "PATCH", token, body: payload });
}

// file management

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
