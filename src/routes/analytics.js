const express = require('express');
const { authenticate, authorize, checkPermission } = require('../middleware/auth');
const {
  generateStudentReport,
  generateClassReport,
  getGradeDistribution,
  getAttendanceAnalytics,
  getStats
} = require('../controllers/analyticsController');

const router = express.Router();

router.use(authenticate);
router.use(authorize('admin', 'principal', 'director', 'head_teacher', 'teacher'));
router.use(checkPermission('canAccessReports'));

router.get('/stats', getStats);
router.get('/student/:studentId/report', generateStudentReport);
router.get('/class/:classId/report', generateClassReport);
router.get('/grade-distribution', getGradeDistribution);
router.get('/attendance', getAttendanceAnalytics);

module.exports = router;