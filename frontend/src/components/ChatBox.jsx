import { useEffect, useRef } from "react";
import Message from "./Message";
import { formatDate } from "../utils/formatDate";

export default function ChatBox({ messages, currentUserId }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages]);

  const lastDateLabelRef = useRef(null);

  return (
    <div ref={containerRef} className="flex-1 h-full overflow-y-auto">
      {messages.length === 0 ? (
        <p className="text-sm text-muted">no messages yet</p>
      ) : (
        messages.map((message) => {
          const dateLabel = message.createdAt
            ? formatDate(message.createdAt)
            : null;

          const showDate = dateLabel && dateLabel !== lastDateLabelRef.current;

          if (showDate) {
            lastDateLabelRef.current = dateLabel;
          }

          return (
            <div key={message.id}>
              {showDate && (
                <div className="text-center text-xs text-muted my-2 uppercase tracking-wide">
                  {dateLabel}
                </div>
              )}
              <Message message={message} currentUserId={currentUserId} />
            </div>
          );
        })
      )}
    </div>
  );
}
