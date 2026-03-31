import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { DateTime } from "luxon";
import * as meetingsApi from "../api/meetings";
import { formatSlotLabel } from "../utils/time";

const TIMEZONE_OPTIONS = [
  { value: "UTC", label: "GMT (GMT+0)" },
  { value: "IST", label: "IST (GMT+5:30)" },
];

const CALL_TYPE_LABELS = {
  RESUME_REVAMP: "Resume Revamp",
  JOB_MARKET_GUIDANCE: "Job Market Guidance",
  MOCK_INTERVIEW: "Mock Interview",
};

const CALL_TYPE_COLORS = {
  RESUME_REVAMP: "bg-violet-500/15 text-violet-300 border-violet-500/30",
  JOB_MARKET_GUIDANCE: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  MOCK_INTERVIEW: "bg-amber-500/15 text-amber-300 border-amber-500/30",
};

export default function AdminBookings() {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [displayTimezone, setDisplayTimezone] = useState("UTC");
  const [activeMeeting, setActiveMeeting] = useState(null);
  const [meetingToDelete, setMeetingToDelete] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [copied, setCopied] = useState(false);
  const meetingsRef = useRef([]);

  const selectedTimezone = displayTimezone === "IST" ? "Asia/Kolkata" : "Europe/Dublin";

  const loadMeetings = useCallback(async () => {
    try {
      const list = await meetingsApi.listMeetings();
      setMeetings(list);
    } catch {
      setMeetings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadMeetings(); }, [loadMeetings]);

  useEffect(() => { meetingsRef.current = meetings; }, [meetings]);

  // Auto-delete past meetings
  useEffect(() => {
    const deletePast = async () => {
      const current = meetingsRef.current;
      if (!Array.isArray(current) || current.length === 0) return;
      const now = new Date();
      const past = current.filter((m) => m.endTime && new Date(m.endTime) <= now);
      if (past.length === 0) return;
      const pastIds = past.map((m) => m.id);
      for (const m of past) {
        try { await meetingsApi.deleteMeeting(m.id); } catch {}
      }
      setMeetings((prev) => prev.filter((m) => !pastIds.includes(m.id)));
    };
    deletePast();
    const id = setInterval(deletePast, 60000);
    return () => clearInterval(id);
  }, []);

  const meetingsByDate = useMemo(() => {
    if (!Array.isArray(meetings) || meetings.length === 0) return {};
    const byDate = {};
    for (const m of meetings) {
      if (!m.startTime) continue;
      const start = DateTime.fromISO(m.startTime, { zone: "utc" }).setZone(selectedTimezone);
      const end = m.endTime ? DateTime.fromISO(m.endTime, { zone: "utc" }).setZone(selectedTimezone) : null;
      const key = start.toFormat("yyyy-MM-dd");
      if (!byDate[key]) byDate[key] = [];
      byDate[key].push({
        ...m,
        localStart: start.toFormat("h:mm a"),
        localEnd: end ? end.toFormat("h:mm a") : "",
      });
    }
    Object.values(byDate).forEach((arr) =>
      arr.sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
    );
    return byDate;
  }, [meetings, selectedTimezone]);

  const upcomingDays = useMemo(() => {
    const today = DateTime.now().setZone(selectedTimezone).startOf("day");
    return Array.from({ length: 14 }, (_, i) => {
      const d = today.plus({ days: i });
      return {
        key: d.toFormat("yyyy-MM-dd"),
        dayName: d.toFormat("ccc"),
        dayDate: d.toFormat("dd LLL"),
        isToday: i === 0,
      };
    });
  }, [selectedTimezone]);

  const handleDelete = async () => {
    if (!meetingToDelete) return;
    setDeletingId(meetingToDelete);
    try {
      await meetingsApi.deleteMeeting(meetingToDelete);
      setMeetings((prev) => prev.filter((m) => m.id !== meetingToDelete));
      setMeetingToDelete(null);
      setActiveMeeting(null);
    } catch (e) {
      console.error(e);
    } finally {
      setDeletingId(null);
    }
  };

  const totalMeetings = meetings.length;
  const todayKey = DateTime.now().setZone(selectedTimezone).toFormat("yyyy-MM-dd");
  const todayMeetings = meetingsByDate[todayKey]?.length ?? 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Bookings</h1>
          <p className="text-slate-400 text-sm mt-0.5">All scheduled mentoring calls</p>
        </div>
        <div className="flex items-center gap-2">
          {TIMEZONE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setDisplayTimezone(opt.value)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition ${
                displayTimezone === opt.value
                  ? "bg-primary-600 border-primary-600 text-white"
                  : "border-navy-700 text-slate-400 hover:text-slate-200 hover:border-slate-600"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-navy-900 border border-navy-700 rounded-xl p-4">
          <p className="text-xs text-slate-500 mb-1">Total Bookings</p>
          <p className="text-2xl font-bold text-white">{totalMeetings}</p>
        </div>
        <div className="bg-navy-900 border border-navy-700 rounded-xl p-4">
          <p className="text-xs text-slate-500 mb-1">Today</p>
          <p className="text-2xl font-bold text-white">{todayMeetings}</p>
        </div>
      </div>

      {/* Calendar grid */}
      {loading ? (
        <div className="flex items-center gap-2 text-slate-500 text-sm py-8">
          <div className="w-4 h-4 border-2 border-slate-600 border-t-primary-500 rounded-full animate-spin" />
          Loading bookings…
        </div>
      ) : (
        <div className="bg-navy-900 border border-navy-700 rounded-xl p-5">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Next 14 days</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2">
            {upcomingDays.map(({ key, dayName, dayDate, isToday }) => {
              const dayMeetings = meetingsByDate[key] || [];
              const tzLabel = displayTimezone === "IST" ? "IST" : "GMT";
              return (
                <div
                  key={key}
                  className={`rounded-xl border px-3 py-2.5 flex flex-col min-h-[110px] ${
                    isToday ? "border-primary-500/40 bg-primary-600/5" : "border-navy-700 bg-navy-950/50"
                  }`}
                >
                  <div className="mb-2">
                    <p className={`text-xs font-semibold ${isToday ? "text-primary-400" : "text-slate-300"}`}>
                      {dayName}
                    </p>
                    <p className="text-[11px] text-slate-500">{dayDate}</p>
                  </div>
                  <div className="space-y-1.5 flex-1">
                    {dayMeetings.length === 0 ? (
                      <p className="text-[10px] text-slate-700">No meetings</p>
                    ) : (
                      dayMeetings.map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setActiveMeeting(m)}
                          className={`w-full text-left rounded-lg border px-2 py-1.5 hover:opacity-90 transition ${
                            CALL_TYPE_COLORS[m.callType] || "bg-slate-700/50 border-slate-600 text-slate-200"
                          }`}
                        >
                          <p className="text-[11px] font-semibold truncate">{m.title}</p>
                          <p className="text-[10px] mt-0.5 opacity-80">
                            {m.localStart} – {m.localEnd} {tzLabel}
                          </p>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* All meetings list */}
      {!loading && meetings.length > 0 && (
        <div className="bg-navy-900 border border-navy-700 rounded-xl p-5">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">All meetings</p>
          <div className="space-y-2">
            {meetings.map((m) => {
              const start = m.startTime
                ? DateTime.fromISO(m.startTime, { zone: "utc" }).setZone(selectedTimezone)
                : null;
              const end = m.endTime
                ? DateTime.fromISO(m.endTime, { zone: "utc" }).setZone(selectedTimezone)
                : null;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setActiveMeeting(m)}
                  className="w-full text-left flex items-center gap-4 rounded-xl bg-navy-950 border border-navy-700 hover:border-slate-600 px-4 py-3 transition"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-medium text-white truncate">{m.title}</p>
                      {m.callType && (
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md border shrink-0 ${CALL_TYPE_COLORS[m.callType] || ""}`}>
                          {CALL_TYPE_LABELS[m.callType] || m.callType}
                        </span>
                      )}
                    </div>
                    {start && (
                      <p className="text-xs text-slate-400">
                        {start.toFormat("ccc, dd LLL")} · {start.toFormat("h:mm a")}
                        {end ? ` – ${end.toFormat("h:mm a")}` : ""}{" "}
                        {displayTimezone === "IST" ? "IST" : "GMT"}
                      </p>
                    )}
                  </div>
                  <svg className="w-4 h-4 text-slate-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {!loading && meetings.length === 0 && (
        <div className="text-center py-16 text-slate-600">
          <svg className="w-10 h-10 mx-auto mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-sm">No bookings yet.</p>
          <p className="text-xs mt-1">Go to Schedule to book a call.</p>
        </div>
      )}

      {/* Meeting detail modal */}
      {activeMeeting && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={() => setActiveMeeting(null)}
        >
          <div
            className="rounded-2xl bg-navy-900 border border-navy-700 shadow-2xl max-w-lg w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-white">{activeMeeting.title}</h3>
                {activeMeeting.callType && (
                  <span className={`mt-1 inline-block text-[11px] font-medium px-2 py-0.5 rounded-full border ${CALL_TYPE_COLORS[activeMeeting.callType] || ""}`}>
                    {CALL_TYPE_LABELS[activeMeeting.callType] || activeMeeting.callType}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setActiveMeeting(null)}
                className="text-slate-500 hover:text-slate-300 transition"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-3 mb-5">
              {activeMeeting.startTime && (
                <div className="flex items-center gap-2 text-sm text-slate-300">
                  <svg className="w-4 h-4 text-slate-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>
                    {new Date(activeMeeting.startTime).toLocaleDateString("en-US", {
                      weekday: "long", month: "long", day: "numeric", year: "numeric",
                      timeZone: displayTimezone === "IST" ? "Asia/Kolkata" : "UTC",
                    })}
                    {" · "}
                    {formatSlotLabel(activeMeeting.startTime, activeMeeting.endTime, displayTimezone)}
                    {" "}({displayTimezone === "IST" ? "IST" : "GMT"})
                  </span>
                </div>
              )}

              <div className="flex items-start gap-2">
                <svg className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197" />
                </svg>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Attendees</p>
                  {activeMeeting.participants?.length ? (
                    <ul className="space-y-0.5">
                      {activeMeeting.participants.map((p) => (
                        <li key={p.email} className="text-sm text-slate-300">{p.email}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-slate-500">No attendees listed</p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-2">
                <svg className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.362a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <div className="flex-1">
                  <p className="text-xs text-slate-500 mb-1">Video call</p>
                  {activeMeeting.meetLink ? (
                    <div className="flex items-center gap-2">
                      <a
                        href={activeMeeting.meetLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary-400 hover:underline break-all flex-1"
                      >
                        {activeMeeting.meetLink}
                      </a>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(activeMeeting.meetLink);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 1500);
                        }}
                        className="shrink-0 text-xs text-slate-400 hover:text-white border border-navy-700 rounded-md px-2 py-1"
                      >
                        {copied ? "Copied!" : "Copy"}
                      </button>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">Link pending</p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setActiveMeeting(null)}
                className="rounded-lg border border-navy-700 bg-navy-800 text-slate-300 font-medium px-4 py-2 text-sm hover:bg-navy-700 transition"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => { setMeetingToDelete(activeMeeting.id); setActiveMeeting(null); }}
                className="rounded-lg border border-red-500/50 bg-red-600/80 text-white font-medium px-4 py-2 text-sm hover:bg-red-600 transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {meetingToDelete !== null && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          onClick={() => !deletingId && setMeetingToDelete(null)}
        >
          <div
            className="rounded-2xl bg-navy-900 border border-navy-700 shadow-xl max-w-sm w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-white mb-2">Delete meeting?</h3>
            <p className="text-slate-400 text-sm mb-5">This action cannot be undone.</p>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setMeetingToDelete(null)}
                disabled={!!deletingId}
                className="rounded-lg border border-navy-700 bg-navy-800 text-slate-300 font-medium px-4 py-2 text-sm hover:bg-navy-700 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={!!deletingId}
                className="rounded-lg border border-red-500 bg-red-600 text-white font-medium px-4 py-2 text-sm hover:bg-red-500 transition disabled:opacity-50"
              >
                {deletingId ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
