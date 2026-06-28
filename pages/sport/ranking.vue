<template>
  <view class="ranking-container">
    <!-- Tab切换 -->
    <view class="tab-bar">
      <view 
        class="tab-item" 
        :class="{ active: currentTab === item.value }"
        v-for="item in tabs" 
        :key="item.value"
        @click="switchTab(item.value)"
      >
        <text class="tab-text">{{ item.label }}</text>
      </view>
    </view>

    <!-- 排名列表 -->
    <view class="ranking-list" v-if="rankingList.length > 0">
      <view 
        class="ranking-item"
        :class="{ 'is-me': item.isMe }"
        v-for="(item, index) in rankingList" 
        :key="item.userId"
      >
        <view class="rank-number" :class="getRankClass(index)">
          <text class="rank-text">{{ getRankText(index) }}</text>
        </view>
        <view class="rank-avatar">
          <image class="avatar-img" :src="item.avatar || '/static/images/default-avatar.png'" mode="aspectFill"></image>
        </view>
        <view class="rank-info">
          <text class="rank-name">{{ item.userName }}</text>
          <text class="rank-dept" v-if="item.deptName">{{ item.deptName }}</text>
        </view>
        <view class="rank-steps">
          <text class="steps-num">{{ item.steps }}</text>
          <text class="steps-unit">步</text>
        </view>
      </view>
    </view>

    <!-- 空状态 -->
    <view class="empty-state" v-else>
      <view class="empty-content">
        <image class="empty-icon" src="/static/images/empty.png" mode="aspectFit"></image>
        <text class="empty-text">暂无排名数据</text>
      </view>
    </view>
  </view>
</template>

<script>
import sportApi from '@/api/sport.js'

export default {
  data() {
    return {
      tabs: [
        { label: '今日', value: 'daily' },
        { label: '本周', value: 'weekly' },
        { label: '本月', value: 'monthly' },
        { label: '本学期', value: 'semester' }
      ],
      currentTab: 'daily',
      rankingList: [],
      loading: false
    }
  },
  onLoad() {
    this.loadRanking()
  },
  methods: {
    // 切换Tab
    switchTab(tab) {
      this.currentTab = tab
      this.loadRanking()
    },

    // 加载排名数据
    async loadRanking() {
      if (this.loading) return
      this.loading = true
      
      try {
        const params = {
          dateType: this.currentTab,
          limit: 100
        }

        const res = await sportApi.getRanking(params)
        if (res.data && res.data.code === 200 && res.data.data) {
          this.rankingList = res.data.data.map(item => ({
            ...item,
            isMe: item.isMe || false
          }))
        }
      } catch (error) {
        console.error('加载排名失败:', error)
        uni.showToast({ title: '加载失败', icon: 'none' })
      } finally {
        this.loading = false
      }
    },

    // 获取排名样式类
    getRankClass(index) {
      if (index === 0) return 'rank-gold'
      if (index === 1) return 'rank-silver'
      if (index === 2) return 'rank-bronze'
      return ''
    },

    // 获取排名文本
    getRankText(index) {
      if (index === 0) return '🥇'
      if (index === 1) return '🥈'
      if (index === 2) return '🥉'
      return index + 1
    }
  }
}
</script>

<style scoped>
.ranking-container {
  min-height: 100vh;
  background: #f5f7fa;
  padding: 20rpx;
}

/* Tab栏 */
.tab-bar {
  display: flex;
  background: #fff;
  border-radius: 16rpx;
  padding: 10rpx;
  margin-bottom: 20rpx;
}

.tab-item {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16rpx 0;
  border-radius: 12rpx;
  transition: all 0.3s;
}

.tab-item.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.tab-text {
  font-size: 28rpx;
  color: #666;
}

.tab-item.active .tab-text {
  color: #fff;
  font-weight: bold;
}

/* 排名列表 */
.ranking-list {
  display: flex;
  flex-direction: column;
}

.ranking-item {
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 16rpx;
  transition: all 0.3s;
}

.ranking-item.is-me {
  background: #e8f0fe;
  border: 2rpx solid #667eea;
}

/* 排名数字 */
.rank-number {
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20rpx;
  border-radius: 50%;
  background: #f0f0f0;
}

.rank-gold {
  background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
}

.rank-silver {
  background: linear-gradient(135deg, #C0C0C0 0%, #A0A0A0 100%);
}

.rank-bronze {
  background: linear-gradient(135deg, #CD7F32 0%, #B87333 100%);
}

.rank-text {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
}

.rank-gold .rank-text,
.rank-silver .rank-text,
.rank-bronze .rank-text {
  color: #fff;
}

/* 头像 */
.rank-avatar {
  margin-right: 20rpx;
}

.avatar-img {
  width: 60rpx;
  height: 60rpx;
  border-radius: 50%;
  background: #f0f0f0;
}

/* 信息 */
.rank-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.rank-name {
  font-size: 30rpx;
  color: #333;
  font-weight: bold;
  margin-bottom: 6rpx;
}

.rank-dept {
  font-size: 24rpx;
  color: #999;
}

/* 步数 */
.rank-steps {
  display: flex;
  align-items: baseline;
}

.steps-num {
  font-size: 36rpx;
  font-weight: bold;
  color: #667eea;
  margin-right: 6rpx;
}

.steps-unit {
  font-size: 24rpx;
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

.empty-icon {
  width: 200rpx;
  height: 200rpx;
  margin-bottom: 20rpx;
}

.empty-text {
  font-size: 28rpx;
  color: #999;
}
</style>
