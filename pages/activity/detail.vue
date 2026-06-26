<template>
	<view class="page-container" v-if="activity">
		<view class="card">
			<view class="card-title">{{ activity.title }}</view>
			<view class="info-row">
				<text class="info-label">维度</text>
				<text class="info-value">{{ formatCategory(activity.category) }}</text>
			</view>
			<view class="info-row">
				<text class="info-label">范围</text>
				<text class="info-value">{{ formatTargetType(activity.targetType) }}</text>
			</view>
			<view class="info-row">
				<text class="info-label">开始时间</text>
				<text class="info-value">{{ activity.startTime }}</text>
			</view>
			<view class="info-row">
				<text class="info-label">结束时间</text>
				<text class="info-value">{{ activity.endTime }}</text>
			</view>
			<view class="info-row" v-if="activity.signupEnd">
				<text class="info-label">报名截止</text>
				<text class="info-value">{{ activity.signupEnd }}</text>
			</view>
			<view class="info-row">
				<text class="info-label">说明</text>
				<text class="info-value">{{ activity.description || '无' }}</text>
			</view>
		</view>

		<view class="card" v-if="phases.length > 0">
			<view class="card-title">积分阶段</view>
			<view class="phase-item" v-for="(p, idx) in phases" :key="idx">
				<text class="phase-name">{{ p.sceneName }}</text>
				<text class="phase-score">{{ formatPoints(p) }}</text>
			</view>
		</view>

		<view class="bottom-bar">
			<view class="btn my-btn" @click="goMy">我的活动</view>
			<view :class="['btn', signed ? 'disabled' : 'signup']" @click="handleSignup">
				{{ signed ? '已报名' : '立即报名' }}
			</view>
		</view>
	</view>
</template>

<script>
	import {
		getActivityDetail,
		signupActivity
	} from '@/api/activity'
	import requireLogin from '@/mixins/requireLogin.js'

	const CATEGORY_MAP = {
		de: '德育',
		zhi: '智育',
		ti: '体育',
		mei: '美育',
		lao: '劳育',
		chuang: '创新创业'
	}

	export default {
		mixins: [requireLogin],
		data() {
			return {
				activityId: null,
				activity: null,
				phases: [],
				signed: false,
				myStatus: null
			}
		},
		onLoad(options) {
			this.activityId = Number(options.id)
			this.loadDetail()
		},
		methods: {
			loadDetail() {
				getActivityDetail(this.activityId).then(res => {
					const data = res.data || {}
					this.activity = data.activity
					this.phases = data.phases || []
					this.signed = data.signed
					this.myStatus = data.myStatus
				})
			},
			handleSignup() {
				if (this.signed) return
				uni.showModal({
					title: '确认报名',
					content: '确定报名参加该活动？',
					success: (res) => {
						if (res.confirm) {
							signupActivity(this.activityId).then(() => {
								uni.showToast({
									title: '报名成功',
									icon: 'success'
								})
								this.loadDetail()
							}).catch(() => {
								uni.showToast({
									title: '报名失败',
									icon: 'none'
								})
							})
						}
					}
				})
			},
			goMy() {
				uni.navigateTo({
					url: '/pages/activity/my'
				})
			},
			formatCategory(val) {
				return CATEGORY_MAP[val] || val || '-'
			},
			formatTargetType(val) {
				return val === '1' ? '指定班级' : '全校'
			},
			formatPoints(p) {
				if (p.pointMode === 'range') {
					return `${p.minPoints || 0}~${p.maxPoints || 0}分`
				}
				return `${p.points || 0}分`
			}
		}
	}
</script>

<style scoped lang="scss">
	.page-container {
		min-height: 100vh;
		background: #f5f6f8;
		padding: 12px;
		padding-bottom: 80px;
	}

	.card {
		background: #fff;
		border-radius: 10px;
		padding: 14px;
		margin-bottom: 12px;
	}

	.card-title {
		font-size: 16px;
		font-weight: 600;
		color: #333;
		margin-bottom: 12px;
	}

	.info-row {
		display: flex;
		padding: 8px 0;
		border-bottom: 1px solid #f5f5f5;
		font-size: 14px;
	}

	.info-label {
		color: #999;
		width: 80px;
	}

	.info-value {
		flex: 1;
		color: #333;
	}

	.phase-item {
		display: flex;
		justify-content: space-between;
		padding: 8px 0;
		border-bottom: 1px solid #f5f5f5;
		font-size: 14px;
	}

	.phase-score {
		color: #ff9900;
		font-weight: 600;
	}

	.bottom-bar {
		position: fixed;
		left: 0;
		right: 0;
		bottom: 0;
		display: flex;
		padding: 10px 12px;
		background: #fff;
		border-top: 1px solid #eee;
	}

	.btn {
		flex: 1;
		height: 44px;
		line-height: 44px;
		text-align: center;
		border-radius: 22px;
		font-size: 15px;
	}

	.my-btn {
		background: #f2f3f5;
		color: #666;
		margin-right: 10px;
	}

	.signup {
		background: #2979ff;
		color: #fff;
	}

	.disabled {
		background: #ccc;
		color: #fff;
	}
</style>
