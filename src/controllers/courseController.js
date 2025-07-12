const Course = require('../models/Course');
const Class = require('../models/Class');
const Student = require('../models/Student');

exports.createCourse = async (req, res) => {
  try {
    const course = new Course({
      ...req.body,
      teacher: req.user.id
    });
    await course.save();
    
    res.status(201).json({
      success: true,
      message: '课程创建成功',
      data: course
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: '创建课程失败',
      error: error.message
    });
  }
};

exports.getAllCourses = async (req, res) => {
  try {
    const { subject, grade, semester, academicYear, teacher } = req.query;
    
    let filter = { isActive: true };
    if (subject) filter.subject = subject;
    if (grade) filter.grade = grade;
    if (semester) filter.semester = semester;
    if (academicYear) filter.academicYear = academicYear;
    if (teacher) filter.teacher = teacher;
    
    if (req.userType === 'teacher' && !req.user.permissions?.canAccessReports) {
      filter.teacher = req.user.id;
    }
    
    const courses = await Course.find(filter)
      .populate('teacher', 'name staffId')
      .populate('assistants', 'name staffId')
      .populate('enrolledClasses', 'name grade')
      .sort({ academicYear: -1, semester: 1, name: 1 });
    
    res.json({
      success: true,
      data: courses
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取课程列表失败',
      error: error.message
    });
  }
};

exports.getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('teacher', 'name staffId contactInfo')
      .populate('assistants', 'name staffId')
      .populate('enrolledClasses', 'name grade currentEnrollment');
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: '课程不存在'
      });
    }
    
    res.json({
      success: true,
      data: course
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取课程信息失败',
      error: error.message
    });
  }
};

exports.updateCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: '课程不存在'
      });
    }
    
    if (req.userType === 'teacher' && course.teacher.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: '只能修改自己的课程'
      });
    }
    
    const updatedCourse = await Course.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    res.json({
      success: true,
      message: '课程信息更新成功',
      data: updatedCourse
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: '更新课程信息失败',
      error: error.message
    });
  }
};

exports.deleteCourse = async (req, res) => {
  try {
    const course = await Course.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: '课程不存在'
      });
    }
    
    res.json({
      success: true,
      message: '课程删除成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '删除课程失败',
      error: error.message
    });
  }
};

exports.enrollClass = async (req, res) => {
  try {
    const { classIds } = req.body;
    const courseId = req.params.id;
    
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: '课程不存在'
      });
    }
    
    const validClasses = await Class.find({
      _id: { $in: classIds },
      isActive: true
    });
    
    if (validClasses.length !== classIds.length) {
      return res.status(400).json({
        success: false,
        message: '部分班级不存在或已停用'
      });
    }
    
    course.enrolledClasses = [...new Set([...course.enrolledClasses, ...classIds])];
    await course.save();
    
    res.json({
      success: true,
      message: '班级选课成功',
      data: course
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: '班级选课失败',
      error: error.message
    });
  }
};

exports.getCourseStudents = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('enrolledClasses');
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: '课程不存在'
      });
    }
    
    const classIds = course.enrolledClasses.map(cls => cls._id);
    const students = await Student.find({
      class: { $in: classIds },
      enrollmentStatus: 'enrolled'
    })
    .populate('class', 'name grade')
    .sort({ class: 1, name: 1 });
    
    res.json({
      success: true,
      data: {
        course: {
          name: course.name,
          subject: course.subject,
          grade: course.grade
        },
        enrolledClasses: course.enrolledClasses,
        students
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取课程学生列表失败',
      error: error.message
    });
  }
};