<template>
  <view class="history-container">
    <!-- 打卡历史列表 -->
    <view class="history-list" v-if="historyList.length > 0">
      <view 
        class="history-item"
        v-for="(item, index) in historyList" 
        :key="item.id"
        @click="viewDetail(item)"
      >
        <view class="item-header">
          <view class="sport-type-badge" :class="getTypeClass(item.sportType)">
            <text class="badge-emoji">{{ getTypeEmoji(item.sportType) }}</text>
          </view>
          <view class="item-info">
            <text class="sport-type-text">{{ getTypeText(item.sportType) }}</text>
            <text class="sport-time">{{ formatTime(item.startTime) }}</text>
          </view>
        </view>
        <view class="item-stats">
          <view class="stat-box">
            <text class="stat-value">{{ item.distance || 0 }}</text>
            <text class="stat-unit">公里</text>
          </view>
          <view class="stat-box">
            <text class="stat-value">{{ formatDuration(item.duration) }}</text>
            <text class="stat-unit">时长</text>
          </view>
          <view class="stat-box">
            <text class="stat-value">{{ item.calories || 0 }}</text>
            <text class="stat-unit">卡路里</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 空状态 -->
    <view class="empty-state" v-else-if="!loading">
      <view class="empty-content">
        <text class="empty-emoji">📝</text>
        <text class="empty-text">暂无打卡记录</text>
      </view>
    </view>

    <!-- 加载更多 -->
    <view class="load-more" v-if="hasMore && historyList.length > 0" @click="loadMore">
      <text class="load-text">{{ loadStatus === 'loading' ? '加载中...' : '点击加载更多' }}</text>
    </view>

    <!-- 详情弹窗 -->
    <view class="detail-mask" v-if="showDetail" @click="closeDetail">
      <view class="detail-popup" @click.stop>
        <view class="detail-header">
          <text class="detail-title">运动详情</text>
          <text class="close-btn" @click="closeDetail">✕</text>
        </view>
        <view class="detail-content">
          <view class="detail-row">
            <text class="detail-label">运动类型</text>
            <text class="detail-value">{{ getTypeText(currentDetail.sportType) }}</text>
          </view>
          <view class="detail-row">
            <text class="detail-label">开始时间</text>
            <text class="detail-value">{{ formatFullTime(currentDetail.startTime) }}</text>
          </view>
          <view class="detail-row">
            <text class="detail-label">结束时间</text>
            <text class="detail-value">{{ formatFullTime(currentDetail.endTime) }}</text>
          </view>
          <view class="detail-row">
            <text class="detail-label">运动距离</text>
            <text class="detail-value">{{ currentDetail.distance || 0 }} 公里</text>
          </view>
          <view class="detail-row">
            <text class="detail-label">运动时长</text>
            <text class="detail-value">{{ formatDuration(currentDetail.duration) }}</text>
          </view>
          <view class="detail-row">
            <text class="detail-label">消耗卡路里</text>
            <text class="detail-value">{{ currentDetail.calories || 0 }} 卡</text>
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
      historyList: [],
      loading: false,
      pageNum: 1,
      pageSize: 10,
      hasMore: true,
      loadStatus: 'loadmore',
      showDetail: false,
      currentDetail: null
    }
  },
  onLoad() {
    this.loadHistory()
  },
  onPullDownRefresh() {
    this.refresh()
  },
  methods: {
    // 加载历史数据
    async loadHistory(isRefresh = false) {
      if (this.loading) return
      this.loading = true
      this.loadStatus = 'loading'

      try {
        const params = {
          pageNum: isRefresh ? 1 : this.pageNum,
          pageSize: this.pageSize
        }

        const res = await sportApi.getMyCheckins(params)
        if (res.data && res.data.code === 200) {
          const data = res.data.data || []
          const list = Array.isArray(data) ? data : (data.list || data.records || [])
          
          if (isRefresh) {
            this.historyList = list
            this.pageNum = 1
          } else {
            this.historyList = [...this.historyList, ...list]
          }

          // 判断是否还有更多数据
          this.hasMore = list.length >= this.pageSize
          this.loadStatus = this.hasMore ? 'loadmore' : 'nomore'
        }
      } catch (error) {
        console.error('加载历史记录失败:', error)
        uni.showToast({ title: '加载失败', icon: 'none' })
        this.loadStatus = 'loadmore'
      } finally {
        this.loading = false
        uni.stopPullDownRefresh()
      }
    },

    // 下拉刷新
    refresh() {
      this.loadHistory(true)
    },

    // 加载更多
    loadMore() {
      if (this.hasMore && !this.loading) {
        this.pageNum++
        this.loadHistory()
      }
    },

    // 查看详情
    viewDetail(item) {
      this.currentDetail = item
      this.showDetail = true
    },

    // 关闭详情
    closeDetail() {
      this.showDetail = false
      this.currentDetail = null
    },

    // 获取运动类型样式
    getTypeClass(type) {
      const map = {
        run: 'type-run',
        walk: 'type-walk',
        cycle: 'type-cycle'
      }
      return map[type] || ''
    },

    // 获取运动类型图标
    getTypeIcon(type) {
      const map = {
        run: 'run',
        walk: 'walking',
        cycle: 'bike'
      }
      return map[type] || 'question'
    },

    // 获取运动类型emoji
    getTypeEmoji(type) {
      const map = {
        run: '🏃',
        walk: '🚶',
        cycle: '🚴'
      }
      return map[type] || '❓'
    },

    // 获取运动类型文本
    getTypeText(type) {
      const map = {
        run: '跑步',
        walk: '步行',
        cycle: '骑行'
      }
      return map[type] || type
    },

    // 格式化时间
    formatTime(time) {
      if (!time) return ''
      const date = new Date(time)
      const now = new Date()
      const isToday = date.toDateString() === now.toDateString()
      
      if (isToday) {
        return `今天 ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
      }
      
      return `${date.getMonth() + 1}月${date.getDate()}日 ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
    },

    // 格式化完整时间
    formatFullTime(time) {
      if (!time) return ''
      const date = new Date(time)
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
    },

    // 格式化时长
    formatDuration(seconds) {
      if (!seconds) return '0分钟'
      const minutes = Math.floor(seconds / 60)
      if (minutes < 60) return `${minutes}分钟`
      const hours = Math.floor(minutes / 60)
      const mins = minutes % 60
      return `${hours}小时${mins}分钟`
    }
  }
}
</script>

<style scoped>
.history-container {
  min-height: 100vh;
  background: #f5f7fa;
  padding: 20rpx;
}

/* 历史记录列表 */
.history-list {
  display: flex;
  flex-direction: column;
}

.history-item {
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 16rpx;
}

/* 头部 */
.item-header {
  display: flex;
  align-items: center;
  margin-bottom: 20rpx;
}

.sport-type-badge {
  width: 60rpx;
  height: 60rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20rpx;
}

.badge-emoji {
  font-size: 28rpx;
}

.type-run {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.type-walk {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.type-cycle {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.item-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.sport-type-text {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 6rpx;
}

.sport-time {
  font-size: 24rpx;
  color: #999;
}

/* 统计数据 */
.item-stats {
  display: flex;
  justify-content: space-around;
  padding-top: 20rpx;
  border-top: 1rpx solid #f0f0f0;
}

.stat-box {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-value {
  font-size: 32rpx;
  font-weight: bold;
  color: #667eea;
  margin-bottom: 6rpx;
}

.stat-unit {
  font-size: 22rpx;
  color: #999;
}

/* 空状态 */
.empty-state {
  margin-top: 100rpx;
}

.empty-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.empty-emoji {
  font-size: 100rpx;
  margin-bottom: 20rpx;
}

.empty-text {
  font-size: 28rpx;
  color: #999;
}

/* 加载更多 */
.load-more {
  margin-top: 20rpx;
  padding: 30rpx;
  text-align: center;
}

.load-text {
  font-size: 26rpx;
  color: #999;
}

/* 详情弹窗 */
.detail-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}

.detail-popup {
  width: 600rpx;
  background: #fff;
  border-radius: 20rpx;
  padding: 30rpx;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30rpx;
  padding-bottom: 20rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.detail-title {
  font-size: 34rpx;
  font-weight: bold;
  color: #333;
}

.close-btn {
  font-size: 32rpx;
  color: #999;
  padding: 10rpx;
}

.detail-content {
  display: flex;
  flex-direction: column;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f5f5f5;
}

.detail-row:last-child {
  border-bottom: none;
}

.detail-label {
  font-size: 28rpx;
  color: #666;
}

.detail-value {
  font-size: 28rpx;
  color: #333;
  font-weight: bold;
}
</style>
