import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { updateUser } from "../services/api";

export default function EditAccountPage() {
  const [username, setUsername] = useState(
    localStorage.getItem("username") || ""
  );
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const token = localStorage.getItem("token");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateUser({ newUsername: username, newPassword: password, token });
      localStorage.setItem("username", username);
      alert("account updated successfully");
      navigate("/");
    } catch (err) {
      alert(err.message || "error updating account");
    }
  };

  return (
    <main className="min-h-screen bg-background text-foreground font-poppins p-layout max-w-screen mx-auto">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-semibold mb-4 text-primary">
          edit account
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1">username</label>
            <input
              type="text"
              className="w-full border border-muted rounded px-4 py-2"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block mb-1">new password</label>
            <input
              type="password"
              className="w-full border border-muted rounded px-4 py-2"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="bg-primary text-white px-4 py-2 rounded hover:bg-opacity-90"
          >
            save changes
          </button>
        </form>
      </div>
    </main>
  );
}
