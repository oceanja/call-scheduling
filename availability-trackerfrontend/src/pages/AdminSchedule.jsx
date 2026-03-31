import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { DateTime } from "luxon";
import * as adminApi from "../api/admin";
import * as availabilityApi from "../api/availability";
import { useAuth } from "../context/AuthContext";
import { formatTimeRange, isPastDateTime } from "../utils/time";

const TIMEZONE_OPTIONS = [
  { value: "UTC", label: "GMT (GMT+0)" },
  { value: "IST", label: "IST (GMT+5:30)" },
];

const CALL_TYPE_OPTIONS = [
  { value: "RESUME_REVAMP", label: "Resume Revamp" },
  { value: "JOB_MARKET_GUIDANCE", label: "Job Market Guidance" },
  { value: "MOCK_INTERVIEW", label: "Mock Interview" },
];

const CALL_TYPE_COLORS = {
  RESUME_REVAMP: "bg-violet-500/15 text-violet-300 border-violet-500/30",
  JOB_MARKET_GUIDANCE: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  MOCK_INTERVIEW: "bg-amber-500/15 text-amber-300 border-amber-500/30",
};

const HOUR_OPTIONS = Array.from({ length: 12 }, (_, i) => String(i + 1));
const MINUTE_OPTIONS = ["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"];
const AMPM_OPTIONS = ["AM", "PM"];

const selectClass =
  "min-w-0 flex-1 box-border rounded-lg bg-navy-950 border border-navy-700 text-white px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 appearance-none";

export default function AdminSchedule() {
  const { user: authUser } = useAuth();

  // Data
  const [users, setUsers] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [callType, setCallType] = useState("JOB_MARKET_GUIDANCE");
  const [recommendations, setRecommendations] = useState([]);
  const [loadingRec, setLoadingRec] = useState(false);

  // Availability
  const [displayTimezone, setDisplayTimezone] = useState("UTC");
  const [userAvailability, setUserAvailability] = useState({ dates: [], availability: {} });
  const [mentorAvailability, setMentorAvailability] = useState({ dates: [], availability: {} });
  const [loadingUserAvail, setLoadingUserAvail] = useState(false);
  const [loadingMentorAvail, setLoadingMentorAvail] = useState(false);

  // Schedule form
  const [scheduleTitle, setScheduleTitle] = useState("");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleStartHour, setScheduleStartHour] = useState("");
  const [scheduleStartMinute, setScheduleStartMinute] = useState("");
  const [scheduleStartAmPm, setScheduleStartAmPm] = useState("");
  const [scheduleEndHour, setScheduleEndHour] = useState("");
  const [scheduleEndMinute, setScheduleEndMinute] = useState("");
  const [scheduleEndAmPm, setScheduleEndAmPm] = useState("");
  const [scheduleMeetLink, setScheduleMeetLink] = useState("");
  const [additionalEmails, setAdditionalEmails] = useState([]);
  const [userEmail, setUserEmail] = useState("");
  const [mentorEmail, setMentorEmail] = useState("");
  const [selectedCommonSlot, setSelectedCommonSlot] = useState(null);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [inlineError, setInlineError] = useState("");

  const prevTzRef = useRef(displayTimezone);

  // ── Helpers ──────────────────────────────────────────────────────────────────

  const selectedTimezone = displayTimezone === "IST" ? "Asia/Kolkata" : "Europe/Dublin";

  const to24From12 = useCallback((h, m, ap) => {
    if (!h || !m || !ap) return null;
    let hr = parseInt(h, 10);
    if (isNaN(hr)) return null;
    if (ap === "AM") { if (hr === 12) hr = 0; }
    else if (ap === "PM") { if (hr !== 12) hr += 12; }
    else return null;
    return `${String(hr).padStart(2, "0")}:${m}`;
  }, []);

  const hm24To12Parts = useCallback((hm) => {
    if (!hm || !/^\d{1,2}:\d{2}$/.test(hm)) return { hour: "", minute: "", amPm: "" };
    const [hs, ms] = hm.split(":");
    let h = parseInt(hs, 10);
    const minute = ms.padStart(2, "0");
    if (isNaN(h)) return { hour: "", minute: "", amPm: "" };
    let amPm = "AM";
    if (h === 0) { h = 12; }
    else if (h === 12) { amPm = "PM"; }
    else if (h > 12) { h -= 12; amPm = "PM"; }
    return { hour: String(h), minute, amPm };
  }, []);

  const meetingZone = selectedTimezone;

  const scheduleStartDt = useMemo(() => {
    const hm = to24From12(scheduleStartHour, scheduleStartMinute, scheduleStartAmPm);
    if (!scheduleDate || !hm) return null;
    const dt = DateTime.fromFormat(`${scheduleDate} ${hm}`, "yyyy-MM-dd HH:mm", { zone: meetingZone });
    return dt.isValid ? dt : null;
  }, [scheduleDate, scheduleStartHour, scheduleStartMinute, scheduleStartAmPm, meetingZone, to24From12]);

  const scheduleEndDt = useMemo(() => {
    const hm = to24From12(scheduleEndHour, scheduleEndMinute, scheduleEndAmPm);
    if (!scheduleDate || !hm) return null;
    const dt = DateTime.fromFormat(`${scheduleDate} ${hm}`, "yyyy-MM-dd HH:mm", { zone: meetingZone });
    return dt.isValid ? dt : null;
  }, [scheduleDate, scheduleEndHour, scheduleEndMinute, scheduleEndAmPm, meetingZone, to24From12]);

  // ── Data loading ──────────────────────────────────────────────────────────────

  useEffect(() => {
    adminApi.listUsers().then(setUsers).catch(() => {});
    adminApi.listMentors().then(setMentors).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedUser) { setUserAvailability({ dates: [], availability: {} }); return; }
    setLoadingUserAvail(true);
    const today = new Date();
    const weekStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()))
      .toISOString().slice(0, 10);
    availabilityApi.getWeekly({ userId: selectedUser.id, weekStart })
      .then(setUserAvailability)
      .catch(() => setUserAvailability({ dates: [], availability: {} }))
      .finally(() => setLoadingUserAvail(false));
  }, [selectedUser?.id]);

  useEffect(() => {
    if (!selectedMentor) { setMentorAvailability({ dates: [], availability: {} }); return; }
    setLoadingMentorAvail(true);
    const today = new Date();
    const weekStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()))
      .toISOString().slice(0, 10);
    availabilityApi.getWeekly({ mentorId: selectedMentor.id, weekStart })
      .then(setMentorAvailability)
      .catch(() => setMentorAvailability({ dates: [], availability: {} }))
      .finally(() => setLoadingMentorAvail(false));
  }, [selectedMentor?.id]);

  const loadRecommendations = useCallback(async () => {
    if (!selectedUser) { setRecommendations([]); return; }
    setLoadingRec(true);
    try {
      const data = await adminApi.getRecommendations(selectedUser.id, callType);
      setRecommendations(data.recommendations || []);
    } catch {
      setRecommendations([]);
    } finally {
      setLoadingRec(false);
    }
  }, [selectedUser?.id, callType]);

  useEffect(() => { loadRecommendations(); }, [loadRecommendations]);

  useEffect(() => {
    if (selectedUser) setUserEmail(selectedUser.email);
  }, [selectedUser]);
  useEffect(() => {
    if (selectedMentor) setMentorEmail(selectedMentor.email);
  }, [selectedMentor]);

  // ── Timezone conversion for schedule form ─────────────────────────────────────

  useEffect(() => {
    const prevTz = prevTzRef.current;
    if (prevTz === displayTimezone) return;
    const prevZone = prevTz === "IST" ? "Asia/Kolkata" : "Europe/Dublin";
    const newZone = displayTimezone === "IST" ? "Asia/Kolkata" : "Europe/Dublin";

    const convertParts = (h, m, ap) => {
      const hm = to24From12(h, m, ap);
      if (!scheduleDate || !hm) return null;
      const dt = DateTime.fromFormat(`${scheduleDate} ${hm}`, "yyyy-MM-dd HH:mm", { zone: prevZone });
      if (!dt.isValid) return null;
      const dtNew = dt.setZone(newZone);
      return { date: dtNew.toFormat("yyyy-MM-dd"), hm: dtNew.toFormat("HH:mm") };
    };

    const sConv = convertParts(scheduleStartHour, scheduleStartMinute, scheduleStartAmPm);
    const eConv = convertParts(scheduleEndHour, scheduleEndMinute, scheduleEndAmPm);
    if (sConv) {
      setScheduleDate(sConv.date);
      const p = hm24To12Parts(sConv.hm);
      setScheduleStartHour(p.hour); setScheduleStartMinute(p.minute); setScheduleStartAmPm(p.amPm);
    }
    if (eConv) {
      const p = hm24To12Parts(eConv.hm);
      setScheduleEndHour(p.hour); setScheduleEndMinute(p.minute); setScheduleEndAmPm(p.amPm);
    }
    prevTzRef.current = displayTimezone;
  }, [displayTimezone, scheduleDate, scheduleStartHour, scheduleStartMinute, scheduleStartAmPm,
      scheduleEndHour, scheduleEndMinute, scheduleEndAmPm, to24From12, hm24To12Parts]);

  // ── Availability overlap computation ─────────────────────────────────────────

  const flattenSlots = (data) =>
    Object.entries(data.availability || {}).flatMap(([, slots]) => slots || []);

  const groupFlatSlotsByLocalDate = useCallback((slots, tz) => {
    if (!Array.isArray(slots) || slots.length === 0) return { dates: [], byDate: {} };
    const byDate = {};
    for (const slot of slots) {
      const localStart = DateTime.fromISO(slot.startTime, { zone: "utc" }).setZone(tz);
      const localEnd = DateTime.fromISO(slot.endTime, { zone: "utc" }).setZone(tz);
      const dateKey = localStart.toFormat("yyyy-MM-dd");
      const dayLabel = localStart.toFormat("ccc, dd LLL");
      if (!byDate[dateKey]) byDate[dateKey] = { dayLabel, slots: [] };
      byDate[dateKey].slots.push({
        ...slot,
        convertedStart: localStart.toFormat("HH:mm"),
        convertedEnd: localEnd.toFormat("HH:mm"),
      });
    }
    return { dates: Object.keys(byDate).sort(), byDate };
  }, []);

  const parseHmToMin = (hm) => {
    if (!hm) return null;
    const [h, m] = hm.split(":").map(Number);
    return isNaN(h) || isNaN(m) ? null : h * 60 + m;
  };

  const computeCommonSlots = useCallback((userSlots = [], mentorSlots = []) => {
    const results = [];
    for (const u of userSlots) {
      const uStart = parseHmToMin(u.convertedStart);
      let uEnd = parseHmToMin(u.convertedEnd);
      if (uStart == null || uEnd == null) continue;
      if (uEnd <= uStart) uEnd += 1440;
      for (const m of mentorSlots) {
        const mStart = parseHmToMin(m.convertedStart);
        let mEnd = parseHmToMin(m.convertedEnd);
        if (mStart == null || mEnd == null) continue;
        if (mEnd <= mStart) mEnd += 1440;
        const start = Math.max(uStart, mStart);
        const end = Math.min(uEnd, mEnd);
        if (end <= start) continue;
        const toHm = (mins) => {
          const total = Math.min(mins, 1440) % 1440;
          return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
        };
        results.push({ startHm: toHm(start), endHm: toHm(end) });
      }
    }
    return results;
  }, []);

  const userSlotsFlat = flattenSlots(userAvailability);
  const mentorSlotsFlat = flattenSlots(mentorAvailability);

  const userByDate = useMemo(
    () => groupFlatSlotsByLocalDate(userSlotsFlat, selectedTimezone),
    [userSlotsFlat, selectedTimezone, groupFlatSlotsByLocalDate]
  );
  const mentorByDate = useMemo(
    () => groupFlatSlotsByLocalDate(mentorSlotsFlat, selectedTimezone),
    [mentorSlotsFlat, selectedTimezone, groupFlatSlotsByLocalDate]
  );

  const upcomingDays = useMemo(() => {
    const today = DateTime.now().setZone(selectedTimezone).startOf("day");
    return Array.from({ length: 7 }, (_, i) => {
      const d = today.plus({ days: i });
      return { key: d.toFormat("yyyy-MM-dd"), label: d.toFormat("ccc, dd LLL") };
    });
  }, [selectedTimezone]);

  // ── Auto-fill from common slot click ─────────────────────────────────────────

  const parse12RangeTo24 = (rangeStr) => {
    if (!rangeStr) return { start: "", end: "" };
    const parts = rangeStr.split("–");
    if (parts.length !== 2) return { start: "", end: "" };
    const parse = (s) => {
      const [time, period = ""] = s.trim().split(/\s+/);
      const [hStr, mStr = "00"] = time.split(":");
      let h = Number(hStr);
      const m = Number(mStr);
      if (isNaN(h) || isNaN(m)) return "";
      const p = period.toUpperCase();
      if (p === "AM" && h === 12) h = 0;
      else if (p === "PM" && h !== 12) h += 12;
      return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    };
    return { start: parse(parts[0]), end: parse(parts[1]) };
  };

  const handleCommonSlotClick = (dayKey, startHm, endHm) => {
    const slotKey = `${dayKey}-${startHm}-${endHm}`;
    setSelectedCommonSlot(slotKey);
    const label = formatTimeRange(`${startHm} – ${endHm}`);
    const { start, end } = parse12RangeTo24(label);
    setScheduleDate(dayKey);
    if (start) {
      const p = hm24To12Parts(start);
      setScheduleStartHour(p.hour); setScheduleStartMinute(p.minute); setScheduleStartAmPm(p.amPm);
    }
    if (end) {
      const p = hm24To12Parts(end);
      setScheduleEndHour(p.hour); setScheduleEndMinute(p.minute); setScheduleEndAmPm(p.amPm);
    }
    setInlineError("");
    const uName = (userEmail || selectedUser?.email || "").split("@")[0] || "user";
    const mName = (mentorEmail || selectedMentor?.email || "").split("@")[0] || "mentor";
    setScheduleTitle(`MTQ<>${uName}:${mName}`);
  };

  // ── Schedule meeting ─────────────────────────────────────────────────────────

  const handleScheduleMeeting = async (e) => {
    e.preventDefault();
    setInlineError("");
    setSuccess("");
    if (!scheduleTitle.trim()) { setInlineError("Meeting name is required."); return; }
    if (!scheduleDate) { setInlineError("Please select a date."); return; }
    if (!scheduleStartHour || !scheduleStartMinute || !scheduleStartAmPm) {
      setInlineError("Please select a complete start time."); return;
    }
    if (!scheduleEndHour || !scheduleEndMinute || !scheduleEndAmPm) {
      setInlineError("Please select a complete end time."); return;
    }
    if (!scheduleStartDt || !scheduleEndDt) { setInlineError("Invalid date or time."); return; }
    if (scheduleEndDt.toMillis() <= scheduleStartDt.toMillis()) {
      setInlineError("End time must be after start time."); return;
    }
    if (isPastDateTime(scheduleStartDt.toISO())) { setInlineError("Cannot schedule in the past."); return; }
    if (!selectedUser || !selectedMentor) {
      setInlineError("Select both a user and a mentor."); return;
    }
    setLoading(true);
    try {
      const emails = [userEmail.trim(), mentorEmail.trim(), ...additionalEmails.map((e) => e.trim())]
        .filter(Boolean);
      await adminApi.scheduleMeeting({
        title: scheduleTitle.trim(),
        date: scheduleStartDt.toFormat("dd-MM-yyyy"),
        startTime: scheduleStartDt.toFormat("HH:mm"),
        endTime: scheduleEndDt.toFormat("HH:mm"),
        timezone: meetingZone,
        participantEmails: emails,
        userId: selectedUser.id,
        mentorId: selectedMentor.id,
        callType,
        meetLink: scheduleMeetLink.trim() || undefined,
      });
      setSuccess("Meeting scheduled successfully!");
      setScheduleTitle(""); setScheduleDate("");
      setScheduleStartHour(""); setScheduleStartMinute(""); setScheduleStartAmPm("");
      setScheduleEndHour(""); setScheduleEndMinute(""); setScheduleEndAmPm("");
      setScheduleMeetLink(""); setAdditionalEmails([]); setSelectedCommonSlot(null);
    } catch (err) {
      setInlineError(err.message || "Failed to schedule meeting.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => setSuccess(""), 3000);
    return () => clearTimeout(t);
  }, [success]);

  // ── Render ────────────────────────────────────────────────────────────────────

  const hasAvailability = selectedUser || selectedMentor;

  return (
    <div className="p-6 space-y-6 max-w-full">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-semibold text-white">Schedule a Call</h1>
        <p className="text-slate-400 text-sm mt-0.5">
          Select a user and mentor, find an overlap, then book a call.
        </p>
      </div>

      {error && (
        <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2">
          {error}
        </div>
      )}

      {/* Step 1 — Select user + mentor + call type */}
      <div className="bg-navy-900 border border-navy-700 rounded-xl p-5 space-y-4">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Step 1 — Select participants & call type</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* User */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">User</label>
            <select
              value={selectedUser?.id || ""}
              onChange={(e) => {
                const id = e.target.value;
                setSelectedUser(id ? users.find((u) => u.id === id) || null : null);
                if (!id) setUserEmail("");
              }}
              className="w-full h-10 rounded-lg bg-navy-950 border border-navy-700 text-white px-3 focus:outline-none focus:ring-2 focus:ring-primary-500 appearance-none"
            >
              <option value="">Select user…</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
              ))}
            </select>
          </div>

          {/* Mentor */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Mentor</label>
            <select
              value={selectedMentor?.id || ""}
              onChange={(e) => {
                const id = e.target.value;
                setSelectedMentor(id ? mentors.find((m) => m.id === id) || null : null);
                if (!id) setMentorEmail("");
              }}
              className="w-full h-10 rounded-lg bg-navy-950 border border-navy-700 text-white px-3 focus:outline-none focus:ring-2 focus:ring-primary-500 appearance-none"
            >
              <option value="">Select mentor…</option>
              {mentors.map((m) => (
                <option key={m.id} value={m.id}>{m.name} ({m.email})</option>
              ))}
            </select>
          </div>

          {/* Call type */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Call type</label>
            <select
              value={callType}
              onChange={(e) => setCallType(e.target.value)}
              className="w-full h-10 rounded-lg bg-navy-950 border border-navy-700 text-white px-3 focus:outline-none focus:ring-2 focus:ring-primary-500 appearance-none"
            >
              {CALL_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Timezone */}
        <div className="flex items-center gap-3">
          <label className="text-sm text-slate-400 shrink-0">Display timezone:</label>
          <div className="flex gap-2">
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
      </div>

      {/* Step 2 — Recommendations */}
      {selectedUser && (
        <div className="bg-navy-900 border border-navy-700 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Step 2 — Recommended mentors</p>
              <p className="text-xs text-slate-500 mt-0.5">Based on call type and user profile</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium border ${CALL_TYPE_COLORS[callType] || "bg-slate-700 text-slate-300 border-slate-600"}`}>
                {CALL_TYPE_OPTIONS.find((o) => o.value === callType)?.label}
              </span>
              <button
                type="button"
                onClick={loadRecommendations}
                disabled={loadingRec}
                className="text-xs text-primary-400 hover:text-primary-300 disabled:opacity-50 transition"
              >
                {loadingRec ? "Loading…" : "Refresh"}
              </button>
            </div>
          </div>

          {loadingRec ? (
            <div className="flex items-center gap-2 text-slate-500 text-sm py-2">
              <div className="w-4 h-4 border-2 border-slate-600 border-t-primary-500 rounded-full animate-spin" />
              Finding best matches…
            </div>
          ) : recommendations.length === 0 ? (
            <p className="text-slate-500 text-sm">No recommendations yet. Select a user and call type above.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {recommendations.map((rec, idx) => {
                const isSelected = selectedMentor?.id === rec.mentor.id;
                return (
                  <button
                    key={rec.mentor.id}
                    type="button"
                    onClick={() => {
                      const m = mentors.find((x) => x.id === rec.mentor.id);
                      if (m) { setSelectedMentor(m); setMentorEmail(m.email); }
                    }}
                    className={`text-left rounded-xl border p-3.5 transition ${
                      isSelected
                        ? "bg-primary-600/15 border-primary-500/60"
                        : "bg-navy-800/60 border-navy-700 hover:border-slate-500"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${idx === 0 ? "bg-amber-500 text-white" : idx === 1 ? "bg-slate-400 text-white" : "bg-amber-800 text-white"}`}>
                          {idx + 1}
                        </div>
                        <span className="text-sm font-medium text-white">{rec.mentor.name}</span>
                      </div>
                      <span className="text-[11px] font-semibold text-primary-400 bg-primary-500/10 px-1.5 py-0.5 rounded-md shrink-0">
                        {rec.score}pts
                      </span>
                    </div>
                    {rec.mentor.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {rec.mentor.tags.slice(0, 3).map((tag) => (
                          <span key={tag} className="text-[10px] bg-navy-950 border border-navy-700 text-slate-400 px-1.5 py-0.5 rounded-md">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2">
                      {rec.reasons.join(" · ")}
                    </p>
                    {isSelected && (
                      <div className="mt-2 flex items-center gap-1 text-[11px] text-primary-400 font-medium">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Selected
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Step 3 — Availability overlap */}
      {hasAvailability && (
        <div className="bg-navy-900 border border-navy-700 rounded-xl p-5">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Step 3 — Availability overlap (next 7 days · {displayTimezone})
          </p>
          {loadingUserAvail || loadingMentorAvail ? (
            <div className="flex items-center gap-2 text-slate-500 text-sm py-4">
              <div className="w-4 h-4 border-2 border-slate-600 border-t-primary-500 rounded-full animate-spin" />
              Loading availability…
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-navy-700">
                    <th className="py-2 px-3 text-left font-medium text-slate-400 w-28">Date</th>
                    <th className="py-2 px-3 text-left font-medium text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-sky-500 inline-block" />
                        User
                      </span>
                    </th>
                    <th className="py-2 px-3 text-left font-medium text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-violet-500 inline-block" />
                        Mentor
                      </span>
                    </th>
                    <th className="py-2 px-3 text-left font-medium text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                        Common — click to book
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {upcomingDays.map(({ key, label }, i) => {
                    const uSlots = userByDate.byDate[key]?.slots ?? [];
                    const mSlots = mentorByDate.byDate[key]?.slots ?? [];
                    const common = computeCommonSlots(uSlots, mSlots);
                    return (
                      <tr key={key} className={`border-b border-navy-800 ${i % 2 === 0 ? "bg-navy-900/40" : ""}`}>
                        <td className="py-3 px-3 font-medium text-slate-200 whitespace-nowrap">{label}</td>
                        <td className="py-3 px-3">
                          {uSlots.length === 0 ? (
                            <span className="text-slate-600 text-xs">—</span>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {uSlots.map((s) => (
                                <span key={s.startTime} className="text-[11px] bg-sky-500/10 border border-sky-500/20 text-sky-300 px-1.5 py-0.5 rounded-md">
                                  {formatTimeRange(`${s.convertedStart} – ${s.convertedEnd}`)}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          {mSlots.length === 0 ? (
                            <span className="text-slate-600 text-xs">—</span>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {mSlots.map((s) => (
                                <span key={s.startTime} className="text-[11px] bg-violet-500/10 border border-violet-500/20 text-violet-300 px-1.5 py-0.5 rounded-md">
                                  {formatTimeRange(`${s.convertedStart} – ${s.convertedEnd}`)}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          {common.length === 0 ? (
                            <span className="text-slate-600 text-xs">—</span>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {common.map(({ startHm, endHm }) => {
                                const slotKey = `${key}-${startHm}-${endHm}`;
                                const isSelected = selectedCommonSlot === slotKey;
                                return (
                                  <button
                                    key={slotKey}
                                    type="button"
                                    onClick={() => handleCommonSlotClick(key, startHm, endHm)}
                                    className={`text-[11px] px-1.5 py-0.5 rounded-md border transition font-medium ${
                                      isSelected
                                        ? "bg-emerald-500 border-emerald-400 text-white"
                                        : "bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20"
                                    }`}
                                  >
                                    {formatTimeRange(`${startHm} – ${endHm}`)}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Step 4 — Booking form */}
      <div className="bg-navy-900 border border-navy-700 rounded-xl p-5">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Step 4 — Confirm & book</p>
        <form onSubmit={handleScheduleMeeting} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Meeting title */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Meeting name</label>
            <input
              type="text"
              value={scheduleTitle}
              onChange={(e) => setScheduleTitle(e.target.value)}
              required
              placeholder="e.g. Resume Review with Sarah"
              className="w-full h-10 rounded-lg bg-navy-950 border border-navy-700 text-white px-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Date</label>
            <input
              type="date"
              value={scheduleDate}
              onChange={(e) => { setScheduleDate(e.target.value); setInlineError(""); }}
              className="w-full h-10 rounded-lg bg-navy-950 border border-navy-700 text-white px-3 focus:outline-none focus:ring-2 focus:ring-primary-500 [color-scheme:dark]"
            />
          </div>

          {/* Video link */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Video link (optional)</label>
            <input
              type="url"
              value={scheduleMeetLink}
              onChange={(e) => setScheduleMeetLink(e.target.value)}
              placeholder="https://meet.google.com/..."
              className="w-full h-10 rounded-lg bg-navy-950 border border-navy-700 text-white px-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Start time */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Start time</label>
            <div className="flex items-center gap-2">
              <select value={scheduleStartHour} onChange={(e) => { setScheduleStartHour(e.target.value); setInlineError(""); }} className={selectClass} aria-label="Start hour">
                <option value="">Hour</option>
                {HOUR_OPTIONS.map((h) => <option key={h} value={h}>{h}</option>)}
              </select>
              <span className="text-slate-500">:</span>
              <select value={scheduleStartMinute} onChange={(e) => { setScheduleStartMinute(e.target.value); setInlineError(""); }} className={selectClass} aria-label="Start minute">
                <option value="">Min</option>
                {MINUTE_OPTIONS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
              <select value={scheduleStartAmPm} onChange={(e) => { setScheduleStartAmPm(e.target.value); setInlineError(""); }} className={selectClass} aria-label="AM/PM">
                <option value="">—</option>
                {AMPM_OPTIONS.map((ap) => <option key={ap} value={ap}>{ap}</option>)}
              </select>
            </div>
          </div>

          {/* End time */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">End time</label>
            <div className="flex items-center gap-2">
              <select value={scheduleEndHour} onChange={(e) => { setScheduleEndHour(e.target.value); setInlineError(""); }} className={selectClass} aria-label="End hour">
                <option value="">Hour</option>
                {HOUR_OPTIONS.map((h) => <option key={h} value={h}>{h}</option>)}
              </select>
              <span className="text-slate-500">:</span>
              <select value={scheduleEndMinute} onChange={(e) => { setScheduleEndMinute(e.target.value); setInlineError(""); }} className={selectClass} aria-label="End minute">
                <option value="">Min</option>
                {MINUTE_OPTIONS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
              <select value={scheduleEndAmPm} onChange={(e) => { setScheduleEndAmPm(e.target.value); setInlineError(""); }} className={selectClass} aria-label="AM/PM">
                <option value="">—</option>
                {AMPM_OPTIONS.map((ap) => <option key={ap} value={ap}>{ap}</option>)}
              </select>
            </div>
          </div>

          {/* User email */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">User email</label>
            <input
              type="email"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              placeholder="user@example.com"
              className="w-full h-10 rounded-lg bg-navy-950 border border-navy-700 text-white px-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Mentor email */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Mentor email</label>
            <input
              type="email"
              value={mentorEmail}
              onChange={(e) => setMentorEmail(e.target.value)}
              placeholder="mentor@example.com"
              className="w-full h-10 rounded-lg bg-navy-950 border border-navy-700 text-white px-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Additional emails */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Additional participants (optional)</label>
            <div className="space-y-2">
              {additionalEmails.map((em, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    type="email"
                    value={em}
                    onChange={(e) => {
                      const n = [...additionalEmails]; n[i] = e.target.value; setAdditionalEmails(n);
                    }}
                    placeholder="email@example.com"
                    className="flex-1 h-10 rounded-lg bg-navy-950 border border-navy-700 text-white px-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <button
                    type="button"
                    onClick={() => setAdditionalEmails((p) => p.filter((_, idx) => idx !== i))}
                    className="px-3 h-10 rounded-lg bg-navy-800 border border-navy-700 text-slate-400 hover:text-white text-sm"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setAdditionalEmails((p) => [...p, ""])}
                className="text-sm text-primary-400 hover:text-primary-300"
              >
                + Add participant
              </button>
            </div>
          </div>

          {/* Errors / success */}
          {inlineError && (
            <div className="md:col-span-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm px-4 py-2">
              {inlineError}
            </div>
          )}
          {success && (
            <div className="md:col-span-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm px-4 py-2 flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              {success}
            </div>
          )}

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 rounded-lg bg-primary-600 hover:bg-primary-500 text-white font-medium transition disabled:opacity-50"
            >
              {loading ? "Scheduling…" : "Schedule Meeting"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
