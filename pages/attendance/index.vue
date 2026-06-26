<template>
	<view class="page-wrap">
		<!-- 积分卡片 -->
		<view class="score-card" v-if="stats">
			<view class="score-main">
				<text class="score-num">{{ stats.scoreTotal != null ? stats.scoreTotal : 100 }}</text>
				<text class="score-unit">分</text>
			</view>
			<text class="score-label">第二课堂加权总成绩</text>
			<view class="score-entry" @click="goScoreRecord">
				<text>查看积分明细 ›</text>
			</view>
		</view>

		<!-- 六维分数 -->
		<view class="five-card" v-if="stats">
			<view class="five-title">六维积分</view>
			<view class="five-grid six-grid">
				<view class="five-item" v-for="item in sixItems" :key="item.key">
					<text class="five-score" :class="{ warn: item.score < 60 }">{{ item.score }}</text>
					<text class="five-name">{{ item.name }}</text>
					<text class="five-weight" v-if="weights">权重{{ item.weight }}%</text>
				</view>
			</view>
		</view>

		<!-- 扣分规则说明 -->
		<view class="rules-card" v-if="rules && rules.length > 0">
			<view class="rules-title">积分规则</view>
			<view class="rules-row">
				<text class="rule-item" v-for="rule in rules" :key="rule.scene">
					{{ rule.sceneName }} <text class="rule-pts" :class="{ plus: rule.points > 0 }">{{ rule.points > 0 ? '+' : '' }}{{ rule.points }}分</text>
				</text>
			</view>
		</view>

		<!-- 出勤统计 -->
		<view class="stats-card" v-if="stats">
			<view class="stats-title">出勤统计</view>
			<view class="stats-grid">
				<view class="stat-block">
					<text class="stat-n">{{ stats.violationCount || 0 }}</text>
					<text class="stat-l">课堂违纪</text>
				</view>
				<view class="stat-block">
					<text class="stat-n warn">{{ stats.truantCount || 0 }}</text>
					<text class="stat-l">旷课次数</text>
				</view>
				<view class="stat-block">
					<text class="stat-n">{{ stats.lateCount || 0 }}</text>
					<text class="stat-l">迟到次数</text>
				</view>
				<view class="stat-block">
					<text class="stat-n">{{ stats.earlyLeaveCount || 0 }}</text>
					<text class="stat-l">早退次数</text>
				</view>
				<view class="stat-block">
					<text class="stat-n">{{ stats.talkCount || 0 }}</text>
					<text class="stat-l">谈话次数</text>
				</view>
			</view>
		</view>

		<!-- 加载中 -->
		<view v-if="loading" class="loading-tip">
			<text>加载中...</text>
		</view>

		<!-- 积分说明 -->
		<view class="desc-card">
			<view class="desc-title">关于第二课堂积分</view>
			<text class="desc-text">第二课堂积分按德、智、体、美、劳、创六维分类，每维初始100分。最终成绩由各维度分数按权重加权计算得出（满分100分）。积分反映同学们在校期间的各方面表现，请全面发展、积极向上。</text>
		</view>
	</view>
</template>

<script>
import userInfoApi from '@/api/userInfo.js'
import requireLogin from '@/mixins/requireLogin.js'

export default {
	mixins: [requireLogin],
	data() {
		return {
			stats: null,
			weights: null,
			rules: [],
			loading: true,
		}
	},
	computed: {
		sixItems() {
			if (!this.stats) return []
			const names = { de: '思想道德', zhi: '专业技能', ti: '身心健康', mei: '审美素养', lao: '劳动实践', chuang: '创新创业' }
			const fields = { de: 'scoreDe', zhi: 'scoreZhi', ti: 'scoreTi', mei: 'scoreMei', lao: 'scoreLao', chuang: 'scoreChuang' }
			const defaultWeights = { de: 20, zhi: 30, ti: 10, mei: 10, lao: 15, chuang: 15 }
			return Object.keys(names).map(key => ({
				key,
				name: names[key],
				score: this.stats[fields[key]] != null ? this.stats[fields[key]] : 100,
				weight: this.weights ? (this.weights[key] || defaultWeights[key]) : defaultWeights[key]
			}))
		}
	},
	onLoad() {
		this.loadStats()
	},
	onPullDownRefresh() {
		this.loadStats().finally(() => uni.stopPullDownRefresh())
	},
	methods: {
		goScoreRecord() {
			uni.navigateTo({ url: '/pages/score/record' })
		},
		async loadStats() {
			this.loading = true
			try {
				const res = await userInfoApi.getMyStats()
				const data = res.data || {}
				this.stats = data.statistics || data
				this.weights = data.weights || null
				this.rules = data.rules || []
			} catch (e) {
				uni.showToast({ title: '加载失败', icon: 'none' })
			} finally {
				this.loading = false
			}
		}
	}
}
</script>

<style scoped>
.page-wrap { background: #f4f6f8; min-height: 100vh; padding: 24rpx; }
.score-card {
	background: linear-gradient(135deg, #4a7cf6, #6c9fff);
	border-radius: 20rpx;
	padding: 40rpx 32rpx;
	text-align: center;
	margin-bottom: 24rpx;
	color: #fff;
}
.score-main { display: flex; align-items: flex-end; justify-content: center; margin-bottom: 8rpx; }
.score-num { font-size: 80rpx; font-weight: bold; line-height: 1; }
.score-unit { font-size: 32rpx; margin-left: 8rpx; margin-bottom: 10rpx; opacity: 0.9; }
.score-label { font-size: 26rpx; opacity: 0.85; display: block; }
.score-entry { margin-top: 24rpx; display: inline-block; font-size: 26rpx; color: #fff; background: rgba(255,255,255,0.2); padding: 10rpx 28rpx; border-radius: 32rpx; }

.five-card {
	background: #fff;
	border-radius: 16rpx;
	padding: 24rpx;
	margin-bottom: 24rpx;
}
.five-title { font-size: 26rpx; font-weight: bold; color: #333; margin-bottom: 16rpx; }
.five-grid { display: flex; justify-content: space-around; }
.six-grid { flex-wrap: wrap; }
.six-grid .five-item { flex: none; width: 33.33%; margin-bottom: 16rpx; }
.five-item { text-align: center; flex: 1; }
.five-score { font-size: 44rpx; font-weight: bold; color: #4a7cf6; display: block; }
.five-score.warn { color: #f5222d; }
.five-name { font-size: 24rpx; color: #333; display: block; margin-top: 4rpx; }
.five-weight { font-size: 20rpx; color: #999; display: block; margin-top: 2rpx; }

.rules-card {
	background: #fff;
	border-radius: 16rpx;
	padding: 24rpx;
	margin-bottom: 24rpx;
}
.rules-title { font-size: 26rpx; font-weight: bold; color: #333; margin-bottom: 16rpx; }
.rules-row { display: flex; justify-content: flex-start; flex-wrap: wrap; gap: 12rpx; }
.rule-item { font-size: 24rpx; color: #666; background: #f5f5f5; border-radius: 24rpx; padding: 10rpx 20rpx; }
.rule-pts { color: #f5222d; font-weight: bold; }
.rule-pts.plus { color: #52c41a; }

.stats-card {
	background: #fff;
	border-radius: 16rpx;
	padding: 24rpx;
	margin-bottom: 24rpx;
}
.stats-title { font-size: 26rpx; font-weight: bold; color: #333; margin-bottom: 20rpx; }
.stats-grid { display: flex; flex-wrap: wrap; gap: 20rpx; }
.stat-block {
	flex: 1;
	min-width: 120rpx;
	background: #f8f9fc;
	border-radius: 12rpx;
	padding: 20rpx 0;
	text-align: center;
}
.stat-n { font-size: 40rpx; font-weight: bold; color: #333; display: block; }
.stat-n.warn { color: #f5222d; }
.stat-l { font-size: 22rpx; color: #999; margin-top: 4rpx; display: block; }
.loading-tip { text-align: center; padding: 40rpx; color: #999; font-size: 26rpx; }
.desc-card {
	background: #fff;
	border-radius: 16rpx;
	padding: 24rpx;
}
.desc-title { font-size: 26rpx; font-weight: bold; color: #333; margin-bottom: 12rpx; }
.desc-text { font-size: 24rpx; color: #666; line-height: 1.8; }
</style>