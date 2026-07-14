<template>
  <view class="checkin-container">
    <!-- 运动类型选择 -->
    <view class="sport-type-selector">
      <text class="selector-title">选择运动类型</text>
      <view class="type-options">
        <view 
          class="type-option"
          :class="{ active: sportType === item.value }"
          v-for="item in sportTypes"
          :key="item.value"
          @click="selectSportType(item.value)"
        >
          <text class="type-emoji">{{ item.emoji }}</text>
          <text class="type-name" :class="{ active: sportType === item.value }">{{ item.label }}</text>
        </view>
      </view>
    </view>

    <!-- 实时数据显示 -->
    <view class="stats-card">
      <view class="stat-item">
        <text class="stat-value">{{ duration }}</text>
        <text class="stat-label">时长(分钟)</text>
      </view>
      <view class="stat-divider"></view>
      <view class="stat-item">
        <text class="stat-value">{{ distance }}</text>
        <text class="stat-label">距离(公里)</text>
      </view>
      <view class="stat-divider"></view>
      <view class="stat-item">
        <text class="stat-value">{{ calories }}</text>
        <text class="stat-label">消耗(卡路里)</text>
      </view>
    </view>

    <!-- 地图显示 -->
    <view class="map-container" v-if="isRunning">
      <text class="map-tip">正在记录运动轨迹...</text>
    </view>

    <!-- 控制按钮 -->
    <view class="control-btns">
      <view 
        class="btn btn-start" 
        v-if="!isRunning"
        @click="startCheckin"
      >
        <text class="btn-emoji">▶️</text>
        <text class="btn-text">开始运动</text>
      </view>
      <view 
        class="btn btn-end" 
        v-else
        @click="endCheckin"
      >
        <text class="btn-emoji">⏸️</text>
        <text class="btn-text">结束运动</text>
      </view>
    </view>
  </view>
</template>

<script>
import sportApi from '@/api/activity/sport.js'

export default {
  data() {
    return {
      sportTypes: [
        { label: '跑步', value: 'run', emoji: '🏃', calPerKm: 60 },
        { label: '步行', value: 'walk', emoji: '🚶', calPerKm: 40 },
        { label: '骑行', value: 'cycle', emoji: '🚴', calPerKm: 30 }
      ],
      sportType: 'run',
      isRunning: false,
      duration: 0,
      distance: 0,
      calories: 0,
      checkinId: null,
      startTime: null,
      timer: null,
      lastLocation: null,
      watchId: null
    }
  },
  onUnload() {
    this.cleanup()
  },
  methods: {
    // 选择运动类型
    selectSportType(type) {
      if (this.isRunning) {
        uni.showToast({ title: '运动中无法切换', icon: 'none' })
        return
      }
      this.sportType = type
    },

    // 开始运动
    async startCheckin() {
      try {
        uni.showLoading({ title: '开始中...' })

        // 调用后端API
        const res = await sportApi.startCheckin({
          sportType: this.sportType
        })

        if (res.data && res.data.code === 200) {
          this.checkinId = res.data.data.id
          this.startTime = new Date()
          this.isRunning = true
          this.duration = 0
          this.distance = 0
          this.calories = 0
          this.lastLocation = null

          // 开始计时
          this.startTimer()

          // 开始定位
          await this.startLocationTracking()

          uni.hideLoading()
          uni.showToast({ title: '开始运动', icon: 'success' })
        } else {
          uni.hideLoading()
          uni.showToast({ title: res.data.msg || '开始失败', icon: 'none' })
        }
      } catch (error) {
        uni.hideLoading()
        uni.showToast({ title: '开始失败', icon: 'none' })
      }
    },

    // 开始计时
    startTimer() {
      this.timer = setInterval(() => {
        this.duration = Math.floor((new Date() - this.startTime) / 60000)
      }, 1000)
    },

    // 开始定位追踪
    startLocationTracking() {
      return new Promise((resolve, reject) => {
        // #ifdef MP-WEIXIN
        uni.startLocationUpdate({
          success: () => {
            this.watchId = uni.onLocationChange((res) => {
              this.updateLocation(res)
            })
            resolve()
          },
          fail: (err) => {
            uni.showToast({ title: '定位权限未开启', icon: 'none' })
            reject(err)
          }
        })
        // #endif

        // #ifndef MP-WEIXIN
        // H5或其他环境模拟定位
        this.watchId = setInterval(() => {
          // 模拟位置更新
          const mockLocation = {
            latitude: 39.9042 + Math.random() * 0.001,
            longitude: 116.4074 + Math.random() * 0.001
          }
          this.updateLocation(mockLocation)
        }, 5000)
        resolve()
        // #endif
      })
    },

    // 更新位置
    updateLocation(location) {
      if (!this.lastLocation) {
        this.lastLocation = location
        return
      }

      // 使用Haversine公式计算距离
      const delta = this.calculateDistance(
        this.lastLocation.latitude,
        this.lastLocation.longitude,
        location.latitude,
        location.longitude
      )

      // 过滤异常值（单次移动超过500米视为GPS漂移）
      if (delta > 0 && delta < 0.5) {
        this.distance = parseFloat((this.distance + delta).toFixed(3))
        
        // 计算卡路里
        const typeConfig = this.sportTypes.find(t => t.value === this.sportType)
        this.calories = Math.floor(this.distance * typeConfig.calPerKm)
      }

      this.lastLocation = location
    },

    // Haversine公式计算两点距离
    calculateDistance(lat1, lon1, lat2, lon2) {
      const R = 6371 // 地球半径(km)
      const dLat = this.toRad(lat2 - lat1)
      const dLon = this.toRad(lon2 - lon1)
      const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2)
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
      return R * c
    },

    // 角度转弧度
    toRad(degrees) {
      return degrees * Math.PI / 180
    },

    // 结束运动
    async endCheckin() {
      try {
        uni.showModal({
          title: '结束运动',
          content: `运动时长: ${this.duration}分钟\n运动距离: ${this.distance}公里\n消耗卡路里: ${this.calories}卡`,
          success: async (modalRes) => {
            if (modalRes.confirm) {
              await this.completeCheckin()
            }
          }
        })
      } catch (error) {
        // 结束运动失败
      }
    },

    // 完成打卡
    async completeCheckin() {
      try {
        uni.showLoading({ title: '保存中...' })

        const res = await sportApi.completeCheckin({
          id: this.checkinId,
          sportType: this.sportType,
          duration: this.duration * 60, // 转换为秒
          distance: this.distance,
          calories: this.calories
        })

        uni.hideLoading()

        if (res.data && res.data.code === 200) {
          uni.showToast({ title: '打卡成功', icon: 'success' })
          setTimeout(() => {
            uni.navigateBack()
          }, 1500)
        } else {
          uni.showToast({ title: res.data.msg || '保存失败', icon: 'none' })
        }
      } catch (error) {
        uni.hideLoading()
        uni.showToast({ title: '保存失败', icon: 'none' })
      }
    },

    // 清理资源
    cleanup() {
      if (this.timer) {
        clearInterval(this.timer)
        this.timer = null
      }
      if (this.watchId) {
        // #ifdef MP-WEIXIN
        uni.stopLocationUpdate()
        // #endif
        // #ifndef MP-WEIXIN
        clearInterval(this.watchId)
        // #endif
        this.watchId = null
      }
    }
  }
}
</script>

<style scoped>
.checkin-container {
  min-height: 100vh;
  background: #f5f7fa;
  padding: 30rpx;
}

/* 运动类型选择 */
.sport-type-selector {
  background: #fff;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
}

.selector-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 24rpx;
}

.type-options {
  display: flex;
  justify-content: space-around;
}

.type-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20rpx 40rpx;
  border-radius: 16rpx;
  background: #f5f7fa;
  transition: all 0.3s;
}

.type-option.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.type-emoji {
  font-size: 48rpx;
  margin-bottom: 10rpx;
}

.type-name {
  font-size: 26rpx;
  color: #666;
  margin-top: 10rpx;
}

.type-name.active {
  color: #fff;
  font-weight: bold;
}

/* 统计数据卡片 */
.stats-card {
  display: flex;
  align-items: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 20rpx;
  padding: 40rpx 20rpx;
  margin-bottom: 30rpx;
  color: #fff;
}

.stat-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-value {
  font-size: 48rpx;
  font-weight: bold;
  margin-bottom: 10rpx;
}

.stat-label {
  font-size: 24rpx;
  opacity: 0.8;
}

.stat-divider {
  width: 2rpx;
  height: 60rpx;
  background: rgba(255, 255, 255, 0.3);
}

/* 地图容器 */
.map-container {
  background: #fff;
  border-radius: 20rpx;
  padding: 60rpx;
  margin-bottom: 30rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.map-tip {
  font-size: 28rpx;
  color: #999;
}

/* 控制按钮 */
.control-btns {
  display: flex;
  justify-content: center;
}

.btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24rpx 60rpx;
  border-radius: 50rpx;
  min-width: 300rpx;
}

.btn-emoji {
  font-size: 36rpx;
}

.btn-start {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.btn-end {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.btn-text {
  font-size: 32rpx;
  color: #fff;
  font-weight: bold;
  margin-left: 12rpx;
}
</style>
