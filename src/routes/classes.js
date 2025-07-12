const express = require('express');
const { authenticate, authorize, checkPermission } = require('../middleware/auth');
const {
  createClass,
  getAllClasses,
  getClassById,
  updateClass,
  updateSchedule,
  assignTeacher,
  getClassSchedule
} = require('../controllers/classController');

const router = express.Router();

router.use(authenticate);

router.route('/')
  .get(authorize('admin', 'principal', 'director', 'head_teacher', 'teacher'), getAllClasses)
  .post(authorize('admin', 'principal', 'director'), checkPermission('canManageSchedule'), createClass);

router.route('/:id')
  .get(authorize('admin', 'principal', 'director', 'head_teacher', 'teacher', 'student'), getClassById)
  .put(authorize('admin', 'principal', 'director'), checkPermission('canManageSchedule'), updateClass);

router.put('/:id/schedule',
  authorize('admin', 'principal', 'director'),
  checkPermission('canManageSchedule'),
  updateSchedule
);

router.put('/:id/assign-teacher',
  authorize('admin', 'principal', 'director'),
  checkPermission('canManageSchedule'),
  assignTeacher
);

router.get('/:id/schedule',
  authorize('admin', 'principal', 'director', 'head_teacher', 'teacher', 'student'),
  getClassSchedule
);

module.exports = router;