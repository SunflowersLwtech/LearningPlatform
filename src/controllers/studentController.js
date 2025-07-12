const Student = require('../models/Student');
const Class = require('../models/Class');

exports.createStudent = async (req, res) => {
  try {
    const student = new Student(req.body);
    await student.save();
    
    await Class.findByIdAndUpdate(
      student.class,
      { $inc: { currentEnrollment: 1 } }
    );
    
    res.status(201).json({
      success: true,
      message: '学生信息创建成功',
      data: student
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: '创建学生信息失败',
      error: error.message
    });
  }
};

exports.getAllStudents = async (req, res) => {
  try {
    const { page = 1, limit = 20, grade, class: classId, search } = req.query;
    
    let filter = {};
    if (grade) filter.grade = grade;
    if (classId) filter.class = classId;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { studentId: { $regex: search, $options: 'i' } }
      ];
    }
    
    const students = await Student.find(filter)
      .populate('class', 'name grade')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });
    
    const total = await Student.countDocuments(filter);
    
    res.json({
      success: true,
      data: students,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取学生列表失败',
      error: error.message
    });
  }
};

exports.getStudentById = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id)
      .populate('class', 'name grade headTeacher')
      .populate('statusHistory.operator', 'name');
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: '学生不存在'
      });
    }
    
    res.json({
      success: true,
      data: student
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取学生信息失败',
      error: error.message
    });
  }
};

exports.updateStudent = async (req, res) => {
  try {
    const student = await Student.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: '学生不存在'
      });
    }
    
    res.json({
      success: true,
      message: '学生信息更新成功',
      data: student
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: '更新学生信息失败',
      error: error.message
    });
  }
};

exports.updateEnrollmentStatus = async (req, res) => {
  try {
    const { status, reason } = req.body;
    const operatorId = req.user.id;
    
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: '学生不存在'
      });
    }
    
    student.statusHistory.push({
      status: student.enrollmentStatus,
      date: new Date(),
      reason,
      operator: operatorId
    });
    
    student.enrollmentStatus = status;
    await student.save();
    
    res.json({
      success: true,
      message: '学籍状态更新成功',
      data: student
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: '更新学籍状态失败',
      error: error.message
    });
  }
};

exports.deleteStudent = async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: '学生不存在'
      });
    }
    
    await Class.findByIdAndUpdate(
      student.class,
      { $inc: { currentEnrollment: -1 } }
    );
    
    res.json({
      success: true,
      message: '学生信息删除成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '删除学生信息失败',
      error: error.message
    });
  }
};