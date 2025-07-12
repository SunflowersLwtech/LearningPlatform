const { Server } = require('socket.io');

let io;

const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    console.log('用户已连接:', socket.id);

    socket.on('join-room', (data) => {
      const { userId, userType, classId } = data;
      
      socket.join(`user_${userId}`);
      
      if (userType === 'staff') {
        socket.join('staff');
        if (classId) {
          socket.join(`class_${classId}`);
        }
      } else if (userType === 'student') {
        socket.join('students');
        if (classId) {
          socket.join(`class_${classId}`);
        }
      }
      
      console.log(`用户 ${userId} (${userType}) 加入房间`);
    });

    socket.on('disconnect', () => {
      console.log('用户已断开连接:', socket.id);
    });
  });

  return io;
};

const notifications = {
  // 发送给特定用户
  toUser(userId, message, type = 'info') {
    if (io) {
      io.to(`user_${userId}`).emit('notification', {
        type,
        message,
        timestamp: new Date().toISOString()
      });
    }
  },

  // 发送给班级
  toClass(classId, message, type = 'info') {
    if (io) {
      io.to(`class_${classId}`).emit('notification', {
        type,
        message,
        timestamp: new Date().toISOString()
      });
    }
  },

  // 发送给所有教职工
  toStaff(message, type = 'info') {
    if (io) {
      io.to('staff').emit('notification', {
        type,
        message,
        timestamp: new Date().toISOString()
      });
    }
  },

  // 发送给所有学生
  toStudents(message, type = 'info') {
    if (io) {
      io.to('students').emit('notification', {
        type,
        message,
        timestamp: new Date().toISOString()
      });
    }
  },

  // 发送给所有用户
  toAll(message, type = 'info') {
    if (io) {
      io.emit('notification', {
        type,
        message,
        timestamp: new Date().toISOString()
      });
    }
  },

  // 作业相关通知
  assignment: {
    created(assignment, classIds) {
      classIds.forEach(classId => {
        notifications.toClass(classId, `新作业: ${assignment.title}`, 'assignment');
      });
    },

    submitted(assignment, teacherId) {
      notifications.toUser(teacherId, `作业 "${assignment.title}" 有新的提交`, 'submission');
    },

    graded(assignment, studentId, score) {
      notifications.toUser(studentId, `作业 "${assignment.title}" 已批改，得分: ${score}`, 'grade');
    },

    deadline(assignment, classIds) {
      classIds.forEach(classId => {
        notifications.toClass(classId, `作业 "${assignment.title}" 即将截止`, 'warning');
      });
    }
  },

  // 成绩相关通知
  grade: {
    updated(studentId, courseName, grade) {
      notifications.toUser(studentId, `${courseName} 成绩已更新: ${grade}`, 'grade');
    }
  },

  // 考勤相关通知
  attendance: {
    absent(studentId, courseName, date) {
      notifications.toUser(studentId, `您在 ${date} 的 ${courseName} 课程被记录为缺勤`, 'warning');
    }
  },

  // 讨论相关通知
  discussion: {
    newPost(discussionTitle, classId, authorName) {
      notifications.toClass(classId, `${authorName} 在 "${discussionTitle}" 中发表了新内容`, 'discussion');
    },

    newReply(discussionTitle, userId, authorName) {
      notifications.toUser(userId, `${authorName} 回复了您在 "${discussionTitle}" 中的发言`, 'discussion');
    }
  },

  // 系统通知
  system: {
    maintenance(message) {
      notifications.toAll(message, 'system');
    },

    announcement(message, targetType = 'all') {
      switch (targetType) {
        case 'staff':
          notifications.toStaff(message, 'announcement');
          break;
        case 'students':
          notifications.toStudents(message, 'announcement');
          break;
        default:
          notifications.toAll(message, 'announcement');
      }
    }
  }
};

module.exports = {
  initializeSocket,
  notifications
};