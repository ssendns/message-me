import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function LogInPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch("http://localhost:3000/log-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) throw new Error("failed to log in");

      const data = await res.json();
      localStorage.setItem("token", data.user.token);
      localStorage.setItem("username", data.user.username);
      navigate("/");
    } catch (err) {
      console.error("login failed:", err);
    }
  };

  return (
    <main className="min-h-screen bg-background text-foreground font-poppins flex justify-center items-center">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-card shadow-card w-full max-w-sm space-y-4"
      >
        <h2 className="text-2xl font-semibold text-center text-primary">
          log in
        </h2>

        <input
          type="text"
          placeholder="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          className="w-full px-4 py-2 border border-muted rounded focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <input
          type="password"
          placeholder="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full px-4 py-2 border border-muted rounded focus:outline-none focus:ring-2 focus:ring-primary"
        />

        <button
          type="submit"
          className="w-full py-2 bg-primary text-white rounded hover:bg-opacity-90 transition"
        >
          log in
        </button>

        <p className="text-center text-sm">
          do not have an account?{" "}
          <Link to="/sign-up" className="text-primary hover:underline">
            sign up
          </Link>
        </p>
      </form>
    </main>
  );
}
