import request from '@/utils/request'

// 查询我的课表
export function getMySchedule(params) {
  return request({
    url: '/api/classschedule/my',
    method: 'get',
    params: params
  })
}

// 查询当天课表
export function getTodaySchedule(params) {
  return request({
    url: '/api/classschedule/today',
    method: 'get',
    params: params
  })
}
