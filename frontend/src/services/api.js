const BASE_URL = "http://localhost:3000";

async function request(endpoint, { method = "GET", token, body } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || "request failed");
  }

  return await res.json().catch(() => ({}));
}

export function getUserByUsername(username) {
  return request(`/profile/username/${username}`);
}

export function getAllUsers(token) {
  return request("/profile/all", { token });
}

export function updateUser({ newUsername, newPassword, token }) {
  return request("/profile/edit", {
    method: "PATCH",
    token,
    body: { newUsername, newPassword },
  });
}

export async function uploadImage(file) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${BASE_URL}/upload`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) throw new Error("upload failed");

  return await res.json();
}

export async function getChatMessages({ chatId, token }) {
  return request(`/chats/${chatId}`, {
    token,
  });
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
