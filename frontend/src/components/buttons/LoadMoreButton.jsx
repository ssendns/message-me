export default function LoadMoreButton({ loading, onClick }) {
  return (
    <div className="mb-3 flex justify-center">
      <button
        onClick={onClick}
        disabled={loading}
        className="text-sm px-4 py-2 rounded-full border border-gray-300 bg-white shadow-sm hover:bg-gray-100 active:scale-95 transition disabled:opacity-50 disabled:hover:bg-white"
      >
        {loading ? "loading..." : "load more"}
      </button>
    </div>
  );
}
