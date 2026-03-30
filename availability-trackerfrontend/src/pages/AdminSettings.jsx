export default function AdminSettings() {
  return (
    <div className="space-y-6 max-w-xl">
      <h1 className="text-xl font-semibold text-white">Admin Settings</h1>
      <div className="bg-navy-900 border border-navy-700 rounded-xl p-6">
        <h2 className="text-lg font-medium text-white mb-2">Video calls</h2>
        <p className="text-slate-400 text-sm">
          When scheduling a meeting, paste an optional video link (Zoom, Meet, etc.) in the scheduling
          form. Calendar OAuth has been removed for this demo.
        </p>
      </div>
    </div>
  );
}
