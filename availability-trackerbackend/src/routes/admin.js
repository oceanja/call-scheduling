import { Router } from "express";
import {
  listUsers,
  listMentors,
  createUser,
  getAvailabilityForUser,
  getOverlappingSlots,
  scheduleMeeting,
  updateMentorProfile,
  getRecommendations,
} from "../controllers/adminController.js";
import { authenticate, requireRole } from "../middleware/auth.js";

export const adminRoutes = Router();

adminRoutes.use(authenticate);
adminRoutes.use(requireRole("ADMIN"));

adminRoutes.get("/users", listUsers);
adminRoutes.get("/mentors", listMentors);
adminRoutes.patch("/mentors/:mentorId", updateMentorProfile);
adminRoutes.get("/recommendations", getRecommendations);
adminRoutes.post("/create-user", createUser);
adminRoutes.get("/availability/:userId", getAvailabilityForUser);
adminRoutes.get("/availability/:userId/overlap", getOverlappingSlots);
adminRoutes.post("/meetings", scheduleMeeting);
