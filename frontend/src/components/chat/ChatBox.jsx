import {
  useEffect,
  useRef,
  useMemo,
  useState,
  useCallback,
  useLayoutEffect,
} from "react";
import { UnreadDivider } from "../../utils/chatUtils";
import ChatMessageRow from "./ChatMessageRow";
import LoadMoreButton from "../buttons/LoadMoreButton";
import NewMessagesButton from "../buttons/NewMessagesButton";

const BOTTOM_PX = 64;

export default function ChatBox({
  messages,
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

    if (wasLoadingMoreRef.current) {
      const diff = div.scrollHeight - prevHeightRef.current;
      div.scrollTop = prevTopRef.current + diff;
      wasLoadingMoreRef.current = false;
      return;
    }

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
    const idx = messages.findIndex((m) => m.id === firstUnreadId);
    if (idx <= 0) return messages;
    const clone = messages.slice();
    clone.splice(idx, 0, { __divider: true, id: `divider-${firstUnreadId}` });
    return clone;
  }, [messages, firstUnreadId]);

  return (
    <div className="relative h-full">
      <div
        ref={containerRef}
        className="flex-1 h-full overflow-y-auto px-6 py-3"
      >
        {hasMore && (
          <LoadMoreButton loading={loadingMore} onClick={onLoadMore} />
        )}

        {decorated.length === 0 ? (
          <p className="text-sm text-muted">no messages yet</p>
        ) : (
          decorated.map((it, idx, list) =>
            it.__divider ? (
              <UnreadDivider key={it.id} />
            ) : (
              <ChatMessageRow
                key={`${it.id}-${it.updatedAt ?? it.createdAt ?? ""}`}
                item={it}
                prev={list[idx - 1]}
                isGroup={isGroup}
                nameById={nameById}
                setMsgRef={setMsgRef}
              />
            )
          )
        )}
      </div>

      {!isNearBottom && pendingNew > 0 && (
        <NewMessagesButton count={pendingNew} onClick={handleJumpToLatest} />
      )}
    </div>
  );
}
