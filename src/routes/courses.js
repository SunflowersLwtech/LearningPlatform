const express = require('express');
const { authenticate, authorize, checkPermission } = require('../middleware/auth');
const {
  createCourse,
  getAllCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
  enrollClass,
  getCourseStudents
} = require('../controllers/courseController');

const router = express.Router();

router.use(authenticate);

router.route('/')
  .get(authorize('admin', 'principal', 'director', 'head_teacher', 'teacher', 'student'), getAllCourses)
  .post(authorize('admin', 'principal', 'director', 'teacher'), createCourse);

router.route('/:id')
  .get(authorize('admin', 'principal', 'director', 'head_teacher', 'teacher', 'student'), getCourseById)
  .put(authorize('admin', 'principal', 'director', 'teacher'), updateCourse)
  .delete(authorize('admin', 'principal', 'director'), deleteCourse);

router.put('/:id/enroll',
  authorize('admin', 'principal', 'director', 'teacher'),
  enrollClass
);

router.get('/:id/students',
  authorize('admin', 'principal', 'director', 'head_teacher', 'teacher'),
  getCourseStudents
);

module.exports = router;