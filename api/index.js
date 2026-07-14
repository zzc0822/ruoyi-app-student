/**
 * 学生端小程序 API 统一入口
 * 按业务域组织，便于维护和查找
 */

// 认证模块（登录/注册/绑定）
export * as auth from './auth'

// 学生信息模块（个人信息/积分）
export * as student from './student'

// 活动模块（活动/体育/课表）
export * as activity from './activity'

// 学生事务模块（请假/外宿/证书/待办）
export * as affair from './affair'

// 校园信息模块（信息墙/操作）
export * as campus from './campus'
