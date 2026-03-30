import { get, post, patch } from "./client.js";

export async function listUsers() {
  return get("/api/admin/users");
}

export async function listMentors() {
  return get("/api/admin/mentors");
}

export async function updateMentor(mentorId, data) {
  return patch(`/api/admin/mentors/${mentorId}`, data);
}

export async function getRecommendations(userId, callType) {
  const q = new URLSearchParams({ userId, callType }).toString();
  return get(`/api/admin/recommendations?${q}`);
}

export async function createUser(data) {
  return post("/api/admin/create-user", data);
}

export async function getAvailabilityForUser(userId, weekStart) {
  const q = weekStart ? `?weekStart=${weekStart}` : "";
  return get(`/api/admin/availability/${userId}${q}`);
}

export async function getOverlappingSlots(userId, startTime, endTime) {
  const q = new URLSearchParams({ startTime, endTime }).toString();
  return get(`/api/admin/availability/${userId}/overlap?${q}`);
}

export async function scheduleMeeting(data) {
  return post("/api/admin/meetings", data);
}
