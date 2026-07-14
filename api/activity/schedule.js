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

// 本地计算当前周次（回退方案）
function calcLocalWeek() {
  // 2025-2026学年第二学期教学第1周周一: 2026-03-02
  const now = new Date()
  const teachingStart = new Date(2026, 2, 2) // 月份从0开始，2=3月
  const diffMs = now.getTime() - teachingStart.getTime()
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000))
  let week = Math.floor(diffDays / 7) + 1
  if (week < 1) week = 1
  if (week > 20) week = 20
  return week
}

// 获取当前学期和周次信息（基于校历）
export function getCurrentInfo() {
  return request({
    url: '/api/classschedule/currentInfo',
    method: 'get',
    header: { isSilent: true } // 失败时静默回退
  }).then(res => {
    if (res && res.data && res.data.code === 200 && res.data.data) {
      return res
    }
    return buildFallback()
  }).catch(() => {
    return buildFallback()
  })
}

function buildFallback() {
  const week = calcLocalWeek()
  return {
    data: {
      code: 200,
      data: {
        semesterId: '202520261',
        semesterName: '2025-2026学年第二学期',
        currentWeek: week
      }
    }
  }
}
