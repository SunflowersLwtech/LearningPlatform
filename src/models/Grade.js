const mongoose = require('mongoose');

const gradeSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  assignment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assignment'
  },
  submission: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Submission'
  },
  type: {
    type: String,
    enum: ['quiz', 'homework', 'exam', 'project', 'participation', 'attendance', 'final'],
    required: true
  },
  category: {
    type: String,
    enum: ['formative', 'summative'],
    required: true
  },
  score: {
    type: Number,
    required: true
  },
  maxScore: {
    type: Number,
    required: true
  },
  percentage: {
    type: Number,
    required: true
  },
  letterGrade: String,
  gpa: Number,
  weight: {
    type: Number,
    default: 1
  },
  semester: {
    type: String,
    required: true
  },
  academicYear: {
    type: String,
    required: true
  },
  gradedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff',
    required: true
  },
  gradedAt: {
    type: Date,
    default: Date.now
  },
  comments: String,
  feedback: String,
  rubricScores: [{
    criteria: String,
    score: Number,
    maxScore: Number,
    weight: Number
  }],
  isExcused: {
    type: Boolean,
    default: false
  },
  makeupAllowed: {
    type: Boolean,
    default: false
  },
  makeupDeadline: Date,
  parentNotified: {
    type: Boolean,
    default: false
  },
  notificationDate: Date
}, {
  timestamps: true
});

gradeSchema.index({ student: 1, course: 1, academicYear: 1 });
gradeSchema.index({ course: 1, type: 1 });
gradeSchema.index({ gradedAt: -1 });

module.exports = mongoose.model('Grade', gradeSchema);