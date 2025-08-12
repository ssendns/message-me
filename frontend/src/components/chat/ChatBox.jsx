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
  const topSentinelRef = useRef(null);
  const [showScrollDown, setShowScrollDown] = useState(false);

  const nameById = useMemo(() => {
    const map = new Map();
    (participants || []).forEach((p) => map.set(String(p.id), p.username));
    return map;
  }, [participants]);

  const uniqueMessages = useMemo(() => {
    const seen = new Set();
    const out = [];
    for (const m of messages) {
      if (m && !seen.has(m.id)) {
        seen.add(m.id);
        out.push(m);
      }
    }
    return out;
  }, [messages]);

  const scrollToBottomIfNear = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (distanceFromBottom <= BOTTOM_STICKY_PX) {
      el.scrollTop = el.scrollHeight;
      setShowScrollDown(false);
    }
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
    setShowScrollDown(false);
  }, [uniqueMessages.length]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onScroll = () => {
      const distanceFromBottom =
        el.scrollHeight - el.scrollTop - el.clientHeight;
      setShowScrollDown(distanceFromBottom > BOTTOM_STICKY_PX);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!onLoadMore || !hasMore) return;
    const el = topSentinelRef.current;
    const scroller = containerRef.current;
    if (!el || !scroller) return;

    let prevHeight = 0;
    const io = new IntersectionObserver(
      async ([entry]) => {
        if (!entry?.isIntersecting || loadingMore) return;
        prevHeight = scroller.scrollHeight;
        await onLoadMore?.();
        const diff = scroller.scrollHeight - prevHeight;
        scroller.scrollTop = scroller.scrollTop + diff;
      },
      { root: scroller, rootMargin: "0px", threshold: 1 }
    );

    io.observe(el);
    return () => io.disconnect();
  }, [onLoadMore, hasMore, loadingMore]);

  useEffect(() => {
    scrollToBottomIfNear();
  }, [uniqueMessages, scrollToBottomIfNear]);

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
      <div ref={containerRef} className="flex-1 h-full overflow-y-auto px-0">
        {hasMore && (
          <div
            ref={topSentinelRef}
            className="h-6 flex items-center justify-center text-xs text-muted"
          >
            {loadingMore ? "loading..." : ""}
          </div>
        )}

        {renderMessages(uniqueMessages)}
      </div>

      {showScrollDown && (
        <button
          onClick={() => {
            const el = containerRef.current;
            if (!el) return;
            el.scrollTop = el.scrollHeight;
            setShowScrollDown(false);
          }}
          className="absolute right-4 bottom-4 rounded-full shadow p-2 bg-white border hover:bg-gray-50"
          title="scroll to latest"
          aria-label="scroll to latest"
        >
          ↓
        </button>
      )}
    </div>
  );
}
