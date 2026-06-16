const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Review = require('../models/Review');
const User = require('../models/User');
const Notification = require('../models/Notification');

// Static list of 20 questions
const QUESTIONS = [
  { id: 1, text: "Quality of work, correctness, and attention to detail." },
  { id: 2, text: "Ability to meet deadlines and manage time effectively." },
  { id: 3, text: "Level of technical knowledge and skill proficiency." },
  { id: 4, text: "Problem-solving capability and analytical thinking." },
  { id: 5, text: "Reliability, dependability, and task follow-through." },
  { id: 6, text: "Adaptability and responsiveness to change and new tasks." },
  { id: 7, text: "Collaboration, helpfulness, and effective teamwork." },
  { id: 8, text: "Written and verbal communication skills with teammates." },
  { id: 9, text: "Proactivity, taking initiative, and self-direction." },
  { id: 10, text: "Customer focus, user empathy, and quality delivery." },
  { id: 11, text: "Leadership skills and willingness to guide or mentor others." },
  { id: 12, text: "Adherence to company culture, values, and policies." },
  { id: 13, text: "Quality of contribution to team design and plan discussions." },
  { id: 14, text: "Openness to constructive feedback and commitment to growth." },
  { id: 15, text: "Creativity, innovation, and out-of-the-box thinking." },
  { id: 16, text: "Critical thinking and decision-making capabilities under pressure." },
  { id: 17, text: "Consistency in daily performance over this review cycle." },
  { id: 18, text: "Ability to resolve workspace conflicts in a constructive manner." },
  { id: 19, text: "Engagement in professional training and skill development." },
  { id: 20, text: "Project execution efficacy and milestone achievement." }
];

// Helper to calculate System Metric Score (1-5 scale)
function calculateSystemScore(user) {
  // Attendance Score (40% weight): (Attendance % / 100) * 5
  const attendanceScore = (user.attendancePercentage / 100) * 5;
  
  // Projects Score (30% weight): (min(Projects Contributed, 5) / 5) * 5
  const projectsScore = (Math.min(user.projectsContributed, 5) / 5) * 5;
  
  // Working Hours Score (30% weight): (min(Hours Worked, 160) / 160) * 5
  const hoursScore = (Math.min(user.hoursWorked, 160) / 160) * 5;
  
  const systemScore = (attendanceScore * 0.40) + (projectsScore * 0.30) + (hoursScore * 0.30);
  return parseFloat(systemScore.toFixed(2));
}

// Helper to get or initialize a review for an employee
async function getOrCreateReview(employeeId, userRole) {
  let review = await Review.findOne({ employeeId })
    .populate('employeeId', 'name email department sickLeaves paidLeaves hoursWorked projectsContributed attendancePercentage')
    .populate('managerId', 'name email');

  if (!review) {
    // Find the user to get their manager
    const employee = await User.findById(employeeId);
    if (!employee) {
      return null;
    }

    // Pre-populate ratings with default questions
    const initialRatings = QUESTIONS.map(q => ({
      questionId: q.id,
      questionText: q.text,
      employeeRating: 0,
      employeeComment: '',
      managerRating: 0,
      managerComment: ''
    }));

    review = new Review({
      employeeId,
      managerId: employee.managerId,
      status: 'Draft',
      ratings: initialRatings,
      auditTrail: [{
        modifiedBy: employeeId,
        role: userRole,
        action: 'Created Review',
        details: 'Initialized performance review sheet.'
      }]
    });

    await review.save();
    
    // Populate new review to keep consistent shape
    review = await Review.findById(review._id)
      .populate('employeeId', 'name email department sickLeaves paidLeaves hoursWorked projectsContributed attendancePercentage')
      .populate('managerId', 'name email');
  }

  return review;
}

// 1. Get current employee review (or create default if not exists)
router.get('/my-review', auth, async (req, res) => {
  try {
    const review = await getOrCreateReview(req.user.id, req.user.role);
    if (!review) {
      return res.status(404).json({ message: 'Employee user not found' });
    }
    res.json(review);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error retrieving your review' });
  }
});

// 2. Save Employee Draft
router.post('/save-draft', auth, async (req, res) => {
  try {
    const { ratings } = req.body;
    let review = await getOrCreateReview(req.user.id, req.user.role);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    if (review.status !== 'Draft') {
      return res.status(400).json({ message: 'Cannot edit rating, review has already been submitted.' });
    }

    // Update ratings fields
    ratings.forEach(updated => {
      const item = review.ratings.find(r => r.questionId === updated.questionId);
      if (item) {
        item.employeeRating = updated.employeeRating || 0;
        item.employeeComment = updated.employeeComment || '';
      }
    });

    review.auditTrail.push({
      modifiedBy: req.user.id,
      role: req.user.role,
      action: 'Saved Draft',
      details: 'Employee updated self-ratings and comments.'
    });

    await review.save();
    res.json({ message: 'Draft saved successfully', review });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error saving draft' });
  }
});

// 3. Submit Employee Review
router.post('/submit', auth, async (req, res) => {
  try {
    const { ratings } = req.body;
    let review = await getOrCreateReview(req.user.id, req.user.role);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    if (review.status !== 'Draft') {
      return res.status(400).json({ message: 'Review already submitted' });
    }

    // Validation check: Make sure all questions have rating > 0
    let employeeSum = 0;
    ratings.forEach(updated => {
      const item = review.ratings.find(r => r.questionId === updated.questionId);
      if (item) {
        item.employeeRating = updated.employeeRating || 0;
        item.employeeComment = updated.employeeComment || '';
        employeeSum += item.employeeRating;
      }
    });

    const employeeAvg = employeeSum / review.ratings.length;
    review.calculatedScores.employeeAvg = parseFloat(employeeAvg.toFixed(2));
    review.status = 'Submitted';
    
    review.auditTrail.push({
      modifiedBy: req.user.id,
      role: req.user.role,
      action: 'Submitted Review',
      details: `Employee submitted review. Average self-score: ${review.calculatedScores.employeeAvg}`
    });

    await review.save();

    // Notify Manager
    if (review.managerId) {
      const employee = await User.findById(req.user.id);
      const notify = new Notification({
        recipientId: review.managerId,
        senderId: req.user.id,
        message: `Employee ${employee.name} has submitted their performance review. Ready for your review.`
      });
      await notify.save();
    }

    res.json({ message: 'Review submitted successfully', review });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error submitting review' });
  }
});

// 4. Get reviews pending for Manager
router.get('/pending-manager', auth, async (req, res) => {
  try {
    if (req.user.role !== 'manager' && req.user.role !== 'hr') {
      return res.status(403).json({ message: 'Access denied: Requires Manager or HR role' });
    }

    const reviews = await Review.find({ 
      managerId: req.user.id, 
      status: { $in: ['Submitted', 'Manager Reviewed', 'HR Finalized'] } 
    }).populate('employeeId', 'name email department sickLeaves paidLeaves hoursWorked projectsContributed attendancePercentage');
    
    res.json(reviews);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching pending manager reviews' });
  }
});

// 5. Manager Submits Review
router.post('/manager-submit/:reviewId', auth, async (req, res) => {
  try {
    if (req.user.role !== 'manager') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { ratings, managerFeedback } = req.body;
    let review = await Review.findById(req.params.reviewId);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    if (review.managerId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied: You are not this employee\'s manager' });
    }

    if (review.status !== 'Submitted' && review.status !== 'Manager Reviewed') {
      return res.status(400).json({ message: 'Review not in editable status by manager' });
    }

    let managerSum = 0;
    ratings.forEach(updated => {
      const item = review.ratings.find(r => r.questionId === updated.questionId);
      if (item) {
        item.managerRating = updated.managerRating || 0;
        item.managerComment = updated.managerComment || '';
        managerSum += item.managerRating;
      }
    });

    const managerAvg = managerSum / review.ratings.length;
    review.calculatedScores.managerAvg = parseFloat(managerAvg.toFixed(2));
    review.managerFeedback = managerFeedback || '';
    review.status = 'Manager Reviewed';

    review.auditTrail.push({
      modifiedBy: req.user.id,
      role: req.user.role,
      action: 'Manager Submitted Review',
      details: `Manager finalized ratings. Average manager: ${review.calculatedScores.managerAvg}. feedback length: ${review.managerFeedback.length}`
    });

    await review.save();

    // Notify all HR Users
    const hrs = await User.find({ role: 'hr' });
    const employee = await User.findById(review.employeeId);
    for (let hr of hrs) {
      const notify = new Notification({
        recipientId: hr._id,
        senderId: req.user.id,
        message: `Manager reviewed performance sheet for ${employee.name}. Ready for HR finalization.`
      });
      await notify.save();
    }

    res.json({ message: 'Manager evaluation submitted successfully', review });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error during manager review submission' });
  }
});

// 6. HR Get All Reviews
router.get('/all', auth, async (req, res) => {
  try {
    if (req.user.role !== 'hr') {
      return res.status(403).json({ message: 'Access denied: Requires HR role' });
    }

    // Populate employee & manager details
    let query = Review.find()
      .populate('employeeId', 'name email department sickLeaves paidLeaves hoursWorked projectsContributed attendancePercentage')
      .populate('managerId', 'name email');

    const reviews = await query;
    res.json(reviews);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching reviews for HR' });
  }
});

// 7. HR Finalize Review & Calculate Score
router.post('/hr-finalize/:reviewId', auth, async (req, res) => {
  try {
    if (req.user.role !== 'hr') {
      return res.status(403).json({ message: 'Access denied: Requires HR role' });
    }

    const { hrRemarks, discussionNotes, appraisalPercentage, promotionRecommended } = req.body;
    let review = await Review.findById(req.params.reviewId);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Fetch employee details to calculate system metrics
    const employee = await User.findById(review.employeeId);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    const systemScore = calculateSystemScore(employee);
    review.calculatedScores.systemScore = systemScore;

    // Weight Calculation:
    // 40% Employee self-rating, 40% Manager rating, 20% System Metrics
    const empAvg = review.calculatedScores.employeeAvg || 0;
    const mgrAvg = review.calculatedScores.managerAvg || 0;
    const finalScore = (empAvg * 0.40) + (mgrAvg * 0.40) + (systemScore * 0.20);
    
    review.calculatedScores.finalScore = parseFloat(finalScore.toFixed(2));
    review.hrRemarks = hrRemarks || '';
    review.discussionNotes = discussionNotes || '';
    review.appraisalPercentage = appraisalPercentage || 0;
    review.promotionRecommended = !!promotionRecommended;
    review.status = 'HR Finalized';

    review.auditTrail.push({
      modifiedBy: req.user.id,
      role: req.user.role,
      action: 'HR Finalized Performance Review',
      details: `Final Score: ${review.calculatedScores.finalScore}. Appraisal: ${review.appraisalPercentage}%. Promotion: ${review.promotionRecommended}. Discussion notes length: ${review.discussionNotes.length}`
    });

    await review.save();

    // Notify Employee
    const notify = new Notification({
      recipientId: review.employeeId,
      senderId: req.user.id,
      message: `Your final performance review has been completed by HR. Final Score: ${review.calculatedScores.finalScore}.`
    });
    await notify.save();

    res.json({ message: 'Review finalized by HR successfully', review });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error finalising review' });
  }
});

module.exports = router;
