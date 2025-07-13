const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const Grade = require('../models/Grade');
const Course = require('../models/Course');
const Student = require('../models/Student');

const getCurrentSemester = () => {
  const month = new Date().getMonth() + 1;
  if (month >= 9 || month <= 1) {
    return 'fall';
  } else if (month >= 2 && month <= 6) {
    return 'spring';
  } else {
    return 'summer';
  }
};

const getCurrentAcademicYear = () => {
  const year = new Date().getFullYear();
  const month = new Date().getMonth() + 1;
  return month >= 9 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
};

exports.createAssignment = async (req, res) => {
  try {
    const assignment = new Assignment({
      ...req.body,
      teacher: req.user.id
    });
    
    
    await assignment.save();
    
    res.status(201).json({
      success: true,
      message: '作业创建成功',
      data: assignment
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: '创建作业失败',
      error: error.message
    });
  }
};

exports.getAllAssignments = async (req, res) => {
  try {
    const { course, type, status, page = 1, limit = 10 } = req.query;
    
    let filter = {};
    if (course) filter.course = course;
    if (type) filter.type = type;
    if (status === 'published') filter.isPublished = true;
    if (status === 'draft') filter.isPublished = false;
    
    if (req.userType === 'teacher') {
      filter.teacher = req.user.id;
    } else if (req.userType === 'student') {
      filter.isPublished = true;
      filter['assignedTo.students'] = req.user.id;
    }
    
    const assignments = await Assignment.find(filter)
      .populate('course', 'name subject')
      .populate('teacher', 'name')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Assignment.countDocuments(filter);
    
    res.json({
      success: true,
      data: assignments,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取作业列表失败',
      error: error.message
    });
  }
};

exports.getAssignmentById = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id)
      .populate('course', 'name subject')
      .populate('teacher', 'name staffId');
    
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: '作业不存在'
      });
    }
    
    if (req.userType === 'student') {
      if (!assignment.isPublished || !assignment.assignedTo.some(assigned => 
        assigned.students.includes(req.user.id))) {
        return res.status(403).json({
          success: false,
          message: '无权访问此作业'
        });
      }
      
      const submission = await Submission.findOne({
        assignment: req.params.id,
        student: req.user.id
      });
      
      return res.json({
        success: true,
        data: {
          ...assignment.toObject(),
          submission
        }
      });
    }
    
    res.json({
      success: true,
      data: assignment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取作业详情失败',
      error: error.message
    });
  }
};

exports.updateAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: '作业不存在'
      });
    }
    
    if (req.userType === 'teacher' && assignment.teacher.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: '只能修改自己创建的作业'
      });
    }
    
    if (assignment.isPublished && req.body.questions) {
      return res.status(400).json({
        success: false,
        message: '已发布的作业不能修改题目'
      });
    }
    
    const updatedAssignment = await Assignment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    
    res.json({
      success: true,
      message: '作业更新成功',
      data: updatedAssignment
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: '更新作业失败',
      error: error.message
    });
  }
};

exports.deleteAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: '作业不存在'
      });
    }
    
    if (req.userType === 'teacher' && assignment.teacher.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: '只能删除自己创建的作业'
      });
    }
    
    if (assignment.isPublished) {
      return res.status(400).json({
        success: false,
        message: '已发布的作业不能删除'
      });
    }
    
    await Assignment.findByIdAndDelete(req.params.id);
    
    res.json({
      success: true,
      message: '作业删除成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '删除作业失败',
      error: error.message
    });
  }
};

exports.publishAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: '作业不存在'
      });
    }
    
    if (req.userType === 'teacher' && assignment.teacher.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: '只能发布自己创建的作业'
      });
    }
    
    assignment.isPublished = true;
    await assignment.save();
    
    res.json({
      success: true,
      message: '作业发布成功',
      data: assignment
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: '发布作业失败',
      error: error.message
    });
  }
};

exports.getSubmissions = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: '作业不存在'
      });
    }
    
    if (req.userType === 'teacher' && assignment.teacher.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: '只能查看自己作业的提交情况'
      });
    }
    
    const submissions = await Submission.find({ assignment: req.params.id })
      .populate('student', 'name studentId class')
      .populate('gradedBy', 'name')
      .sort({ submittedAt: -1 });
    
    res.json({
      success: true,
      data: submissions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取提交列表失败',
      error: error.message
    });
  }
};

exports.gradeSubmission = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { score, comments, rubricScores } = req.body;
    
    const submission = await Submission.findById(submissionId)
      .populate('assignment', 'totalPoints course type');
    
    if (!submission) {
      return res.status(404).json({
        success: false,
        message: '提交不存在'
      });
    }
    
    const assignment = submission.assignment;
    
    if (req.userType === 'teacher' && assignment.teacher.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: '只能批改自己布置的作业'
      });
    }
    
    const maxScore = assignment.totalPoints;
    
    // 防止除零错误和处理边界条件
    if (maxScore <= 0) {
      return res.status(400).json({
        success: false,
        message: '作业总分必须大于0才能计算成绩'
      });
    }
    
    if (score < 0) {
      return res.status(400).json({
        success: false,
        message: '分数不能为负数'
      });
    }
    
    if (score > maxScore) {
      return res.status(400).json({
        success: false,
        message: '分数不能超过总分'
      });
    }
    
    const percentage = Math.round((score / maxScore) * 100 * 100) / 100;
    
    let letterGrade = 'F';
    if (percentage >= 90) letterGrade = 'A';
    else if (percentage >= 80) letterGrade = 'B';
    else if (percentage >= 70) letterGrade = 'C';
    else if (percentage >= 60) letterGrade = 'D';
    
    submission.grade = {
      score,
      maxScore,
      percentage,
      letterGrade,
      comments,
      rubricScores
    };
    submission.status = 'graded';
    submission.gradedAt = new Date();
    submission.gradedBy = req.user.id;
    
    await submission.save();
    
    const existingGrade = await Grade.findOne({
      student: submission.student,
      assignment: assignment._id
    });
    
    if (existingGrade) {
      existingGrade.score = score;
      existingGrade.maxScore = maxScore;
      existingGrade.percentage = percentage;
      existingGrade.letterGrade = letterGrade;
      existingGrade.comments = comments;
      existingGrade.gradedBy = req.user.id;
      existingGrade.gradedAt = new Date();
      await existingGrade.save();
    } else {
      const grade = new Grade({
        student: submission.student,
        course: assignment.course,
        assignment: assignment._id,
        submission: submission._id,
        type: assignment.type,
        category: 'summative',
        score,
        maxScore,
        percentage,
        letterGrade,
        semester: req.body.semester || getCurrentSemester(),
        academicYear: req.body.academicYear || getCurrentAcademicYear(),
        gradedBy: req.user.id,
        comments
      });
      await grade.save();
    }
    
    res.json({
      success: true,
      message: '批改完成',
      data: submission
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: '批改失败',
      error: error.message
    });
  }
};