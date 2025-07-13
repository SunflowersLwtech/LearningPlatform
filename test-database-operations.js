#!/usr/bin/env node

/**
 * 数据库操作测试脚本
 * 测试所有数据库模型的CRUD操作
 */

const mongoose = require('mongoose');
require('dotenv').config();

// 导入所有模型
const Student = require('./src/models/Student');
const Staff = require('./src/models/Staff');
const Course = require('./src/models/Course');
const Class = require('./src/models/Class');
const Assignment = require('./src/models/Assignment');
const Discussion = require('./src/models/Discussion');
const Submission = require('./src/models/Submission');
const Grade = require('./src/models/Grade');
const Resource = require('./src/models/Resource');

// 测试结果统计
const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  errors: []
};

// 测试数据存储
const testData = {
  createdIds: {}
};

function logTest(name, passed, error = null) {
  testResults.total++;
  if (passed) {
    testResults.passed++;
    console.log(`✅ ${name}`);
  } else {
    testResults.failed++;
    console.log(`❌ ${name}: ${error}`);
    testResults.errors.push({ test: name, error });
  }
}

function logSection(title) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🗄️ ${title}`);
  console.log('='.repeat(60));
}

// 1. 数据库连接测试
async function testDatabaseConnection() {
  logSection('数据库连接和基础操作测试');
  
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    logTest('数据库连接', true);
    
    const db = mongoose.connection.db;
    
    // 测试数据库状态
    const stats = await db.stats();
    logTest('数据库状态查询', true, `数据大小: ${(stats.dataSize / 1024 / 1024).toFixed(2)}MB`);
    
    // 测试集合列表
    const collections = await db.listCollections().toArray();
    logTest('集合列表查询', collections.length > 0, `找到${collections.length}个集合`);
    
    // 测试索引
    const studentIndexes = await db.collection('students').indexes();
    logTest('索引查询', studentIndexes.length > 0, `学生集合有${studentIndexes.length}个索引`);
    
  } catch (error) {
    logTest('数据库连接', false, error.message);
    throw error;
  }
}

// 2. 学生模型测试
async function testStudentModel() {
  logSection('学生模型CRUD测试');
  
  try {
    // 创建测试学生
    const studentData = {
      studentId: `TEST${Date.now()}`,
      name: '测试学生',
      email: `test${Date.now()}@test.com`,
      password: 'test123456',
      grade: '大一',
      gender: '男',
      phone: '13800138000',
      enrollmentStatus: 'enrolled'
    };
    
    const student = new Student(studentData);
    await student.save();
    testData.createdIds.student = student._id;
    logTest('创建学生', true, `学生ID: ${student._id}`);
    
    // 读取学生
    const foundStudent = await Student.findById(student._id);
    logTest('查询学生', foundStudent !== null, `找到学生: ${foundStudent?.name}`);
    
    // 更新学生
    foundStudent.name = '更新后的测试学生';
    await foundStudent.save();
    logTest('更新学生', true, `新名称: ${foundStudent.name}`);
    
    // 测试学生查询方法
    const studentByStudentId = await Student.findOne({ studentId: studentData.studentId });
    logTest('按学号查询', studentByStudentId !== null);
    
    // 测试密码验证
    const isPasswordValid = await foundStudent.comparePassword('test123456');
    logTest('密码验证', isPasswordValid);
    
  } catch (error) {
    logTest('学生模型操作', false, error.message);
  }
}

// 3. 员工模型测试
async function testStaffModel() {
  logSection('员工模型CRUD测试');
  
  try {
    // 创建测试员工
    const staffData = {
      staffId: `STAFF${Date.now()}`,
      name: '测试教师',
      email: `teacher${Date.now()}@test.com`,
      password: 'test123456',
      role: 'teacher',
      department: '计算机科学系',
      phone: '13900139000'
    };
    
    const staff = new Staff(staffData);
    await staff.save();
    testData.createdIds.staff = staff._id;
    logTest('创建员工', true, `员工ID: ${staff._id}`);
    
    // 读取员工
    const foundStaff = await Staff.findById(staff._id);
    logTest('查询员工', foundStaff !== null);
    
    // 更新员工
    foundStaff.department = '更新后的部门';
    await foundStaff.save();
    logTest('更新员工', true);
    
    // 测试角色查询
    const teachers = await Staff.find({ role: 'teacher' });
    logTest('按角色查询员工', teachers.length > 0, `找到${teachers.length}个教师`);
    
  } catch (error) {
    logTest('员工模型操作', false, error.message);
  }
}

// 4. 课程模型测试
async function testCourseModel() {
  logSection('课程模型CRUD测试');
  
  try {
    // 创建测试课程
    const courseData = {
      name: `测试课程-${Date.now()}`,
      subject: '计算机科学',
      description: '这是一个测试课程',
      credits: 3,
      semester: '2024春季',
      teacher: testData.createdIds.staff
    };
    
    const course = new Course(courseData);
    await course.save();
    testData.createdIds.course = course._id;
    logTest('创建课程', true);
    
    // 读取课程并填充教师信息
    const foundCourse = await Course.findById(course._id).populate('teacher', 'name');
    logTest('查询课程并填充教师', foundCourse && foundCourse.teacher);
    
    // 更新课程
    foundCourse.description = '更新后的课程描述';
    await foundCourse.save();
    logTest('更新课程', true);
    
    // 测试课程搜索
    const courses = await Course.find({ subject: '计算机科学' });
    logTest('按学科查询课程', courses.length > 0);
    
  } catch (error) {
    logTest('课程模型操作', false, error.message);
  }
}

// 5. 班级模型测试
async function testClassModel() {
  logSection('班级模型CRUD测试');
  
  try {
    // 创建测试班级
    const classData = {
      name: `测试班级-${Date.now()}`,
      grade: '大一',
      capacity: 30,
      currentEnrollment: 0,
      teacher: testData.createdIds.staff
    };
    
    const classObj = new Class(classData);
    await classObj.save();
    testData.createdIds.class = classObj._id;
    logTest('创建班级', true);
    
    // 添加学生到班级
    if (testData.createdIds.student) {
      await Student.findByIdAndUpdate(testData.createdIds.student, { 
        class: classObj._id 
      });
      
      classObj.currentEnrollment = 1;
      await classObj.save();
      logTest('学生加入班级', true);
    }
    
    // 查询班级学生
    const studentsInClass = await Student.find({ class: classObj._id });
    logTest('查询班级学生', studentsInClass.length > 0);
    
  } catch (error) {
    logTest('班级模型操作', false, error.message);
  }
}

// 6. 作业模型测试
async function testAssignmentModel() {
  logSection('作业模型CRUD测试');
  
  try {
    // 创建测试作业
    const now = new Date();
    const assignmentData = {
      title: `测试作业-${Date.now()}`,
      description: '这是一个测试作业',
      course: testData.createdIds.course,
      teacher: testData.createdIds.staff,
      type: 'homework',
      startDate: now,
      dueDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      totalPoints: 100,
      attempts: 3,
      isPublished: true
    };
    
    const assignment = new Assignment(assignmentData);
    await assignment.save();
    testData.createdIds.assignment = assignment._id;
    logTest('创建作业', true);
    
    // 查询作业并填充关联信息
    const foundAssignment = await Assignment.findById(assignment._id)
      .populate('course', 'name')
      .populate('teacher', 'name');
    logTest('查询作业并填充关联', foundAssignment && foundAssignment.course && foundAssignment.teacher);
    
    // 测试作业状态更新
    foundAssignment.isPublished = false;
    await foundAssignment.save();
    logTest('更新作业状态', true);
    
    // 查询特定课程的作业
    const courseAssignments = await Assignment.find({ course: testData.createdIds.course });
    logTest('按课程查询作业', courseAssignments.length > 0);
    
  } catch (error) {
    logTest('作业模型操作', false, error.message);
  }
}

// 7. 讨论模型测试
async function testDiscussionModel() {
  logSection('讨论模型CRUD测试');
  
  try {
    // 创建测试讨论
    const discussionData = {
      title: `测试讨论-${Date.now()}`,
      creator: testData.createdIds.student,
      creatorModel: 'Student',
      type: 'general',
      posts: [{
        author: testData.createdIds.student,
        authorModel: 'Student',
        content: '这是第一个帖子',
        attachments: [{
          name: 'test.txt',
          url: '/uploads/test.txt',
          type: 'text/plain'
        }]
      }]
    };
    
    const discussion = new Discussion(discussionData);
    await discussion.save();
    testData.createdIds.discussion = discussion._id;
    logTest('创建讨论', true);
    
    // 添加回复
    discussion.posts[0].replies.push({
      author: testData.createdIds.staff,
      authorModel: 'Staff',
      content: '这是一个回复',
      attachments: []
    });
    
    discussion.lastActivity = new Date();
    await discussion.save();
    logTest('添加讨论回复', true);
    
    // 查询讨论并填充作者信息
    const foundDiscussion = await Discussion.findById(discussion._id)
      .populate('creator', 'name');
    logTest('查询讨论并填充作者', foundDiscussion && foundDiscussion.creator);
    
    // 测试讨论搜索
    const discussions = await Discussion.find({ type: 'general' });
    logTest('按类型查询讨论', discussions.length > 0);
    
  } catch (error) {
    logTest('讨论模型操作', false, error.message);
  }
}

// 8. 提交模型测试
async function testSubmissionModel() {
  logSection('提交模型CRUD测试');
  
  try {
    // 创建测试提交
    const submissionData = {
      assignment: testData.createdIds.assignment,
      student: testData.createdIds.student,
      content: '这是我的作业提交',
      attachments: [{
        name: 'homework.pdf',
        url: '/uploads/homework.pdf',
        type: 'application/pdf'
      }],
      submittedAt: new Date(),
      status: 'submitted'
    };
    
    const submission = new Submission(submissionData);
    await submission.save();
    testData.createdIds.submission = submission._id;
    logTest('创建提交', true);
    
    // 查询提交并填充关联信息
    const foundSubmission = await Submission.findById(submission._id)
      .populate('assignment', 'title')
      .populate('student', 'name');
    logTest('查询提交并填充关联', foundSubmission && foundSubmission.assignment && foundSubmission.student);
    
    // 更新提交状态
    foundSubmission.status = 'graded';
    foundSubmission.score = 85;
    foundSubmission.feedback = '很好的作业！';
    foundSubmission.gradedAt = new Date();
    foundSubmission.gradedBy = testData.createdIds.staff;
    await foundSubmission.save();
    logTest('更新提交评分', true);
    
  } catch (error) {
    logTest('提交模型操作', false, error.message);
  }
}

// 9. 成绩模型测试
async function testGradeModel() {
  logSection('成绩模型CRUD测试');
  
  try {
    // 创建测试成绩
    const gradeData = {
      student: testData.createdIds.student,
      course: testData.createdIds.course,
      assignment: testData.createdIds.assignment,
      score: 85,
      maxScore: 100,
      gradedBy: testData.createdIds.staff,
      gradedAt: new Date(),
      comments: '表现良好'
    };
    
    const grade = new Grade(gradeData);
    await grade.save();
    testData.createdIds.grade = grade._id;
    logTest('创建成绩', true);
    
    // 查询学生的所有成绩
    const studentGrades = await Grade.find({ student: testData.createdIds.student })
      .populate('course', 'name')
      .populate('assignment', 'title');
    logTest('查询学生成绩', studentGrades.length > 0);
    
    // 计算平均分
    const avgScore = await Grade.aggregate([
      { $match: { student: testData.createdIds.student } },
      { $group: { _id: null, avgScore: { $avg: '$score' } } }
    ]);
    logTest('计算平均成绩', avgScore.length > 0, `平均分: ${avgScore[0]?.avgScore || 0}`);
    
  } catch (error) {
    logTest('成绩模型操作', false, error.message);
  }
}

// 10. 资源模型测试
async function testResourceModel() {
  logSection('资源模型CRUD测试');
  
  try {
    // 创建测试资源
    const resourceData = {
      title: `测试资源-${Date.now()}`,
      description: '这是一个测试学习资源',
      type: 'document',
      url: '/uploads/test-resource.pdf',
      course: testData.createdIds.course,
      uploadedBy: testData.createdIds.staff,
      size: 1024000,
      downloadCount: 0
    };
    
    const resource = new Resource(resourceData);
    await resource.save();
    testData.createdIds.resource = resource._id;
    logTest('创建资源', true);
    
    // 更新下载次数
    resource.downloadCount += 1;
    await resource.save();
    logTest('更新下载次数', true);
    
    // 按课程查询资源
    const courseResources = await Resource.find({ course: testData.createdIds.course });
    logTest('按课程查询资源', courseResources.length > 0);
    
  } catch (error) {
    logTest('资源模型操作', false, error.message);
  }
}

// 11. 数据关联完整性测试
async function testDataIntegrity() {
  logSection('数据关联完整性测试');
  
  try {
    // 测试学生-班级关联
    const student = await Student.findById(testData.createdIds.student).populate('class');
    logTest('学生-班级关联', student && student.class, `班级: ${student?.class?.name}`);
    
    // 测试课程-教师关联
    const course = await Course.findById(testData.createdIds.course).populate('teacher');
    logTest('课程-教师关联', course && course.teacher, `教师: ${course?.teacher?.name}`);
    
    // 测试作业-课程关联
    const assignment = await Assignment.findById(testData.createdIds.assignment).populate('course');
    logTest('作业-课程关联', assignment && assignment.course, `课程: ${assignment?.course?.name}`);
    
    // 测试提交-作业关联
    const submission = await Submission.findById(testData.createdIds.submission).populate('assignment');
    logTest('提交-作业关联', submission && submission.assignment, `作业: ${submission?.assignment?.title}`);
    
    // 测试成绩-学生关联
    const grade = await Grade.findById(testData.createdIds.grade).populate('student');
    logTest('成绩-学生关联', grade && grade.student, `学生: ${grade?.student?.name}`);
    
  } catch (error) {
    logTest('数据关联完整性', false, error.message);
  }
}

// 清理测试数据
async function cleanupTestData() {
  logSection('清理测试数据');
  
  const cleanupTasks = [
    { model: Grade, id: testData.createdIds.grade, name: '成绩' },
    { model: Resource, id: testData.createdIds.resource, name: '资源' },
    { model: Submission, id: testData.createdIds.submission, name: '提交' },
    { model: Discussion, id: testData.createdIds.discussion, name: '讨论' },
    { model: Assignment, id: testData.createdIds.assignment, name: '作业' },
    { model: Class, id: testData.createdIds.class, name: '班级' },
    { model: Course, id: testData.createdIds.course, name: '课程' },
    { model: Staff, id: testData.createdIds.staff, name: '员工' },
    { model: Student, id: testData.createdIds.student, name: '学生' }
  ];
  
  for (const task of cleanupTasks) {
    try {
      if (task.id) {
        await task.model.findByIdAndDelete(task.id);
        logTest(`删除测试${task.name}`, true);
      }
    } catch (error) {
      logTest(`删除测试${task.name}`, false, error.message);
    }
  }
}

// 显示测试结果
function showTestResults() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 数据库测试结果统计');
  console.log('='.repeat(60));
  
  const passRate = testResults.total > 0 ? (testResults.passed / testResults.total * 100).toFixed(1) : 0;
  
  console.log(`总测试数: ${testResults.total}`);
  console.log(`通过数: ${testResults.passed}`);
  console.log(`失败数: ${testResults.failed}`);
  console.log(`通过率: ${passRate}%`);
  
  if (testResults.failed > 0) {
    console.log('\n❌ 失败的测试:');
    testResults.errors.forEach((error, index) => {
      console.log(`   ${index + 1}. ${error.test}: ${error.error}`);
    });
  }
  
  if (passRate >= 90) {
    console.log('\n🎉 数据库测试结果优秀！所有模型功能正常');
  } else if (passRate >= 70) {
    console.log('\n✅ 数据库测试结果良好，有少量问题需要关注');
  } else {
    console.log('\n⚠️ 数据库测试结果需要改进，存在较多问题');
  }
}

// 主测试函数
async function runDatabaseTests() {
  console.log('🗄️ 数据库操作全面测试开始');
  console.log(`测试时间: ${new Date().toLocaleString()}`);
  console.log(`数据库: ${process.env.MONGODB_URI.split('/').pop()?.split('?')[0]}`);
  
  try {
    await testDatabaseConnection();
    await testStudentModel();
    await testStaffModel();
    await testCourseModel();
    await testClassModel();
    await testAssignmentModel();
    await testDiscussionModel();
    await testSubmissionModel();
    await testGradeModel();
    await testResourceModel();
    await testDataIntegrity();
    
  } catch (error) {
    console.error('❌ 数据库测试过程中发生严重错误:', error.message);
  } finally {
    await cleanupTestData();
    
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log('\n📴 数据库连接已关闭');
    }
    
    showTestResults();
  }
}

// 运行测试
if (require.main === module) {
  runDatabaseTests().catch(console.error);
}

module.exports = {
  runDatabaseTests,
  testResults
};
