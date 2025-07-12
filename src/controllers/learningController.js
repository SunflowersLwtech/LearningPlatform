const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const Discussion = require('../models/Discussion');
const Resource = require('../models/Resource');
const { uploadMiddleware } = require('../middleware/upload');

exports.getStudentDashboard = async (req, res) => {
  try {
    const studentId = req.user.id;
    
    const pendingAssignments = await Assignment.find({
      'assignedTo.students': studentId,
      dueDate: { $gte: new Date() },
      isPublished: true
    })
    .populate('course', 'name subject')
    .sort({ dueDate: 1 })
    .limit(5);
    
    const recentSubmissions = await Submission.find({
      student: studentId,
      status: { $in: ['graded', 'returned'] }
    })
    .populate('assignment', 'title type')
    .sort({ gradedAt: -1 })
    .limit(5);
    
    const activeDiscussions = await Discussion.find({
      $or: [
        { class: req.user.class },
        { 'course': { $in: req.user.enrolledCourses || [] } }
      ],
      isActive: true
    })
    .sort({ lastActivity: -1 })
    .limit(5);
    
    res.json({
      success: true,
      data: {
        pendingAssignments,
        recentSubmissions,
        activeDiscussions
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取学生面板失败',
      error: error.message
    });
  }
};

exports.getAssignments = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { status, course, page = 1, limit = 10 } = req.query;
    
    let filter = {
      'assignedTo.students': studentId,
      isPublished: true
    };
    
    if (course) filter.course = course;
    if (status === 'pending') {
      filter.dueDate = { $gte: new Date() };
    } else if (status === 'overdue') {
      filter.dueDate = { $lt: new Date() };
    }
    
    const assignments = await Assignment.find(filter)
      .populate('course', 'name subject')
      .sort({ dueDate: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const assignmentsWithSubmissions = await Promise.all(
      assignments.map(async (assignment) => {
        const submission = await Submission.findOne({
          assignment: assignment._id,
          student: studentId
        });
        
        return {
          ...assignment.toObject(),
          submission: submission || null
        };
      })
    );
    
    res.json({
      success: true,
      data: assignmentsWithSubmissions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取作业列表失败',
      error: error.message
    });
  }
};

exports.submitAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const studentId = req.user.id;
    const { answers, textSubmission, attachments } = req.body;
    
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: '作业不存在'
      });
    }
    
    if (new Date() > assignment.dueDate) {
      if (!assignment.lateSubmission.allowed) {
        return res.status(400).json({
          success: false,
          message: '作业已过期，不允许提交'
        });
      }
    }
    
    let submission = await Submission.findOne({
      assignment: assignmentId,
      student: studentId
    });
    
    if (submission && submission.attemptNumber >= assignment.attempts) {
      return res.status(400).json({
        success: false,
        message: '已达到最大提交次数'
      });
    }
    
    const isLate = new Date() > assignment.dueDate;
    
    if (submission) {
      submission.attemptNumber += 1;
      submission.answers = answers;
      submission.textSubmission = textSubmission;
      submission.attachments = attachments;
      submission.submittedAt = new Date();
      submission.isLate = isLate;
      submission.status = 'submitted';
    } else {
      submission = new Submission({
        assignment: assignmentId,
        student: studentId,
        answers,
        textSubmission,
        attachments,
        isLate,
        status: 'submitted'
      });
    }
    
    await submission.save();
    
    res.json({
      success: true,
      message: '作业提交成功',
      data: submission
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: '提交作业失败',
      error: error.message
    });
  }
};

exports.getResources = async (req, res) => {
  try {
    const { subject, grade, type, search, page = 1, limit = 12 } = req.query;
    
    let filter = { 
      isActive: true,
      accessLevel: { $in: ['public', 'school'] }
    };
    
    if (subject) filter.subject = subject;
    if (grade) filter.grade = grade;
    if (type) filter.type = type;
    if (search) {
      filter.$text = { $search: search };
    }
    
    const resources = await Resource.find(filter)
      .populate('uploadedBy', 'name')
      .sort({ featured: -1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Resource.countDocuments(filter);
    
    res.json({
      success: true,
      data: resources,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取资源失败',
      error: error.message
    });
  }
};

exports.downloadResource = async (req, res) => {
  try {
    const resourceId = req.params.id;
    
    const resource = await Resource.findById(resourceId);
    if (!resource) {
      return res.status(404).json({
        success: false,
        message: '资源不存在'
      });
    }
    
    // 检查文件是否存在
    const path = require('path');
    const fs = require('fs');
    
    if (resource.fileInfo && resource.fileInfo.filePath) {
      const filePath = path.resolve(resource.fileInfo.filePath);
      
      if (fs.existsSync(filePath)) {
        // 增加下载计数
        resource.downloads += 1;
        await resource.save();
        
        // 设置响应头
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(resource.fileInfo.originalName || resource.title)}"`);
        res.setHeader('Content-Type', resource.fileInfo.mimeType || 'application/octet-stream');
        
        // 创建文件流并发送
        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);
        
        return;
      }
    }
    
    // 如果文件不存在或没有文件信息，返回错误
    return res.status(404).json({
      success: false,
      message: '文件不存在或已被删除'
    });
    
  } catch (error) {
    console.error('下载资源失败:', error);
    res.status(500).json({
      success: false,
      message: '下载资源失败',
      error: error.message
    });
  }
};

exports.getDiscussionById = async (req, res) => {
  try {
    const discussionId = req.params.id;
    
    const discussion = await Discussion.findById(discussionId)
      .populate('creator', 'name')
      .populate('course', 'name')
      .populate('class', 'name')
      .populate({
        path: 'posts.author',
        select: 'name'
      })
      .populate({
        path: 'posts.replies.author',
        select: 'name'
      });
    
    if (!discussion) {
      return res.status(404).json({
        success: false,
        message: '讨论不存在'
      });
    }
    
    res.json({
      success: true,
      data: discussion
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取讨论详情失败',
      error: error.message
    });
  }
};

exports.getDiscussions = async (req, res) => {
  try {
    const { course, class: classId, type, page = 1, limit = 10 } = req.query;
    
    let filter = { 
      isActive: true,
      isLocked: false
    };
    
    if (course) filter.course = course;
    if (classId) filter.class = classId;
    if (type) filter.type = type;
    
    const discussions = await Discussion.find(filter)
      .populate('creator', 'name')
      .populate('course', 'name')
      .populate('class', 'name')
      .sort({ lastActivity: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    res.json({
      success: true,
      data: discussions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取讨论列表失败',
      error: error.message
    });
  }
};

exports.participateInDiscussion = async (req, res) => {
  try {
    const { discussionId } = req.params;
    const { content, attachments, replyTo } = req.body;
    const userId = req.user.id;
    const userModel = req.user.role ? 'Staff' : 'Student';
    
    const discussion = await Discussion.findById(discussionId);
    if (!discussion) {
      return res.status(404).json({
        success: false,
        message: '讨论不存在'
      });
    }
    
    if (discussion.isLocked) {
      return res.status(400).json({
        success: false,
        message: '讨论已锁定'
      });
    }
    
    if (replyTo) {
      const post = discussion.posts.id(replyTo);
      if (post) {
        post.replies.push({
          author: userId,
          authorModel: userModel,
          content,
          date: new Date()
        });
      }
    } else {
      discussion.posts.push({
        author: userId,
        authorModel: userModel,
        content,
        attachments: attachments || []
      });
    }
    
    discussion.lastActivity = new Date();
    await discussion.save();
    
    res.json({
      success: true,
      message: '参与讨论成功',
      data: discussion
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: '参与讨论失败',
      error: error.message
    });
  }
};

exports.uploadResource = async (req, res) => {
  try {
    const { title, description, subject, grade, type, accessLevel, featured } = req.body;
    const uploadedBy = req.user.id;
    const userModel = req.user.role ? 'Staff' : 'Student';
    
    // 验证必填字段
    if (!title) {
      return res.status(400).json({
        success: false,
        message: '资源标题不能为空'
      });
    }
    
    let fileInfo = {};
    if (req.file) {
      fileInfo = {
        originalName: req.file.originalname,
        fileName: req.file.filename,
        filePath: req.file.path,
        fileSize: req.file.size,
        mimeType: req.file.mimetype
      };
    }
    
    const resource = new Resource({
      title,
      description: description || '',
      subject: subject || 'general',
      grade: grade || 'all',
      type: type || 'document',
      accessLevel: accessLevel || 'public',
      featured: featured === 'true' || featured === true,
      uploadedBy,
      uploaderModel: userModel,
      fileInfo,
      isActive: true,
      downloads: 0,
      views: 0
    });
    
    await resource.save();
    
    res.status(201).json({
      success: true,
      message: '资源上传成功',
      data: resource
    });
  } catch (error) {
    console.error('资源上传失败:', error);
    res.status(400).json({
      success: false,
      message: '资源上传失败',
      error: error.message
    });
  }
};

exports.createDiscussion = async (req, res) => {
  try {
    const { title, content, type, course, class: classId } = req.body;
    const creator = req.user.id;
    const creatorModel = req.user.role ? 'Staff' : 'Student';
    
    // 验证必填字段
    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: '标题和内容不能为空'
      });
    }
    
    const discussion = new Discussion({
      title,
      content,
      type: type || 'general',
      creator,
      creatorModel,
      course: course || null,
      class: classId || null,
      posts: [],
      isActive: true,
      isLocked: false,
      isPinned: false,
      lastActivity: new Date()
    });
    
    await discussion.save();
    
    // 填充creator信息用于返回
    await discussion.populate('creator', 'name');
    if (discussion.course) {
      await discussion.populate('course', 'name');
    }
    if (discussion.class) {
      await discussion.populate('class', 'name');
    }
    
    res.status(201).json({
      success: true,
      message: '讨论创建成功',
      data: discussion
    });
  } catch (error) {
    console.error('创建讨论失败:', error);
    res.status(400).json({
      success: false,
      message: '创建讨论失败',
      error: error.message
    });
  }
};