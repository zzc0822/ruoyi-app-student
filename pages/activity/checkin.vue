<template>
	<view class="checkin-page">
		<view class="summary">
			<text class="eyebrow">ACTIVITY CHECK-IN</text>
			<text class="title">{{ checkin.activityTitle || '活动签到' }}</text>
			<text class="deadline" v-if="checkin.deadline">扫码截止：{{ formatDateTime(checkin.deadline) }}</text>
			<view class="point-line">
				<text>完成签到预计获得</text>
				<text class="points">+{{ checkin.estimatedPoints || 0 }} 分</text>
			</view>
		</view>

		<view class="status-panel" v-if="ticketValid">
			<view class="status-row">
				<text class="status-label">当前身份</text>
				<text class="status-value">已通过活动报名名单校验</text>
			</view>
			<view class="status-row">
				<text class="status-label">当前考勤</text>
				<text class="status-value">{{ attendanceLabel(checkin.signStatus || checkin.attendanceStatus) }}</text>
			</view>
			<view class="notice">
				请确认本人已到达活动现场。同一活动只能签到一次，迟到将按活动规则记录。
			</view>
			<button class="confirm-button" :loading="submitting" :disabled="alreadySigned" @click="confirmSign">
				{{ alreadySigned ? '已完成签到' : '确认本人签到' }}
			</button>
		</view>

		<view class="fallback-panel" v-else>
			<text class="fallback-title">二维码已失效或无法确认</text>
			<text class="fallback-desc">可输入活动负责人展示的 6 位签到码继续签到。</text>
			<input class="code-input" type="number" maxlength="6" v-model="signCode" placeholder="输入 6 位签到码" />
			<button class="confirm-button" :loading="submitting" @click="confirmByCode">使用签到码签到</button>
		</view>

		<view class="appeal-entry" v-if="canAppeal" @click="openAppeal">
			<text>对缺勤结果有异议？提交异常申诉</text>
			<text class="arrow">›</text>
		</view>
	</view>
</template>

<script>
	import {
		getActivityCheckinTicket,
		signActivityByQr,
		signActivityByCode,
		submitActivityAppeal
	} from '@/api/attendance/sign'
	import requireLogin from '@/mixins/requireLogin.js'

	export default {
		mixins: [requireLogin],
		data() {
			return {
				sessionId: null,
				ticket: '',
				signCode: '',
				checkin: {},
				ticketValid: false,
				submitting: false
			}
		},
		computed: {
			alreadySigned() {
				return ['signed', 'late', 'leave', 'excused'].includes(this.checkin.signStatus || this.checkin.attendanceStatus)
			},
			canAppeal() {
				const status = this.checkin.attendanceStatus || this.checkin.signStatus
				return ['absent', 'pending_absent'].includes(status)
			}
		},
		onLoad(options) {
			this.sessionId = Number(options.sessionId)
			this.ticket = decodeURIComponent(options.ticket || '')
			if (!this.sessionId || !this.ticket) {
				uni.showToast({ title: '签到二维码缺少必要参数', icon: 'none' })
				return
			}
			this.loadTicket()
		},
		methods: {
			async loadTicket() {
				try {
					const res = await getActivityCheckinTicket(this.sessionId, this.ticket)
					const payload = res.data || {}
					if (payload.code !== 200) {
						this.ticketValid = false
						uni.showToast({ title: payload.msg || '二维码无效或已过期', icon: 'none' })
						return
					}
					this.checkin = payload.data || {}
					this.ticketValid = true
				} catch (e) {
					this.ticketValid = false
				}
			},
			async confirmSign() {
				if (this.submitting || this.alreadySigned) return
				this.submitting = true
				try {
					const res = await signActivityByQr(this.sessionId, this.ticket)
					const payload = res.data || {}
					if (payload.code !== 200) {
						this.ticketValid = false
					}
					this.handleSignResult(payload)
				} finally {
					this.submitting = false
				}
			},
			async confirmByCode() {
				if (this.submitting) return
				if (!/^\d{6}$/.test(this.signCode)) {
					uni.showToast({ title: '请输入 6 位签到码', icon: 'none' })
					return
				}
				this.submitting = true
				try {
					const res = await signActivityByCode(this.sessionId, this.signCode)
					this.handleSignResult(res.data || {})
				} finally {
					this.submitting = false
				}
			},
			handleSignResult(payload) {
				if (payload.code !== 200) {
					uni.showToast({ title: payload.msg || '签到失败', icon: 'none' })
					return
				}
				this.checkin.signStatus = payload.finalStatus
				uni.showToast({
					title: payload.finalStatus === 'late' ? '签到成功（迟到）' : '签到成功',
					icon: 'success'
				})
			},
			openAppeal() {
				uni.showModal({
					title: '异常申诉',
					editable: true,
					placeholderText: '请说明未签到原因，并准备佐证说明',
					success: async res => {
						if (!res.confirm || !String(res.content || '').trim()) return
						try {
							const response = await submitActivityAppeal(
								this.checkin.activityId,
								String(res.content).trim(),
								''
							)
							const payload = response.data || {}
							if (payload.code === 200) {
								this.checkin.attendanceStatus = 'appeal_pending'
								uni.showToast({ title: '申诉已提交', icon: 'success' })
							} else {
								uni.showToast({ title: payload.msg || '申诉提交失败', icon: 'none' })
							}
						} catch (e) {}
					}
				})
			},
			attendanceLabel(status) {
				return {
					pending: '待签到',
					pending_absent: '待确认缺勤',
					signed: '正常',
					late: '迟到',
					leave: '请假',
					excused: '免签',
					absent: '缺勤',
					appeal_pending: '申诉处理中'
				}[status] || '待签到'
			},
			formatDateTime(value) {
				if (!value) return '-'
				return String(value).substring(0, 16)
			}
		}
	}
</script>

<style scoped lang="scss">
	.checkin-page {
		min-height: 100vh;
		background: #f3f6fb;
		padding: 28rpx;
		box-sizing: border-box;
	}
	.summary {
		background: #2457d6;
		color: #fff;
		border-radius: 18rpx;
		padding: 34rpx 30rpx;
	}
	.eyebrow {
		display: block;
		font-size: 20rpx;
		letter-spacing: 2rpx;
		opacity: 0.7;
	}
	.title {
		display: block;
		font-size: 42rpx;
		font-weight: 700;
		margin-top: 14rpx;
	}
	.deadline {
		display: block;
		font-size: 24rpx;
		margin-top: 14rpx;
		opacity: 0.82;
	}
	.point-line {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-top: 28rpx;
		font-size: 25rpx;
	}
	.points {
		font-size: 34rpx;
		font-weight: 700;
		color: #ffe08a;
	}
	.status-panel,
	.fallback-panel {
		background: #fff;
		border-radius: 16rpx;
		padding: 28rpx;
		margin-top: 24rpx;
	}
	.status-row {
		display: flex;
		justify-content: space-between;
		padding: 14rpx 0;
		border-bottom: 1rpx solid #eef1f5;
		font-size: 26rpx;
	}
	.status-label {
		color: #7a8494;
	}
	.status-value {
		color: #222;
	}
	.notice {
		background: #f6f8fc;
		color: #596579;
		font-size: 24rpx;
		line-height: 1.7;
		padding: 20rpx;
		border-radius: 10rpx;
		margin-top: 24rpx;
	}
	.confirm-button {
		margin-top: 28rpx;
		background: #2457d6;
		color: #fff;
		border-radius: 44rpx;
		font-size: 30rpx;
	}
	.confirm-button[disabled] {
		background: #b8c4dd;
		color: #fff;
	}
	.fallback-title {
		display: block;
		font-size: 32rpx;
		font-weight: 600;
		color: #303746;
	}
	.fallback-desc {
		display: block;
		font-size: 24rpx;
		color: #7a8494;
		margin-top: 12rpx;
	}
	.code-input {
		height: 88rpx;
		border: 1rpx solid #dce2ec;
		border-radius: 10rpx;
		margin-top: 24rpx;
		padding: 0 24rpx;
		font-size: 32rpx;
		letter-spacing: 8rpx;
		background: #fafbfd;
	}
	.appeal-entry {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-top: 24rpx;
		padding: 24rpx 28rpx;
		background: #fff;
		border-radius: 14rpx;
		color: #596579;
		font-size: 25rpx;
	}
	.arrow {
		font-size: 36rpx;
		color: #a4adbd;
	}
</style>
