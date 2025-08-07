export default function MessageContent({ content, time, edited }) {
  return (
    <div className="flex break-all">
      <div className={`${edited ? "pr-14" : "pr-5"}`}>
        {content || <span className="italic text-muted">[empty]</span>}
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
