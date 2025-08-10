import { useEffect, useRef } from "react";
import Message from "../message/Message";
import DateLabel from "./DateLabel";
import { formatDate } from "../../utils/formatDate";

export default function ChatBox({ messages, currentUserId }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages]);

  const renderMessages = (messages) => {
    if (messages.length === 0) {
      return <p className="text-sm text-muted">no messages yet</p>;
    }

    let lastDateLabel = null;

    return messages.map((message) => {
      const dateLabel = message.createdAt
        ? formatDate(message.createdAt)
        : null;

      const showDate = dateLabel && dateLabel !== lastDateLabel;

      if (showDate) {
        lastDateLabel = dateLabel;
      }

      return (
        <div key={message.id}>
          {showDate && <DateLabel date={dateLabel} />}
          <Message message={message} currentUserId={currentUserId} />
        </div>
      );
    });
  };

  return (
    <div ref={containerRef} className="flex-1 h-full overflow-y-auto">
      {renderMessages(messages)}
    </div>
  );
}
