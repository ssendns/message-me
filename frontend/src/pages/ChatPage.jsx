import { useEffect, useState } from "react";
import socket from "../socket";
import ChatBox from "../components/ChatBox";
import Sidebar from "../components/Sidebar";
import { getUserByUsername, getMessagesWithUser } from "../services/api";
import { Navigate, useNavigate } from "react-router-dom";

export default function ChatPage() {
  const [toUsername, setToUsername] = useState("");
  const [toId, setToId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const username = localStorage.getItem("username");
  const userId = Number(localStorage.getItem("id"));

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

  const fetchMessagesByUsername = async (username) => {
    try {
      const user = await getUserByUsername(username);
      setToId(user.id);
      setToUsername(user.username);

      const message = await getMessagesWithUser(user.id, token);
      setMessages(message.messages || []);
    } catch (err) {
      console.error("failed to load messages:", err);
      alert("user not found");
    }
  };

  const send = () => {
    if (!text.trim() || !toId) return;

    socket.emit("send_message", {
      from: userId,
      to: toId,
      text,
    });

    setMessages((prev) => [...prev, { fromId: userId, content: text }]);
    setText("");
  };

  useEffect(() => {
    socket.connect();
    socket.emit("join", userId);

    socket.on("receive_message", (msg) => {
      console.log("new message from socket:", msg);
      setMessages((prev) => [...prev, { fromId: msg.from, content: msg.text }]);
    });

    return () => {
      socket.off("receive_message");
      socket.disconnect();
    };
  }, [userId]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/log-in");
  };

  const handleEdit = () => {
    navigate("/edit");
  };

  return (
    <div className="flex">
      <Sidebar
        token={token}
        currentUserId={userId}
        activeUsername={toUsername}
        onSelect={fetchMessagesByUsername}
        onLogout={handleLogout}
        onEdit={handleEdit}
        isOpen={sidebarOpen}
        toggleSidebar={toggleSidebar}
      />
      <main className="min-h-screen w-full bg-background text-foreground font-poppins p-layout mx-auto">
        <button
          onClick={toggleSidebar}
          className="mb-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-opacity-90"
        >
          ☰
        </button>
        <div className="max-w-xl mx-auto">
          <h1 className="text-2xl font-semibold mb-4 text-primary">
            chat with {toUsername || "..."}
          </h1>

          <ChatBox messages={messages} currentUserId={userId} />

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="type your message..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="flex-1 border border-muted rounded-lg px-4 py-2 focus:outline-none"
            />
            <button
              onClick={send}
              className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-opacity-90"
            >
              send
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
