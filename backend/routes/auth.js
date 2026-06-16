const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkeyforperformancemanagement';

// Login route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email }).populate('managerId', 'name email');
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Sign token
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        sickLeaves: user.sickLeaves,
        paidLeaves: user.paidLeaves,
        hoursWorked: user.hoursWorked,
        projectsContributed: user.projectsContributed,
        attendancePercentage: user.attendancePercentage,
        manager: user.managerId ? { id: user.managerId._id, name: user.managerId.name } : null
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Register route (HR only or general helper for setup)
router.post('/register', async (req, res) => {
  try {
    const { 
      name, 
      email, 
      password, 
      role, 
      department, 
      managerId,
      sickLeaves,
      paidLeaves,
      hoursWorked,
      projectsContributed,
      attendancePercentage 
    } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role: role || 'employee',
      department: department || 'Engineering',
      managerId: managerId || null,
      sickLeaves: sickLeaves || 0,
      paidLeaves: paidLeaves || 0,
      hoursWorked: hoursWorked || 0,
      projectsContributed: projectsContributed || 0,
      attendancePercentage: attendancePercentage || 100
    });

    await newUser.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

module.exports = router;
