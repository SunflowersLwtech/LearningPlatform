const jwt = require('jsonwebtoken');
const Staff = require('../models/Staff');
const Student = require('../models/Student');

exports.authenticate = async (req, res, next) => {
  try {
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: '访问被拒绝，未提供认证令牌'
      });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    let user;
    if (decoded.userType === 'staff') {
      user = await Staff.findById(decoded.id).select('-password');
    } else if (decoded.userType === 'student') {
      user = await Student.findById(decoded.id);
    }
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '令牌无效，用户不存在'
      });
    }
    
    req.user = user;
    req.userType = decoded.userType;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: '令牌无效',
      error: error.message
    });
  }
};

exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (req.userType === 'student') {
      if (!roles.includes('student')) {
        return res.status(403).json({
          success: false,
          message: '权限不足'
        });
      }
    } else if (req.userType === 'staff') {
      if (!roles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: `角色 ${req.user.role} 无权限访问此资源`
        });
      }
    } else {
      return res.status(403).json({
        success: false,
        message: '未知用户类型'
      });
    }
    
    next();
  };
};

exports.checkPermission = (permission) => {
  return (req, res, next) => {
    if (req.userType !== 'staff') {
      return res.status(403).json({
        success: false,
        message: '只有教职工可以执行此操作'
      });
    }
    
    if (!req.user.permissions[permission]) {
      return res.status(403).json({
        success: false,
        message: `缺少权限: ${permission}`
      });
    }
    
    next();
  };
};

exports.requireOwnResource = (resourceType) => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params.id;
      
      if (req.userType === 'student') {
        if (resourceType === 'student' && req.user._id.toString() !== resourceId) {
          return res.status(403).json({
            success: false,
            message: '只能访问自己的资源'
          });
        }
      }
      
      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: '权限检查失败',
        error: error.message
      });
    }
  };
};