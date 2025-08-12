import {
  useEffect,
  useRef,
  useMemo,
  useState,
  useCallback,
  useLayoutEffect,
} from "react";
import Message from "../message/Message";
import { formatDate, DateLabel, UnreadDivider } from "../../utils/chatUtils";
import { ChevronDown } from "lucide-react";

const BOTTOM_PX = 64;

export default function ChatBox({
  messages,
  currentUserId,
  participants = [],
  isGroup = false,
  hasMore = false,
  loadingMore = false,
  onLoadMore,
  firstUnreadId,
}) {
  const containerRef = useRef(null);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [pendingNew, setPendingNew] = useState(0);
  const lastSeenLastIdRef = useRef(null);
  const wasLoadingMoreRef = useRef(false);
  const prevHeightRef = useRef(0);
  const prevTopRef = useRef(0);
  const initialScrollDoneRef = useRef(false);

  const msgRefs = useRef(new Map());
  const setMsgRef = (id) => (div) => {
    if (div) msgRefs.current.set(id, div);
    else msgRefs.current.delete(id);
  };

  const nameById = useMemo(() => {
    const map = new Map();
    (participants || []).forEach((p) => map.set(String(p.id), p.username));
    return map;
  }, [participants]);

  useEffect(() => {
    const div = containerRef.current;
    if (!div) return;
    const onScroll = () => {
      const dist = div.scrollHeight - div.scrollTop - div.clientHeight;
      setIsNearBottom(dist <= BOTTOM_PX);
    };
    div.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => div.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const div = containerRef.current;
    if (!div) return;
    if (loadingMore && !wasLoadingMoreRef.current) {
      wasLoadingMoreRef.current = true;
      prevHeightRef.current = div.scrollHeight;
      prevTopRef.current = div.scrollTop;
    }
  }, [loadingMore]);

  useLayoutEffect(() => {
    const div = containerRef.current;
    if (!div) return;

    // restore position after loading older messages
    if (wasLoadingMoreRef.current) {
      const diff = div.scrollHeight - prevHeightRef.current;
      div.scrollTop = prevTopRef.current + diff;
      wasLoadingMoreRef.current = false;
      return;
    }

    // jump to first unread or bottom in the first load
    if (!initialScrollDoneRef.current) {
      initialScrollDoneRef.current = true;

      if (firstUnreadId) {
        const node = msgRefs.current.get(firstUnreadId);
        if (node) {
          const top = node.offsetTop - 12;
          div.scrollTop = top;
          lastSeenLastIdRef.current = messages.at(-1)?.id ?? null;
          return;
        }
      }
      div.scrollTop = div.scrollHeight;
      lastSeenLastIdRef.current = messages.at(-1)?.id ?? null;
      return;
    }

    // new message received
    const lastId = messages.at(-1)?.id ?? null;
    const lastSeen = lastSeenLastIdRef.current;

    if (lastId && lastId !== lastSeen) {
      if (isNearBottom) {
        div.scrollTop = div.scrollHeight;
        setPendingNew(0);
      } else {
        setPendingNew((n) => n + 1);
      }
      lastSeenLastIdRef.current = lastId;
    }
  }, [messages, firstUnreadId, isNearBottom]);

  const handleJumpToLatest = useCallback(() => {
    const div = containerRef.current;
    if (!div) return;
    div.scrollTop = div.scrollHeight;
    setPendingNew(0);
  }, []);

  const decorated = useMemo(() => {
    if (!firstUnreadId) return messages;
    const idx = messages.findIndex((message) => message.id === firstUnreadId);
    if (idx <= 0) return messages;
    const clone = messages.slice();
    clone.splice(idx, 0, { __divider: true, id: `divider-${firstUnreadId}` });
    return clone;
  }, [messages, firstUnreadId]);

  const renderItem = useCallback(
    (item, idx, list) => {
      if (item.__divider) {
        return <UnreadDivider key={item.id} />;
      }

      const prev = list[idx - 1];
      const dateLabel = item.createdAt ? formatDate(item.createdAt) : null;
      let showDate = false;
      if (!item.__divider) {
        if (!prev?.__divider) {
          const prevDateLabel = prev?.createdAt
            ? formatDate(prev.createdAt)
            : null;
          showDate = dateLabel && dateLabel !== prevDateLabel;
        }
      }

      const isOwn = item.fromId === currentUserId;
      const showAuthorHeader =
        isGroup && !isOwn && (!prev || prev.fromId !== item.fromId);

      const authorName = showAuthorHeader
        ? nameById.get(String(item.fromId)) || "user"
        : null;

      const key = `${item.id}-${item.updatedAt ?? item.createdAt ?? ""}`;

      return (
        <div key={key} ref={setMsgRef(item.id)}>
          {showDate && <DateLabel date={dateLabel} />}
          <Message
            message={item}
            currentUserId={currentUserId}
            authorName={authorName}
          />
        </div>
      );
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
          <div className="mb-3 flex justify-center">
            <button
              onClick={onLoadMore}
              disabled={loadingMore}
              className="text-sm px-4 py-2 rounded-full border border-gray-300 bg-white shadow-sm hover:bg-gray-100 active:scale-95 transition disabled:opacity-50 disabled:hover:bg-white"
            >
              {loadingMore ? "loading..." : "load more"}
            </button>
          </div>
        )}

        {decorated.length === 0 ? (
          <p className="text-sm text-muted">no messages yet</p>
        ) : (
          decorated.map((it, i) => renderItem(it, i, decorated))
        )}
      </div>

      {pendingNew > 0 && !isNearBottom && (
        <button
          onClick={handleJumpToLatest}
          className="absolute left-1/2 -translate-x-1/2 bottom-4 flex items-center gap-2 rounded-full shadow-lg px-4 py-2 bg-indigo-500 text-white text-sm font-medium hover:bg-indigo-600 active:scale-95 transition"
        >
          <ChevronDown size={18} />
          <span>
            {pendingNew} new message{pendingNew > 1 ? "s" : ""}
          </span>
        </button>
      )}
    </div>
  );
}
