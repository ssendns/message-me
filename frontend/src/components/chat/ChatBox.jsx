import { useEffect, useRef, useMemo } from "react";
import Message from "../message/Message";
import DateLabel from "./DateLabel";
import { formatDate } from "../../utils/formatDate";

export default function ChatBox({
  messages,
  currentUserId,
  participants = [],
  isGroup = false,
}) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages]);

  const nameById = useMemo(() => {
    const map = new Map();
    (participants || []).forEach((p) => map.set(String(p.id), p.username));
    return map;
  }, [participants]);

  const renderMessages = (messages) => {
    if (messages.length === 0) {
      return <p className="text-sm text-muted">no messages yet</p>;
    }

    let lastDateLabel = null;

    return messages.map((message, idx) => {
      const dateLabel = message.createdAt
        ? formatDate(message.createdAt)
        : null;
      const showDate = dateLabel && dateLabel !== lastDateLabel;
      if (showDate) lastDateLabel = dateLabel;

      const prev = messages[idx - 1];
      const isOwn = message.fromId === currentUserId;
      const showAuthorHeader =
        isGroup && !isOwn && (!prev || prev.fromId !== message.fromId);

      const authorName = showAuthorHeader
        ? nameById.get(String(message.fromId)) || "user"
        : null;

      return (
        <div key={message.id}>
          {showDate && <DateLabel date={dateLabel} />}
          <Message
            message={message}
            currentUserId={currentUserId}
            authorName={authorName}
          />
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
