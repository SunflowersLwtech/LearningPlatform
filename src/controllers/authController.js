const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Staff = require('../models/Staff');
const Student = require('../models/Student');

const generateToken = (id, userType) => {
  return jwt.sign({ id, userType }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d'
  });
};

exports.login = async (req, res) => {
  try {
    const { identifier, password, userType } = req.body;
    
    if (!identifier || !password || !userType) {
      return res.status(400).json({
        success: false,
        message: '请提供用户名/学号、密码和用户类型'
      });
    }
    
    let user;
    let identifierField;
    
    if (userType === 'staff') {
      identifierField = identifier.includes('@') ? 'email' : 'staffId';
      user = await Staff.findOne({ [identifierField]: identifier }).select('+password');
    } else if (userType === 'student') {
      user = await Student.findOne({ studentId: identifier });
      if (!user) {
        return res.status(401).json({
          success: false,
          message: '学生账号不存在或密码错误'
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        message: '无效的用户类型'
      });
    }
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '账号不存在或密码错误'
      });
    }
    
    let isPasswordValid = false;
    if (userType === 'staff') {
      isPasswordValid = await bcrypt.compare(password, user.password);
    } else {
      isPasswordValid = password === user.studentId;
    }
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: '账号不存在或密码错误'
      });
    }
    
    if (userType === 'staff' && !user.isActive) {
      return res.status(401).json({
        success: false,
        message: '账号已被停用'
      });
    }
    
    const token = generateToken(user._id, userType);
    
    user.password = undefined;
    
    res.json({
      success: true,
      message: '登录成功',
      token,
      user: {
        id: user._id,
        name: user.name,
        role: userType === 'staff' ? user.role : 'student',
        ...(userType === 'staff' ? {
          staffId: user.staffId,
          email: user.email,
          department: user.department,
          permissions: user.permissions
        } : {
          studentId: user.studentId,
          grade: user.grade,
          class: user.class
        })
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '登录失败',
      error: error.message
    });
  }
};

exports.register = async (req, res) => {
  try {
    const { userType } = req.body;
    
    if (userType === 'staff') {
      const { name, email, password, staffId, role, department } = req.body;
      
      const existingStaff = await Staff.findOne({
        $or: [{ email }, { staffId }]
      });
      
      if (existingStaff) {
        return res.status(400).json({
          success: false,
          message: '邮箱或工号已存在'
        });
      }
      
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      
      const staff = new Staff({
        name,
        email,
        password: hashedPassword,
        staffId,
        role,
        department
      });
      
      await staff.save();
      
      const token = generateToken(staff._id, 'staff');
      
      res.status(201).json({
        success: true,
        message: '教职工注册成功',
        token,
        user: {
          id: staff._id,
          name: staff.name,
          staffId: staff.staffId,
          email: staff.email,
          role: staff.role,
          department: staff.department
        }
      });
    } else {
      return res.status(400).json({
        success: false,
        message: '学生账号需要管理员创建'
      });
    }
  } catch (error) {
    res.status(400).json({
      success: false,
      message: '注册失败',
      error: error.message
    });
  }
};

exports.getProfile = async (req, res) => {
  try {
    let user;
    if (req.userType === 'staff') {
      user = await Staff.findById(req.user.id)
        .populate('classes', 'name grade')
        .select('-password');
    } else {
      user = await Student.findById(req.user.id)
        .populate('class', 'name grade headTeacher');
    }
    
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取用户信息失败',
      error: error.message
    });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const allowedUpdates = req.userType === 'staff' 
      ? ['name', 'email', 'contactInfo', 'qualifications']
      : ['contactInfo'];
    
    const updates = Object.keys(req.body);
    const isValidOperation = updates.every(update => allowedUpdates.includes(update));
    
    if (!isValidOperation) {
      return res.status(400).json({
        success: false,
        message: '包含不允许更新的字段'
      });
    }
    
    let user;
    if (req.userType === 'staff') {
      user = await Staff.findByIdAndUpdate(
        req.user.id,
        req.body,
        { new: true, runValidators: true }
      ).select('-password');
    } else {
      user = await Student.findByIdAndUpdate(
        req.user.id,
        req.body,
        { new: true, runValidators: true }
      );
    }
    
    res.json({
      success: true,
      message: '个人信息更新成功',
      data: user
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: '更新个人信息失败',
      error: error.message
    });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (req.userType !== 'staff') {
      return res.status(400).json({
        success: false,
        message: '学生不能修改密码'
      });
    }
    
    const user = await Staff.findById(req.user.id).select('+password');
    
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: '当前密码错误'
      });
    }
    
    const salt = await bcrypt.genSalt(10);
    const hashedNewPassword = await bcrypt.hash(newPassword, salt);
    
    user.password = hashedNewPassword;
    await user.save();
    
    res.json({
      success: true,
      message: '密码修改成功'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: '修改密码失败',
      error: error.message
    });
  }
};

exports.logout = async (req, res) => {
  res.json({
    success: true,
    message: '退出登录成功'
  });
};