import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import ChatList from "../components/chatList/ChatList";
import ChatArea from "../components/chat/ChatArea";
import Sidebar from "../components/Sidebar";
import SOCKET_EVENTS from "../services/socketEvents";
import { useAuth } from "../context/AuthContext";

export default function MainPage() {
  const navigate = useNavigate();

  const { token, user, hydrated, socket, logout } = useAuth();
  const currentUserId = user?.id;
  const username = user?.username;

  const [selectedChat, setSelectedChat] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  const [searchTerm, setSearchTerm] = useState("");
  const sidebarRef = useRef(null);

  const toggleSidebar = useCallback(() => setSidebarOpen((s) => !s), []);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);
  const handleChatSelect = useCallback((chat) => setSelectedChat(chat), []);
  const handleBack = useCallback(() => setSelectedChat(null), []);
  const handleEdit = () => navigate("/edit");
  const handleCreate = () => navigate("/create");

  useEffect(() => {
    if (hydrated && !token) navigate("/log-in");
  }, [navigate, hydrated, token]);

  const handleLogout = useCallback(() => {
    logout();
    navigate("/log-in");
  }, [logout, navigate]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!sidebarOpen) return;
    const handleClickOutside = (e) => {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target)) {
        closeSidebar();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [sidebarOpen, closeSidebar]);

  useEffect(() => {
    if (!socket || !currentUserId) return;

    const join = () =>
      socket.emit(SOCKET_EVENTS.JOIN, { userId: Number(currentUserId) });

    if (socket.connected) join();

    socket.on("connect", join);
    return () => socket.off("connect", join);
  }, [socket, currentUserId]);

  if (!hydrated) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-muted text-lg animate-pulse">loading…</p>
      </div>
    );
  }

  return (
    <>
      <main className="flex h-screen font-poppins bg-background text-foreground overflow-hidden">
        {sidebarOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-40 z-20" />
        )}

        <div ref={sidebarRef}>
          <Sidebar
            username={username}
            onLogout={handleLogout}
            onEdit={handleEdit}
            onCreate={handleCreate}
            isOpen={sidebarOpen}
          />
        </div>

        <div className="flex flex-1">
          <div
            className={`w-full sm:w-[500px] border-r border-muted bg-white relative ${
              selectedChat && isMobile ? "hidden" : "block"
            }`}
          >
            <div className="flex items-center justify-between px-6 py-5 border-b bg-white">
              <input
                type="text"
                placeholder="search..."
                className="w-full mr-5 px-3 py-2 rounded-lg border text-sm outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button
                onClick={toggleSidebar}
                className="text-xl text-muted hover:text-primary"
              >
                ☰
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-2 py-2">
              <ChatList
                token={token}
                currentChat={selectedChat}
                onSelect={handleChatSelect}
                searchTerm={searchTerm}
              />
            </div>
          </div>

          <section
            className={`flex-1 flex flex-col bg-gray-50 ${
              !selectedChat && isMobile ? "hidden" : "flex"
            }`}
          >
            {selectedChat ? (
              <ChatArea
                chatId={selectedChat.id}
                displayName={selectedChat.displayName}
                currentUserRole={selectedChat.currentUserRole}
                participants={selectedChat.participants}
                type={selectedChat.type}
                onBack={handleBack}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted">
                <p className="text-lg font-medium">
                  select a chat to start messaging
                </p>
              </div>
            )}
          </section>
        </div>
      </main>
    </>
  );
}
