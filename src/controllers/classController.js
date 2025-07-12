const Class = require('../models/Class');
const Student = require('../models/Student');
const Staff = require('../models/Staff');

exports.createClass = async (req, res) => {
  try {
    const newClass = new Class(req.body);
    await newClass.save();
    
    res.status(201).json({
      success: true,
      message: '班级创建成功',
      data: newClass
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: '创建班级失败',
      error: error.message
    });
  }
};

exports.getAllClasses = async (req, res) => {
  try {
    const { grade, academicYear, classType } = req.query;
    
    let filter = { isActive: true };
    if (grade) filter.grade = grade;
    if (academicYear) filter.academicYear = academicYear;
    if (classType) filter.classType = classType;
    
    const classes = await Class.find(filter)
      .populate('headTeacher', 'name staffId')
      .populate('subjectTeachers.teacher', 'name staffId')
      .sort({ grade: 1, name: 1 });
    
    res.json({
      success: true,
      data: classes
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取班级列表失败',
      error: error.message
    });
  }
};

exports.getClassById = async (req, res) => {
  try {
    const classData = await Class.findById(req.params.id)
      .populate('headTeacher', 'name staffId contactInfo')
      .populate('subjectTeachers.teacher', 'name staffId subjects');
    
    if (!classData) {
      return res.status(404).json({
        success: false,
        message: '班级不存在'
      });
    }
    
    const students = await Student.find({ class: req.params.id })
      .select('studentId name gender enrollmentStatus')
      .sort({ name: 1 });
    
    res.json({
      success: true,
      data: {
        ...classData.toObject(),
        students
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取班级信息失败',
      error: error.message
    });
  }
};

exports.updateClass = async (req, res) => {
  try {
    const updatedClass = await Class.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!updatedClass) {
      return res.status(404).json({
        success: false,
        message: '班级不存在'
      });
    }
    
    res.json({
      success: true,
      message: '班级信息更新成功',
      data: updatedClass
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: '更新班级信息失败',
      error: error.message
    });
  }
};

exports.updateSchedule = async (req, res) => {
  try {
    const { schedule } = req.body;
    
    const updatedClass = await Class.findByIdAndUpdate(
      req.params.id,
      { schedule },
      { new: true, runValidators: true }
    ).populate('schedule.periods.teacher', 'name staffId');
    
    if (!updatedClass) {
      return res.status(404).json({
        success: false,
        message: '班级不存在'
      });
    }
    
    res.json({
      success: true,
      message: '课表更新成功',
      data: updatedClass
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: '更新课表失败',
      error: error.message
    });
  }
};

exports.assignTeacher = async (req, res) => {
  try {
    const { teacherId, subject, role } = req.body;
    const classId = req.params.id;
    
    const teacher = await Staff.findById(teacherId);
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: '教师不存在'
      });
    }
    
    const classData = await Class.findById(classId);
    if (!classData) {
      return res.status(404).json({
        success: false,
        message: '班级不存在'
      });
    }
    
    if (role === 'head_teacher') {
      classData.headTeacher = teacherId;
    } else if (role === 'subject_teacher') {
      const existingIndex = classData.subjectTeachers.findIndex(
        st => st.subject === subject
      );
      
      if (existingIndex > -1) {
        classData.subjectTeachers[existingIndex].teacher = teacherId;
      } else {
        classData.subjectTeachers.push({
          teacher: teacherId,
          subject
        });
      }
    }
    
    await classData.save();
    
    if (!teacher.classes.includes(classId)) {
      teacher.classes.push(classId);
      await teacher.save();
    }
    
    res.json({
      success: true,
      message: '教师分配成功',
      data: classData
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: '分配教师失败',
      error: error.message
    });
  }
};

exports.getClassSchedule = async (req, res) => {
  try {
    const classData = await Class.findById(req.params.id)
      .populate('schedule.periods.teacher', 'name staffId')
      .select('schedule name grade');
    
    if (!classData) {
      return res.status(404).json({
        success: false,
        message: '班级不存在'
      });
    }
    
    res.json({
      success: true,
      data: classData.schedule
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取课表失败',
      error: error.message
    });
  }
};