const BASE_URL = "http://localhost:3000";

export async function getUserByUsername(username) {
  const res = await fetch(`${BASE_URL}/profile/username/${username}`);
  if (!res.ok) throw new Error("user not found");
  return await res.json();
}

export async function getMessagesWithUser(toId, token) {
  const res = await fetch(`${BASE_URL}/messages/${toId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("failed to fetch messages");
  return await res.json();
}

export async function getAllUsers(token) {
  const res = await fetch(`${BASE_URL}/profile/all`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("failed to fetch users");
  return await res.json();
}
