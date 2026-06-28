<template>
  <view class="sport-container">
    <!-- 今日步数卡片 -->
    <view class="steps-card">
      <view class="steps-header">
        <text class="steps-title">今日步数</text>
        <text class="steps-date">{{ currentDate }}</text>
      </view>
      <view class="steps-content">
        <text class="steps-number">{{ todaySteps || 0 }}</text>
        <text class="steps-unit">步</text>
      </view>
      <view class="steps-progress">
        <view class="progress-bar" :style="{ width: progressPercent + '%' }"></view>
      </view>
      <text class="steps-target">目标: 8000步</text>
      <view class="sync-btn" @click="syncWechatSteps">
        <text class="sync-icon">🔄</text>
        <text class="sync-text">同步微信运动</text>
      </view>
    </view>

    <!-- 功能入口 -->
    <view class="function-grid">
      <view class="function-item" @click="goRanking">
        <view class="function-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
          <text class="function-emoji">⭐</text>
        </view>
        <text class="function-name">步数排名</text>
      </view>
      <view class="function-item" @click="goCheckin">
        <view class="function-icon" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
          <text class="function-emoji">🏃</text>
        </view>
        <text class="function-name">运动打卡</text>
      </view>
      <view class="function-item" @click="goHistory">
        <view class="function-icon" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
          <text class="function-emoji">📋</text>
        </view>
        <text class="function-name">打卡历史</text>
      </view>
    </view>

    <!-- 最近打卡记录 -->
    <view class="recent-checkins" v-if="recentCheckins.length > 0">
      <view class="section-header">
        <text class="section-title">最近打卡</text>
      </view>
      <view class="checkin-list">
        <view class="checkin-item" v-for="(item, index) in recentCheckins" :key="index" @click="viewCheckinDetail(item.id)">
          <view class="checkin-info">
            <text class="checkin-type">{{ sportTypeText(item.sportType) }}</text>
            <text class="checkin-time">{{ formatTime(item.startTime) }}</text>
          </view>
          <view class="checkin-stats">
            <text class="stat-item">{{ item.distance || 0 }}公里</text>
            <text class="stat-item">{{ formatDuration(item.duration) }}</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import sportApi from '@/api/sport.js'

export default {
  data() {
    return {
      currentDate: '',
      todaySteps: 0,
      progressPercent: 0,
      recentCheckins: [],
      silentSyncTimer: null  // 静默同步定时器
    }
  },
  onShow() {
    this.loadTodaySteps()
    this.loadRecentCheckins()
    this.startSilentSync()  // 启动静默同步
  },
  onHide() {
    this.stopSilentSync()  // 停止静默同步
  },
  onUnload() {
    this.stopSilentSync()  // 清理定时器
  },
  methods: {
    // 加载今日步数
    async loadTodaySteps() {
      try {
        const now = new Date()
        this.currentDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
        
        const res = await sportApi.getTodaySteps()
        if (res.data && res.data.code === 200 && res.data.data) {
          this.todaySteps = res.data.data.steps || 0
          this.progressPercent = Math.min((this.todaySteps / 8000) * 100, 100)
        }
      } catch (error) {
        console.error('加载今日步数失败:', error)
      }
    },

    // 同步微信运动步数
    syncWechatSteps() {
      // #ifdef MP-WEIXIN
      uni.showLoading({ title: '同步中...' })
      wx.getWeRunData({
        success: (res) => {
          // 将 encryptedData 和 iv 发送到后端解密
          sportApi.syncSteps({
            encryptedData: res.encryptedData,
            iv: res.iv,
            date: this.currentDate
          }).then(response => {
            uni.hideLoading()
            if (response.data && response.data.code === 200) {
              uni.showToast({ title: '同步成功', icon: 'success' })
              this.loadTodaySteps()
            } else {
              uni.showToast({ title: response.data.msg || '同步失败', icon: 'none' })
            }
          }).catch(() => {
            uni.hideLoading()
            uni.showToast({ title: '同步失败', icon: 'none' })
          })
        },
        fail: () => {
          uni.hideLoading()
          uni.showToast({ title: '获取微信运动数据失败', icon: 'none' })
        }
      })
      // #endif
      
      // #ifndef MP-WEIXIN
      // H5/APP 环境：模拟步数用于测试
      uni.showModal({
        title: '测试模式',
        content: '请输入模拟步数（用于测试）',
        editable: true,
        placeholderText: '请输入步数',
        success: (modalRes) => {
          if (modalRes.confirm && modalRes.content) {
            const steps = parseInt(modalRes.content)
            if (isNaN(steps) || steps < 0) {
              uni.showToast({ title: '请输入有效的步数', icon: 'none' })
              return
            }
            
            uni.showLoading({ title: '同步中...' })
            sportApi.syncSteps({
              steps: steps,
              date: this.currentDate
            }).then(response => {
              uni.hideLoading()
              if (response.data && response.data.code === 200) {
                uni.showToast({ title: '同步成功', icon: 'success' })
                this.loadTodaySteps()
              } else {
                uni.showToast({ title: response.data.msg || '同步失败', icon: 'none' })
              }
            }).catch(() => {
              uni.hideLoading()
              uni.showToast({ title: '同步失败', icon: 'none' })
            })
          }
        }
      })
      // #endif
    },

    // 加载最近打卡记录
    async loadRecentCheckins() {
      try {
        const res = await sportApi.getMyCheckins({})
        if (res.data && res.data.code === 200 && res.data.data) {
          this.recentCheckins = res.data.data.slice(0, 5)
        }
      } catch (error) {
        console.error('加载打卡记录失败:', error)
      }
    },

    // 跳转排名页
    goRanking() {
      uni.navigateTo({ url: '/pages/sport/ranking' })
    },

    // 跳转打卡页
    goCheckin() {
      uni.navigateTo({ url: '/pages/sport/checkin' })
    },

    // 跳转历史页
    goHistory() {
      uni.navigateTo({ url: '/pages/sport/history' })
    },

    // 查看打卡详情
    viewCheckinDetail(id) {
      uni.showToast({ title: '查看详情', icon: 'none' })
    },

    // 运动类型文本
    sportTypeText(type) {
      const map = { run: '跑步', walk: '步行', cycle: '骑行' }
      return map[type] || type
    },

    // 格式化时间
    formatTime(time) {
      if (!time) return ''
      const date = new Date(time)
      return `${date.getMonth() + 1}月${date.getDate()}日 ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
    },

    // 格式化时长
    formatDuration(seconds) {
      if (!seconds) return '0分钟'
      const minutes = Math.floor(seconds / 60)
      if (minutes < 60) return `${minutes}分钟`
      const hours = Math.floor(minutes / 60)
      const mins = minutes % 60
      return `${hours}小时${mins}分钟`
    },

    // 启动静默同步（每天晚上 22:05）
    startSilentSync() {
      // #ifdef MP-WEIXIN
      // 计算到下一个 22:05 的毫秒数
      const now = new Date()
      const target = new Date(now)
      target.setHours(22, 5, 0, 0)
      
      // 如果今天 22:05 已过，设置为明天 22:05
      if (target <= now) {
        target.setDate(target.getDate() + 1)
      }
      
      const delay = target.getTime() - now.getTime()
      
      console.log(`静默同步将在 ${delay / 1000 / 60} 分钟后执行（${target.toLocaleString()}）`)
      
      // 设置定时器
      this.silentSyncTimer = setTimeout(() => {
        this.executeSilentSync()
        // 递归设置下一个 22:05 的定时器
        this.startSilentSync()
      }, delay)
      // #endif
    },

    // 停止静默同步
    stopSilentSync() {
      if (this.silentSyncTimer) {
        clearTimeout(this.silentSyncTimer)
        this.silentSyncTimer = null
        console.log('静默同步定时器已清理')
      }
    },

    // 执行静默同步
    executeSilentSync() {
      // #ifdef MP-WEIXIN
      console.log('开始静默同步微信运动数据...')
      
      // 静默获取微信运动数据（不显示 loading）
      wx.getWeRunData({
        success: (res) => {
          sportApi.syncSteps({
            encryptedData: res.encryptedData,
            iv: res.iv,
            date: this.currentDate
          }).then(response => {
            if (response.data && response.data.code === 200) {
              console.log('静默同步成功:', response.data.data)
              this.loadTodaySteps()  // 刷新步数显示
            } else {
              console.warn('静默同步失败:', response.data.msg)
            }
          }).catch(err => {
            console.error('静默同步请求失败:', err)
          })
        },
        fail: (err) => {
          console.error('获取微信运动数据失败:', err)
        }
      })
      // #endif
    }
  }
}
</script>

<style scoped>
.sport-container {
  min-height: 100vh;
  background: #f5f7fa;
  padding: 20rpx;
}

.steps-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 20rpx;
  padding: 40rpx;
  margin-bottom: 30rpx;
  color: #fff;
}

.steps-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30rpx;
}

.steps-title {
  font-size: 32rpx;
  font-weight: bold;
}

.steps-date {
  font-size: 24rpx;
  opacity: 0.8;
}

.steps-content {
  display: flex;
  align-items: baseline;
  margin-bottom: 30rpx;
}

.steps-number {
  font-size: 80rpx;
  font-weight: bold;
  margin-right: 10rpx;
}

.steps-unit {
  font-size: 28rpx;
}

.steps-progress {
  height: 12rpx;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 6rpx;
  overflow: hidden;
  margin-bottom: 15rpx;
}

.progress-bar {
  height: 100%;
  background: #fff;
  border-radius: 6rpx;
  transition: width 0.3s;
}

.steps-target {
  font-size: 24rpx;
  opacity: 0.8;
  display: block;
  margin-bottom: 30rpx;
}

.sync-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 40rpx;
  padding: 20rpx;
}

.sync-icon {
  font-size: 32rpx;
  margin-right: 10rpx;
}

.sync-text {
  margin-left: 10rpx;
  font-size: 28rpx;
}

.function-grid {
  display: flex;
  justify-content: space-around;
  background: #fff;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
}

.function-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.function-icon {
  width: 100rpx;
  height: 100rpx;
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 15rpx;
}

.function-emoji {
  font-size: 48rpx;
}

.function-name {
  font-size: 26rpx;
  color: #333;
}

.recent-checkins {
  background: #fff;
  border-radius: 20rpx;
  padding: 30rpx;
}

.section-header {
  margin-bottom: 20rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.checkin-list {
  display: flex;
  flex-direction: column;
}

.checkin-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.checkin-item:last-child {
  border-bottom: none;
}

.checkin-info {
  display: flex;
  flex-direction: column;
}

.checkin-type {
  font-size: 28rpx;
  color: #333;
  font-weight: bold;
  margin-bottom: 8rpx;
}

.checkin-time {
  font-size: 24rpx;
  color: #999;
}

.checkin-stats {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.stat-item {
  font-size: 24rpx;
  color: #667eea;
  margin-bottom: 8rpx;
}
</style>
