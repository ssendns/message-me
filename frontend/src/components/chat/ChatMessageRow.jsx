import Message from "../message/Message";
import { DateLabel, formatDate } from "../../utils/chatUtils";
import SystemMessage from "./SystemMessage";
import { systemText } from "../../utils/systemMessageClient";

function participantsFromMap(nameById) {
  const arr = [];
  nameById.forEach((username, idStr) => {
    arr.push({ id: Number(idStr), username });
  });
  return arr;
}

export default function ChatMessageRow({
  item,
  prev,
  currentUserId,
  isGroup,
  nameById,
  setMsgRef,
}) {
  const dateLabel = item.createdAt ? formatDate(item.createdAt) : null;

  let showDate = false;
  if (!prev?.__divider) {
    const prevDate = prev?.createdAt ? formatDate(prev.createdAt) : null;
    showDate = !!dateLabel && dateLabel !== prevDate;
  }

  if (item.type === "SYSTEM") {
    const key = `${item.id}-${item.updatedAt ?? item.createdAt ?? ""}`;
    const text = systemText(item, participantsFromMap(nameById), currentUserId);

    return (
      <div key={key} ref={setMsgRef(item.id)}>
        {showDate && <DateLabel date={dateLabel} />}
        <SystemMessage text={text} />
      </div>
    );
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
}
