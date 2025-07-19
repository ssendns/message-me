import Message from "./Message";

export default function ChatBox({ messages, currentUserId }) {
  return (
    <div className="flex-1 h-full p-4 overflow-y-auto mb-4">
      {messages.length === 0 ? (
        <p className="text-sm text-muted">no messages yet</p>
      ) : (
        messages.map((message, index) => (
          <Message
            key={index}
            message={message}
            currentUserId={currentUserId}
          />
        ))
      )}
    </div>
  );
}
