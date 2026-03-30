/**
 * Seed demo data: 1 admin, 5 mentors, 10 users.
 * Run: node src/scripts/seed.js
 * Requires DATABASE_URL and JWT_SECRET not needed for seed.
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";

const prisma = new PrismaClient();

const PASSWORD = "password123";
const ADMIN_PASSWORD = "admin123";

const admin = {
  email: "admin@example.com",
  name: "Admin User",
  role: "ADMIN",
};

const mentors = [
  {
    email: "mentor1@example.com",
    name: "Alex BigTech",
    tags: ["Tech", "Big tech", "Big company", "India", "Senior Developer"],
    description: "Ex-FAANG senior engineer; resume and system design.",
  },
  {
    email: "mentor2@example.com",
    name: "Sam Communicator",
    tags: ["Non-tech", "Good communication", "Public company", "Ireland"],
    description: "Career coach focused on clarity and interview storytelling.",
  },
  {
    email: "mentor3@example.com",
    name: "Jordan Domain",
    tags: ["Tech", "India", "Senior Developer"],
    description: "Backend and distributed systems; mock interviews in infra.",
  },
  {
    email: "mentor4@example.com",
    name: "Riley Public",
    tags: ["Tech", "Public company", "Ireland", "Good communication"],
    description: "Product-minded engineer; job market and negotiation.",
  },
  {
    email: "mentor5@example.com",
    name: "Casey Startup",
    tags: ["Non-tech", "Good communication", "India"],
    description: "PM background; communication and cross-functional prep.",
  },
];

const users = [
  { email: "user1@example.com", name: "User One", tags: ["Tech", "Good communication"], description: "Backend engineer targeting big tech." },
  { email: "user2@example.com", name: "User Two", tags: ["Tech", "Asks a lot of questions"], description: "Full-stack; wants mock interviews in web." },
  { email: "user3@example.com", name: "User Three", tags: ["Non-tech", "Good communication"], description: "Switching careers; needs job market guidance." },
  { email: "user4@example.com", name: "User Four", tags: ["Non-tech"], description: "Marketing background; exploring PM roles." },
  { email: "user5@example.com", name: "User Five", tags: ["Tech", "Good communication", "Asks a lot of questions"], description: "Mobile developer in Ireland." },
  { email: "user6@example.com", name: "User Six", tags: ["Tech"], description: "Data engineer; resume refresh for public companies." },
  { email: "user7@example.com", name: "User Seven", tags: ["Non-tech", "Good communication"], description: "UX designer; communication coaching." },
  { email: "user8@example.com", name: "User Eight", tags: ["Tech", "Asks a lot of questions"], description: "ML engineer; domain-specific mocks." },
  { email: "user9@example.com", name: "User Nine", tags: ["Tech", "Good communication"], description: "Frontend dev in India." },
  { email: "user10@example.com", name: "User Ten", tags: ["Non-tech"], description: "Operations; exploring Ireland market." },
];

async function upsertUser({ email, name, password, role, tags, description }) {
  const hash = await bcrypt.hash(password, 12);
  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) {
    return prisma.user.update({
      where: { id: existing.id },
      data: { name, role, tags, description: description ?? null, password: hash },
    });
  }
  return prisma.user.create({
    data: {
      id: uuidv4(),
      email: email.toLowerCase(),
      name,
      password: hash,
      role,
      tags: tags || [],
      description: description ?? null,
      timezone: "UTC",
    },
  });
}

async function main() {
  await upsertUser({
    ...admin,
    password: ADMIN_PASSWORD,
    tags: [],
    description: "System administrator",
  });

  for (const m of mentors) {
    await upsertUser({
      email: m.email,
      name: m.name,
      password: PASSWORD,
      role: "MENTOR",
      tags: m.tags,
      description: m.description,
    });
  }

  for (const u of users) {
    await upsertUser({
      email: u.email,
      name: u.name,
      password: PASSWORD,
      role: "USER",
      tags: u.tags,
      description: u.description,
    });
  }

  console.log("Seed complete.");
  console.log("Admin:", admin.email, "/", ADMIN_PASSWORD);
  console.log("Mentors & users:", mentors.length + users.length, "accounts with password", PASSWORD);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
