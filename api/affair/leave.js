import request from '@/utils/request'

// 获取我的请假列表（学生端）
export function getMyLeaves(query) {
  return request({
    url: '/api/leave/myLeaves',
    method: 'get',
    params: query
  })
}

// 提交请假申请
export function applyLeave(data) {
  return request({
    url: '/api/leave/apply',
    method: 'post',
    data: data
  })
}

// 获取请假详情
export function getLeaveDetail(id) {
  return request({
    url: '/api/leave/' + id,
    method: 'get'
  })
}

// 获取请假扣分提示（从积分场景配置读取）
export function getLeaveScoreHint(query) {
  return request({
    url: '/api/leave/scoreHint',
    method: 'get',
    params: query
  })
}
