const {
  User,
  Location,
  Skill,
  Availability,
  UserSkill,
  UserLocation,
  ManagerLocation,
} = require("../models");
const bcrypt = require("bcryptjs");

async function seedDatabase() {
  try {
    console.log("Seeding database...");

    // Create skills
    const skillData = [
      { name: "Bartender", description: "Bar service and drink preparation" },
      {
        name: "Line Cook",
        description: "Kitchen cooking and food preparation",
      },
      { name: "Server", description: "Table service and customer interaction" },
      {
        name: "Host",
        description: "Greeting customers and managing reservations",
      },
    ];

    const skills = [];
    for (const data of skillData) {
      const [skill] = await Skill.findOrCreate({
        where: { name: data.name },
        defaults: data,
      });
      skills.push(skill);
    }

    // Create locations
    const locationData = [
      {
        name: "Downtown Coastal",
        address: "123 Main St, Downtown",
        city: "Portland",
        state: "OR",
        zipCode: "97201",
        timezone: "America/Los_Angeles",
        phone: "(503) 555-0123",
      },
      {
        name: "Eastside Coastal",
        address: "456 Oak Ave, Eastside",
        city: "Portland",
        state: "OR",
        zipCode: "97202",
        timezone: "America/Los_Angeles",
        phone: "(503) 555-0456",
      },
      {
        name: "West Linn Coastal",
        address: "789 River Rd, West Linn",
        city: "West Linn",
        state: "OR",
        zipCode: "97068",
        timezone: "America/Los_Angeles",
        phone: "(503) 555-0789",
      },
      {
        name: "NYC Coastal",
        address: "321 Broadway, Manhattan",
        city: "New York",
        state: "NY",
        zipCode: "10001",
        timezone: "America/New_York",
        phone: "(212) 555-0321",
      },
    ];

    const locations = [];
    for (const data of locationData) {
      const [location] = await Location.findOrCreate({
        where: { name: data.name },
        defaults: data,
      });
      locations.push(location);
    }

    // Create users
    const userData = [
      {
        email: "admin@coastal.com",
        password: "password123",
        firstName: "Admin",
        lastName: "User",
        role: "admin",
        timezone: "America/New_York",
      },
      {
        email: "manager1@coastal.com",
        password: "password123",
        firstName: "Sarah",
        lastName: "Johnson",
        role: "manager",
        timezone: "America/Los_Angeles",
      },
      {
        email: "manager2@coastal.com",
        password: "password123",
        firstName: "Mike",
        lastName: "Chen",
        role: "manager",
        timezone: "America/New_York",
      },
      {
        email: "staff1@coastal.com",
        password: "password123",
        firstName: "Emily",
        lastName: "Davis",
        role: "staff",
        timezone: "America/Los_Angeles",
        desiredHoursPerWeek: 35,
      },
      {
        email: "staff2@coastal.com",
        password: "password123",
        firstName: "John",
        lastName: "Smith",
        role: "staff",
        timezone: "America/Los_Angeles",
        desiredHoursPerWeek: 40,
      },
      {
        email: "staff3@coastal.com",
        password: "password123",
        firstName: "Maria",
        lastName: "Garcia",
        role: "staff",
        timezone: "America/New_York",
        desiredHoursPerWeek: 30,
      },
    ];

    const users = [];
    for (const data of userData) {
      const [user] = await User.findOrCreate({
        where: { email: data.email },
        defaults: data,
      });
      users.push(user);
    }

    // Assign managers to locations
    await ManagerLocation.bulkCreate([
      { managerId: users[1].id, locationId: locations[0].id }, // Sarah -> Downtown
      { managerId: users[1].id, locationId: locations[1].id }, // Sarah -> Eastside
      { managerId: users[2].id, locationId: locations[3].id }, // Mike -> NYC
    ]);

    // Assign staff skills
    await UserSkill.bulkCreate([
      { userId: users[3].id, skillId: skills[0].id }, // Emily - Bartender
      { userId: users[3].id, skillId: skills[2].id }, // Emily - Server
      { userId: users[4].id, skillId: skills[1].id }, // John - Line Cook
      { userId: users[4].id, skillId: skills[3].id }, // John - Host
      { userId: users[5].id, skillId: skills[2].id }, // Maria - Server
      { userId: users[5].id, skillId: skills[0].id }, // Maria - Bartender
    ]);

    // Certify staff for locations
    await UserLocation.bulkCreate([
      { userId: users[3].id, locationId: locations[0].id, isCertified: true }, // Emily - Downtown
      { userId: users[3].id, locationId: locations[1].id, isCertified: true }, // Emily - Eastside
      { userId: users[4].id, locationId: locations[0].id, isCertified: true }, // John - Downtown
      { userId: users[4].id, locationId: locations[1].id, isCertified: true }, // John - Eastside
      { userId: users[5].id, locationId: locations[3].id, isCertified: true }, // Maria - NYC
    ]);

    // Create availability (example for one staff member)
    await Availability.bulkCreate([
      {
        userId: users[3].id,
        dayOfWeek: 1,
        startTime: "09:00",
        endTime: "17:00",
        isRecurring: true,
      }, // Monday
      {
        userId: users[3].id,
        dayOfWeek: 2,
        startTime: "09:00",
        endTime: "17:00",
        isRecurring: true,
      }, // Tuesday
      {
        userId: users[3].id,
        dayOfWeek: 3,
        startTime: "09:00",
        endTime: "17:00",
        isRecurring: true,
      }, // Wednesday
      {
        userId: users[3].id,
        dayOfWeek: 4,
        startTime: "09:00",
        endTime: "17:00",
        isRecurring: true,
      }, // Thursday
      {
        userId: users[3].id,
        dayOfWeek: 5,
        startTime: "16:00",
        endTime: "22:00",
        isRecurring: true,
      }, // Friday
      {
        userId: users[3].id,
        dayOfWeek: 6,
        startTime: "16:00",
        endTime: "22:00",
        isRecurring: true,
      }, // Saturday
    ]);

    console.log("Database seeded successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}

module.exports = seedDatabase;
