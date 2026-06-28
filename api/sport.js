import request from '@/utils/request'

// 运动健康API
export default {
  // 获取今日步数
  getTodaySteps() {
    return request({
      url: '/api/sport/steps/today',
      method: 'get'
    })
  },

  // 同步微信运动步数
  syncSteps(data) {
    return request({
      url: '/api/sport/steps/sync',
      method: 'post',
      data: data
    })
  },

  // 获取步数排名
  getRanking(params) {
    return request({
      url: '/api/sport/steps/ranking',
      method: 'get',
      params: params
    })
  },

  // 获取我的步数历史
  getMySteps(params) {
    return request({
      url: '/api/sport/steps/my',
      method: 'get',
      params: params
    })
  },

  // 开始运动打卡
  startCheckin(data) {
    return request({
      url: '/api/sport/checkin/start',
      method: 'post',
      data: data
    })
  },

  // 更新打卡轨迹
  updateTrack(data) {
    return request({
      url: '/api/sport/checkin/update',
      method: 'post',
      data: data
    })
  },

  // 完成运动打卡
  completeCheckin(data) {
    return request({
      url: '/api/sport/checkin/complete',
      method: 'post',
      data: data
    })
  },

  // 获取打卡详情
  getCheckinDetail(id) {
    return request({
      url: `/api/sport/checkin/detail/${id}`,
      method: 'get'
    })
  },

  // 获取我的打卡记录
  getMyCheckins(params) {
    return request({
      url: '/api/sport/checkin/my',
      method: 'get',
      params: params
    })
  }
}
