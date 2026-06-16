const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['employee', 'manager', 'hr'], default: 'employee' },
  department: { type: String, default: 'Engineering' },
  managerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  sickLeaves: { type: Number, default: 0 },
  paidLeaves: { type: Number, default: 0 },
  hoursWorked: { type: Number, default: 0 },
  projectsContributed: { type: Number, default: 0 },
  attendancePercentage: { type: Number, default: 100 }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
