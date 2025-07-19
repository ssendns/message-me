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

export async function updateUser({ newUsername, newPassword, token }) {
  const res = await fetch("http://localhost:3000/profile/edit", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ newUsername, newPassword }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "failed to update user");
  }

  return res.json();
}
