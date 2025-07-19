import ChatList from "../components/ChatList";
import ChatArea from "../components/ChatArea";
import Sidebar from "../components/Sidebar";
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function MainPage() {
  const [selectedChat, setSelectedChat] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const token = localStorage.getItem("token");
  const username = localStorage.getItem("username");
  const userId = Number(localStorage.getItem("id"));

  const navigate = useNavigate();
  const sidebarRef = useRef();

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);
  const closeSidebar = () => setSidebarOpen(false);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/log-in");
  };

  const handleEdit = () => {
    navigate("/edit");
  };

  const handleChatSelect = (chat) => {
    setSelectedChat(chat);
  };

  const handleBack = () => {
    setSelectedChat(null);
  };

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target)) {
        closeSidebar();
      }
    };

    if (sidebarOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [sidebarOpen]);

  return (
    <main className="flex h-screen font-poppins bg-background text-foreground overflow-hidden">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-20" />
      )}

      <div ref={sidebarRef}>
        <Sidebar
          onLogout={handleLogout}
          onEdit={handleEdit}
          isOpen={sidebarOpen}
        />
      </div>

      <div className="flex flex-1">
        <div
          className={`w-full sm:w-[500px] border-r border-muted bg-white relative ${
            selectedChat && isMobile ? "hidden" : "block"
          }`}
        >
          <div className="flex items-center justify-between px-6 py-6 border-b bg-white">
            <h1 className="text-lg font-semibold text-primary">chats</h1>
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
              currentChat={selectedChat?.username}
              onSelect={handleChatSelect}
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
              toUsername={selectedChat.username}
              toId={selectedChat.id}
              currentUserId={userId}
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
  );
}
