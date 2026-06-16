const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Review = require('./models/Review');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://mongo:27017/company_management';

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB to seed database...');

    // Clear existing collections to make development/testing reproducible
    await User.deleteMany({});
    await Review.deleteMany({});
    console.log('Cleared existing Users and Reviews.');

    const salt = await bcrypt.genSalt(10);

    // 1. Create HR user
    const hrPassword = await bcrypt.hash('hr123', salt);
    const hr = new User({
      name: 'Sarah Connor (HR)',
      email: 'hr@company.com',
      password: hrPassword,
      role: 'hr',
      department: 'Human Resources',
      sickLeaves: 2,
      paidLeaves: 5,
      hoursWorked: 160,
      projectsContributed: 2,
      attendancePercentage: 98
    });
    await hr.save();
    console.log('HR User seeded successfully.');

    // 2. Create Manager user
    const managerPassword = await bcrypt.hash('manager123', salt);
    const manager = new User({
      name: 'John Smith (Manager)',
      email: 'manager@company.com',
      password: managerPassword,
      role: 'manager',
      department: 'Engineering',
      sickLeaves: 1,
      paidLeaves: 8,
      hoursWorked: 165,
      projectsContributed: 6,
      attendancePercentage: 99
    });
    await manager.save();
    console.log('Manager User seeded successfully.');

    // 3. Create Employee user (assigned to Manager)
    const employeePassword = await bcrypt.hash('employee123', salt);
    const employee = new User({
      name: 'Jane Doe (Employee)',
      email: 'employee@company.com',
      password: employeePassword,
      role: 'employee',
      department: 'Engineering',
      managerId: manager._id,
      sickLeaves: 3,
      paidLeaves: 12,
      hoursWorked: 152,
      projectsContributed: 4,
      attendancePercentage: 96
    });
    await employee.save();
    console.log('Employee User seeded successfully.');

    console.log('Database seeding completed. Exiting...');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
}

seed();
