<template>
	<view class="page-wrap">
		<!-- 摘要卡片 -->
		<view class="summary-card" v-if="summary">
			<view class="summary-item add">
				<text class="summary-num">+{{ summary.totalAdd || 0 }}</text>
				<text class="summary-label">累计加分</text>
			</view>
			<view class="summary-item sub">
				<text class="summary-num">{{ summary.totalSub || 0 }}</text>
				<text class="summary-label">累计扣分</text>
			</view>
			<view class="summary-item net">
				<text class="summary-num" :class="{ warn: (summary.netChange || 0) < 0 }">{{ summary.netChange > 0 ? '+' : '' }}{{ summary.netChange || 0 }}</text>
				<text class="summary-label">净变动</text>
			</view>
		</view>

		<!-- 明细列表 -->
		<view class="record-list" v-if="list.length > 0">
			<view class="record-item" v-for="item in list" :key="item.id">
				<view class="record-main">
					<text class="record-name">{{ item.sceneName || item.reason || item.scene || '--' }}</text>
					<text class="record-time">{{ formatTime(item.createTime) }}</text>
				</view>
				<view class="record-side">
					<text class="record-points" :class="{ plus: item.points > 0, minus: item.points < 0 }">
						{{ item.points > 0 ? '+' : '' }}{{ item.points }}
					</text>
					<text class="record-category">{{ categoryText(item.category) }}</text>
				</view>
			</view>
		</view>
		<view v-else class="empty-tip">
			<text>暂无积分变动记录</text>
		</view>

		<view v-if="hasMore" class="load-more" @click="loadMore">
			<text>{{ loading ? '加载中...' : '加载更多' }}</text>
		</view>
	</view>
</template>

<script>
import { getScoreRecords, getScoreSummary } from '@/api/score.js'

export default {
	data() {
		return {
			list: [],
			summary: null,
			pageNum: 1,
			pageSize: 20,
			hasMore: false,
			loading: false,
		}
	},
	onLoad() {
		this.loadSummary()
		this.loadList()
	},
	onPullDownRefresh() {
		Promise.all([this.loadSummary(), this.loadList()]).finally(() => uni.stopPullDownRefresh())
	},
	methods: {
		async loadSummary() {
			try {
				const res = await getScoreSummary()
				if (res.data && res.data.code === 200) {
					this.summary = res.data.data
				}
			} catch (e) {
				console.error('加载积分摘要失败', e)
			}
		},
		async loadList(refresh = true) {
			if (refresh) {
				this.pageNum = 1
				this.list = []
			}
			this.loading = true
			try {
				const res = await getScoreRecords({ pageNum: this.pageNum, pageSize: this.pageSize })
				const data = res.data || {}
				const rows = data.rows || []
				const total = data.total || 0
				this.list = refresh ? rows : [...this.list, ...rows]
				this.hasMore = this.list.length < total
			} catch (e) {
				uni.showToast({ title: '加载失败', icon: 'none' })
			} finally {
				this.loading = false
			}
		},
		loadMore() {
			if (this.loading || !this.hasMore) return
			this.pageNum++
			this.loadList(false)
		},
		formatTime(val) {
			if (!val) return '--'
			return String(val).substring(0, 16).replace('T', ' ')
		},
		categoryText(val) {
			const map = { de: '德', zhi: '智', ti: '体', mei: '美', lao: '劳', chuang: '创' }
			return map[val] || val || '--'
		}
	}
}
</script>

<style scoped>
.page-wrap { background: #f4f6f8; min-height: 100vh; padding: 24rpx; }
.summary-card { display: flex; background: #fff; border-radius: 16rpx; padding: 32rpx 0; margin-bottom: 24rpx; }
.summary-item { flex: 1; text-align: center; border-right: 1rpx solid #f0f0f0; }
.summary-item:last-child { border-right: none; }
.summary-num { display: block; font-size: 36rpx; font-weight: bold; margin-bottom: 8rpx; }
.summary-label { font-size: 24rpx; color: #999; }
.add .summary-num { color: #52c41a; }
.sub .summary-num { color: #f5222d; }
.net .summary-num { color: #4a7cf6; }
.net .summary-num.warn { color: #f5222d; }
.record-list { background: #fff; border-radius: 16rpx; padding: 0 24rpx; }
.record-item { display: flex; justify-content: space-between; align-items: center; padding: 24rpx 0; border-bottom: 1rpx solid #f5f5f5; }
.record-item:last-child { border-bottom: none; }
.record-main { flex: 1; min-width: 0; }
.record-name { display: block; font-size: 28rpx; color: #333; margin-bottom: 8rpx; word-break: break-all; }
.record-time { font-size: 22rpx; color: #999; }
.record-side { text-align: right; margin-left: 24rpx; }
.record-points { display: block; font-size: 32rpx; font-weight: bold; margin-bottom: 4rpx; }
.record-points.plus { color: #52c41a; }
.record-points.minus { color: #f5222d; }
.record-category { font-size: 22rpx; color: #999; }
.empty-tip { text-align: center; padding: 80rpx 0; color: #999; font-size: 28rpx; }
.load-more { text-align: center; padding: 24rpx; color: #4a7cf6; font-size: 26rpx; }
</style>
