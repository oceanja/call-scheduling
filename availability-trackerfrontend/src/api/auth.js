import { api, get, post, patch } from "./client.js";

export async function login(data) {
  return post("/api/auth/login", data);
}

export async function me() {
  return api("GET", `/api/auth/me?_=${Date.now()}`, null, { skipAuthRedirect: true });
}

export async function updateProfile(body) {
  return patch("/api/auth/profile", body);
}
