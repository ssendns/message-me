import { useEffect, useRef } from "react";
import Message from "./Message";

export default function ChatBox({ messages, currentUserId }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages]);
  return (
    <div ref={containerRef} className="flex-1 h-full overflow-y-auto">
      {messages.length === 0 ? (
        <p className="text-sm text-muted">no messages yet</p>
      ) : (
        messages.map((message, index) => (
          <Message
            key={index}
            message={message}
            currentUserId={currentUserId}
          />
        ))
      )}
    </div>
  );
}
