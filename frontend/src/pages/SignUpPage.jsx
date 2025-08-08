import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function SignUpPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      const res = await fetch("http://localhost:3000/sign-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "failed to sign up");
      }

      const data = await res.json();
      localStorage.setItem("token", data.user.token);
      localStorage.setItem("username", data.user.username);
      localStorage.setItem("id", data.user.id);
      navigate("/");
    } catch (err) {
      console.error("signup failed:", err);
      setError(err.message);
    }
  };

  return (
    <main className="min-h-screen bg-background text-foreground font-poppins flex justify-center items-center">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-card shadow-card w-full max-w-sm space-y-4"
      >
        <h2 className="text-2xl font-semibold text-center text-primary">
          sign up
        </h2>

        {error && <p className="text-sm text-red-500 text-center">{error}</p>}

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
          sign up
        </button>

        <p className="text-center text-sm">
          already have an account?{" "}
          <Link to="/log-in" className="text-primary hover:underline">
            log in
          </Link>
        </p>
      </form>
    </main>
  );
}
