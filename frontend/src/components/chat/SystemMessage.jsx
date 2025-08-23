export default function SystemMessage({ text }) {
  return (
    <div className="my-2 flex items-center justify-center">
      <span className="text-[12px] px-3 py-1 rounded-full bg-gray-100 text-gray-600">
        {text}
      </span>
    </div>
  );
}
