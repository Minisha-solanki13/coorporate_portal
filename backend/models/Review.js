const mongoose = require('mongoose');

const RatingItemSchema = new mongoose.Schema({
  questionId: { type: Number, required: true },
  questionText: { type: String, required: true },
  employeeRating: { type: Number, default: 0 },
  employeeComment: { type: String, default: '' },
  managerRating: { type: Number, default: 0 },
  managerComment: { type: String, default: '' }
});

const AuditLogSchema = new mongoose.Schema({
  modifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  action: { type: String, required: true },
  details: { type: String, default: '' }
});

const ReviewSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  managerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  status: { 
    type: String, 
    enum: ['Draft', 'Submitted', 'Manager Reviewed', 'HR Finalized'], 
    default: 'Draft' 
  },
  ratings: [RatingItemSchema],
  calculatedScores: {
    employeeAvg: { type: Number, default: 0 },
    managerAvg: { type: Number, default: 0 },
    systemScore: { type: Number, default: 0 },
    finalScore: { type: Number, default: 0 }
  },
  hrRemarks: { type: String, default: '' },
  managerFeedback: { type: String, default: '' },
  discussionNotes: { type: String, default: '' },
  appraisalPercentage: { type: Number, default: 0 },
  promotionRecommended: { type: Boolean, default: false },
  auditTrail: [AuditLogSchema]
}, { timestamps: true });

module.exports = mongoose.model('Review', ReviewSchema);
