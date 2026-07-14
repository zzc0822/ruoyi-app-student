import request from '@/utils/request'

/**
 * 活动管理公共API（学生端小程序）
 */

// 查询可报名活动列表
export function listOpenActivities(query) {
  return request({
    url: '/api/activity/openList',
    method: 'get',
    params: query
  })
}

// 查询我的活动列表
export function listMyActivities(query) {
  return request({
    url: '/api/activity/myList',
    method: 'get',
    params: query
  })
}

// 获取学生活动详情
export function getActivityDetail(id) {
  return request({
    url: '/api/activity/' + id + '/detail',
    method: 'get'
  })
}

// 报名活动
export function signupActivity(id) {
  return request({
    url: '/api/activity/' + id + '/signup',
    method: 'post'
  })
}

// 取消报名
export function cancelSignupActivity(id) {
  return request({
    url: '/api/activity/' + id + '/cancelSignup',
    method: 'put'
  })
}
