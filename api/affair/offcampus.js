import request from '@/utils/request'

/**
 * 外宿申请API（学生端小程序）
 */

// 提交外宿申请
export function submitOffcampus(data) {
  return request({
    url: '/api/offcampus',
    method: 'post',
    data: data
  })
}

// 我的外宿申请列表
export function getMyOffcampus() {
  return request({
    url: '/api/offcampus/my',
    method: 'get'
  })
}

// 外宿申请详情
export function getOffcampusDetail(id) {
  return request({
    url: '/api/offcampus/' + id,
    method: 'get'
  })
}

// 外宿期限候选：整学年 + 各学期（取自校历）
export function getOffcampusPeriods(academicYear) {
  return request({
    url: '/api/offcampus/periods',
    method: 'get',
    params: { academicYear: academicYear }
  })
}
