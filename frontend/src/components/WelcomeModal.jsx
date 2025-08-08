export default function WelcomeModal({ username = "user", onContinue }) {
  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-xl p-6 shadow-xl max-w-sm text-center space-y-4">
        <h2 className="text-xl font-semibold text-primary">welcome!</h2>
        <p className="text-sm text-muted">hi, {username}! glad to see you</p>
        <button
          onClick={onContinue}
          className="px-4 py-2 bg-primary text-white rounded hover:bg-opacity-90 transition"
        >
          continue
        </button>
      </div>
    </div>
  );
}
