export default function MessageContent({ content, imageUrl, time, edited }) {
  return (
    <div className="flex break-all">
      <div className={`${edited ? "pr-14" : "pr-5"} break-words break-all`}>
        {imageUrl && (
          <a href={imageUrl} target="_blank" rel="noreferrer">
            <img
              src={imageUrl}
              alt="attachment"
              className="max-w-[260px] rounded-lg block"
            />
          </a>
        )}
        {content && <div className="pr-14">{content}</div>}
      </div>
      {time && (
        <div className="absolute bottom-1 right-2 flex items-center gap-1 text-[10px] opacity-70">
          {edited && <span>edited</span>}
          <span>{time}</span>
        </div>
      )}
    </div>
  );
}
