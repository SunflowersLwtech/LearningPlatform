const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const { validateAssignmentCreate, handleValidationErrors } = require('../middleware/validation');
const {
  createAssignment,
  getAllAssignments,
  getAssignmentById,
  updateAssignment,
  deleteAssignment,
  gradeSubmission,
  getSubmissions,
  publishAssignment
} = require('../controllers/assignmentController');

const router = express.Router();

router.use(authenticate);

router.route('/')
  .get(getAllAssignments)
  .post(
    authorize('admin', 'principal', 'director', 'head_teacher', 'teacher'),
    validateAssignmentCreate,
    handleValidationErrors,
    createAssignment
  );

router.route('/:id')
  .get(getAssignmentById)
  .put(authorize('admin', 'principal', 'director', 'head_teacher', 'teacher'), updateAssignment)
  .delete(authorize('admin', 'principal', 'director', 'head_teacher', 'teacher'), deleteAssignment);

router.put('/:id/publish',
  authorize('admin', 'principal', 'director', 'head_teacher', 'teacher'),
  publishAssignment
);

router.get('/:id/submissions',
  authorize('admin', 'principal', 'director', 'head_teacher', 'teacher'),
  getSubmissions
);

router.put('/submissions/:submissionId/grade',
  authorize('admin', 'principal', 'director', 'head_teacher', 'teacher'),
  gradeSubmission
);

module.exports = router;