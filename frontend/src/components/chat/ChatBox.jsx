import { useEffect, useRef, useMemo, useState, useCallback } from "react";
import Message from "../message/Message";
import DateLabel from "./DateLabel";
import { formatDate } from "../../utils/formatDate";

const BOTTOM_STICKY_PX = 64;

export default function ChatBox({
  messages,
  currentUserId,
  participants = [],
  isGroup = false,
  hasMore = false,
  loadingMore = false,
  onLoadMore,
}) {
  const containerRef = useRef(null);
  const wasLoadingMoreRef = useRef(false);
  const prevHeightRef = useRef(0);
  const prevTopRef = useRef(0);
  const [isNearBottom, setIsNearBottom] = useState(true);

  const nameById = useMemo(() => {
    const map = new Map();
    (participants || []).forEach((p) => map.set(String(p.id), p.username));
    return map;
  }, [participants]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    if (loadingMore && !wasLoadingMoreRef.current) {
      wasLoadingMoreRef.current = true;
      prevHeightRef.current = el.scrollHeight;
      prevTopRef.current = el.scrollTop;
    }
  }, [loadingMore]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    if (wasLoadingMoreRef.current) {
      const diff = el.scrollHeight - prevHeightRef.current;
      el.scrollTop = prevTopRef.current + diff;
      wasLoadingMoreRef.current = false;
      return;
    }

    if (isNearBottom) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages, isNearBottom]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onScroll = () => {
      const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
      setIsNearBottom(distance <= BOTTOM_STICKY_PX);
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  const renderMessages = useCallback(
    (list) => {
      if (!list || list.length === 0) {
        return <p className="text-sm text-muted">no messages yet</p>;
      }

      let lastDateLabel = null;

      return list.map((message, idx) => {
        const dateLabel = message.createdAt
          ? formatDate(message.createdAt)
          : null;
        const showDate = dateLabel && dateLabel !== lastDateLabel;
        if (showDate) lastDateLabel = dateLabel;

        const prev = list[idx - 1];
        const isOwn = message.fromId === currentUserId;
        const showAuthorHeader =
          isGroup && !isOwn && (!prev || prev.fromId !== message.fromId);

        const authorName = showAuthorHeader
          ? nameById.get(String(message.fromId)) || "user"
          : null;

        const key = `${message.id}-${
          message.updatedAt ?? message.createdAt ?? ""
        }`;

        return (
          <div key={key}>
            {showDate && <DateLabel date={dateLabel} />}
            <Message
              message={message}
              currentUserId={currentUserId}
              authorName={authorName}
            />
          </div>
        );
      });
    },
    [currentUserId, isGroup, nameById]
  );

  return (
    <div className="relative h-full">
      <div
        ref={containerRef}
        className="flex-1 h-full overflow-y-auto px-6 py-3"
      >
        {hasMore && (
          <div className="mb-3">
            <button
              onClick={onLoadMore}
              disabled={loadingMore}
              className="text-sm px-3 py-1 rounded border hover:bg-gray-50 disabled:opacity-50"
            >
              {loadingMore ? "loading..." : "load more"}
            </button>
          </div>
        )}

        {renderMessages(messages)}
      </div>
    </div>
  );
}
