import { isImageUrl } from "../utils/isImageUrl";

export default function MessageContent({ content, time, edited, loading }) {
  const showImage = isImageUrl(content);
  return (
    <div className="flex break-all">
      <div className={`${edited ? "pr-14" : "pr-5"} break-words break-all`}>
        {showImage ? (
          <a href={content} target="_blank" rel="noreferrer">
            <img
              src={content}
              alt="attachment"
              className="max-w-[260px] rounded-lg block"
              loading="lazy"
            />
          </a>
        ) : (
          content || <span className="italic text-muted">[empty]</span>
        )}
      </div>
      {time && (
        <div className="absolute bottom-1 right-2 flex items-center gap-1 text-[10px] opacity-70">
          {edited && <span>edited</span>}
          <span>{time}</span>
        </div>
      )}

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-5 h-5 rounded-full border-2 border-gray-300 border-t-transparent animate-spin" />
        </div>
      )}
    </div>
  );
}
