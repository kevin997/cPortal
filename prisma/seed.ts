import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create test users
  const hashedPassword = await bcrypt.hash("password123", 10);

  const agent = await prisma.user.upsert({
    where: { email: "agent@cportal.com" },
    update: {},
    create: {
      email: "agent@cportal.com",
      name: "Sales Agent",
      password: hashedPassword,
      role: "sales_agent",
    },
  });

  const rep = await prisma.user.upsert({
    where: { email: "rep@cportal.com" },
    update: {},
    create: {
      email: "rep@cportal.com",
      name: "Sales Representative",
      password: hashedPassword,
      role: "sales_rep",
    },
  });

  const manager = await prisma.user.upsert({
    where: { email: "manager@cportal.com" },
    update: {},
    create: {
      email: "manager@cportal.com",
      name: "Sales Manager",
      password: hashedPassword,
      role: "sales_manager",
    },
  });

  console.log("Users created:", { agent, rep, manager });

  // Create sample bootcamp sessions
  const bootcamp1 = await prisma.bootcampSession.create({
    data: {
      name: "Web Development Bootcamp Q1 2024",
      description: "Intensive 12-week web development bootcamp covering HTML, CSS, JavaScript, React, and Node.js",
      startDate: new Date("2024-03-01"),
      endDate: new Date("2024-05-31"),
      targetCapacity: 30,
      currentCapacity: 0,
      status: "upcoming",
      location: "Douala, Cameroon",
    },
  });

  const bootcamp2 = await prisma.bootcampSession.create({
    data: {
      name: "Data Science Bootcamp Q2 2024",
      description: "Comprehensive data science program with Python, ML, and AI",
      startDate: new Date("2024-04-15"),
      endDate: new Date("2024-07-15"),
      targetCapacity: 25,
      currentCapacity: 0,
      status: "upcoming",
      location: "Yaoundé, Cameroon",
    },
  });

  console.log("Bootcamp sessions created:", { bootcamp1, bootcamp2 });

  console.log("Seeding completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
