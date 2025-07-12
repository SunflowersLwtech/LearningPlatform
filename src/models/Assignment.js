const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: String,
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff',
    required: true
  },
  assignedTo: [{
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class'
    },
    students: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student'
    }]
  }],
  type: {
    type: String,
    enum: ['homework', 'project', 'quiz', 'exam', 'presentation', 'lab'],
    required: true
  },
  format: {
    type: String,
    enum: ['online', 'offline', 'hybrid'],
    default: 'online'
  },
  questions: [{
    questionNumber: Number,
    type: {
      type: String,
      enum: ['multiple_choice', 'true_false', 'short_answer', 'essay', 'fill_blank', 'matching']
    },
    question: String,
    options: [String],
    correctAnswer: String,
    points: {
      type: Number,
      default: 1
    },
    explanation: String
  }],
  attachments: [{
    name: String,
    url: String,
    type: String
  }],
  instructions: String,
  totalPoints: {
    type: Number,
    default: 0
  },
  timeLimit: Number,
  attempts: {
    type: Number,
    default: 1
  },
  startDate: {
    type: Date,
    required: true
  },
  dueDate: {
    type: Date,
    required: true
  },
  lateSubmission: {
    allowed: {
      type: Boolean,
      default: true
    },
    penalty: Number
  },
  grading: {
    type: {
      type: String,
      enum: ['automatic', 'manual', 'hybrid'],
      default: 'manual'
    },
    rubric: [{
      criteria: String,
      levels: [{
        name: String,
        description: String,
        points: Number
      }]
    }]
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  settings: {
    showCorrectAnswers: {
      type: Boolean,
      default: false
    },
    randomizeQuestions: {
      type: Boolean,
      default: false
    },
    preventCheating: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true
});

assignmentSchema.index({ course: 1, dueDate: -1 });
assignmentSchema.index({ teacher: 1, createdAt: -1 });

module.exports = mongoose.model('Assignment', assignmentSchema);