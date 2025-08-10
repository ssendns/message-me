import { Check, CheckCheck } from "lucide-react";

export default function MessageContent({
  text,
  imageUrl,
  time,
  edited,
  read,
  isOwn,
}) {
  return (
    <div className="break-all max-w-[300px]">
      <div
        className={`${edited ? "pr-10 pb-1" : "pr-10"} break-words break-all`}
      >
        {imageUrl && (
          <a href={imageUrl} target="_blank" rel="noreferrer">
            <img
              src={imageUrl}
              alt="attachment"
              className="max-w-[260px] rounded-lg block"
            />
          </a>
        )}
        {text && (
          <p className="whitespace-pre-wrap break-words leading-relaxed">
            {text}
          </p>
        )}
      </div>
      {time && (
        <div className="absolute bottom-1 right-2 flex items-center gap-1 text-[10px] opacity-70">
          {edited && <span>edited</span>}
          <span>{time}</span>
          {isOwn && (read ? <CheckCheck size={14} /> : <Check size={14} />)}
        </div>
      )}
    </div>
  );
}
