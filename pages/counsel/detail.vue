<template>
	<view class="detail-page">
		<view v-if="loading" class="loading-box">
			<text class="loading-text">加载中...</text>
		</view>

		<view v-else-if="!appointment" class="loading-box">
			<text class="loading-text">预约记录不存在</text>
		</view>

		<view v-else>
			<view :class="['status-hero', statusClass]">
				<text class="status-title">{{ statusText }}</text>
				<text class="status-desc">{{ statusDesc }}</text>
				<text class="status-time" v-if="appointment.scheduledStart">{{ formatFull(appointment.scheduledStart) }}</text>
			</view>

			<view class="block">
				<text class="block-title">咨询安排</text>
				<view class="info-line">
					<text class="info-label">服务项目</text>
					<text class="info-value">{{ appointment.serviceName || '--' }}</text>
				</view>
				<view class="info-line">
					<text class="info-label">咨询时间</text>
					<text class="info-value">{{ formatRange(appointment.scheduledStart, appointment.scheduledEnd) }}</text>
				</view>
				<view class="info-line">
					<text class="info-label">咨询师</text>
					<text class="info-value">{{ appointment.counselorName || '待中心安排' }}<text class="info-extra" v-if="appointment.counselorTitle"> · {{ appointment.counselorTitle }}</text></text>
				</view>
				<view class="info-line">
					<text class="info-label">咨询地点</text>
					<text class="info-value">{{ appointment.roomName || '待安排' }}<text class="info-extra" v-if="appointment.roomLocation"> · {{ appointment.roomLocation }}</text></text>
				</view>
			</view>

			<view class="block">
				<text class="block-title">预约信息</text>
				<view class="info-line">
					<text class="info-label">预约编号</text>
					<text class="info-value mono">{{ appointment.appointmentNo || '--' }}</text>
				</view>
				<view class="info-line">
					<text class="info-label">紧急程度</text>
					<text :class="['urgency-tag', 'urg-' + String(appointment.urgency || 'NORMAL').toLowerCase()]">{{ urgencyText }}</text>
				</view>
				<view class="info-line" v-if="appointment.createTime">
					<text class="info-label">提交时间</text>
					<text class="info-value">{{ appointment.createTime }}</text>
				</view>
				<view class="info-line" v-if="appointment.remark">
					<text class="info-label">中心备注</text>
					<text class="info-value">{{ appointment.remark }}</text>
				</view>
			</view>

			<view class="block" v-if="appointment && appointment.status === 'COMPLETED'">
				<view class="consent-title-row">
					<text class="block-title">辅导员协同</text>
					<text :class="['consent-badge', collabConsent && collabConsent.granted ? 'on' : 'off']">
						{{ collabConsent && collabConsent.granted ? '已授权' : '未授权' }}
					</text>
				</view>
				<view class="consent-copy">{{ collabMessage }}</view>
				<view class="consent-row">
					<view class="consent-person">
						<text class="consent-name">{{ collabConsent && collabConsent.granteeName ? collabConsent.granteeName : '班级辅导员' }}</text>
						<text class="consent-sub">{{ collabConsent && collabConsent.granted ? '可查看协同摘要并跟进' : '仅在你授权后可见' }}</text>
					</view>
					<switch
						:checked="!!(collabConsent && collabConsent.granted)"
						:disabled="consentSaving || !collabConsent || !collabConsent.summaryReady"
						color="#2563eb"
						@change="toggleCollabConsent" />
				</view>
				<view class="consent-note">只共享关注事项和建议，不含咨询原文、诊断和量表原始作答。</view>
				<view class="consent-note" v-if="collabConsent && collabConsent.granted && collabConsent.validTo">
					授权有效期至 {{ formatFull(collabConsent.validTo) }}，可随时撤回。
				</view>
			</view>

			<view class="block">
				<text class="block-title">我的诉求</text>
				<view class="content-item">
					<text class="content-label">咨询事由</text>
					<text class="content-text">{{ appointment.reason || '仅中心端可查看' }}</text>
				</view>
				<view class="content-item" v-if="appointment.background">
					<text class="content-label">背景补充</text>
					<text class="content-text">{{ appointment.background }}</text>
				</view>
				<view class="content-item" v-if="appointment.contactPhone">
					<text class="content-label">联系电话</text>
					<text class="content-text">{{ appointment.contactPhone }}</text>
				</view>
			</view>

			<view class="privacy-box">
				<u-icon name="lock" size="15" color="#64748b"></u-icon>
				<text class="privacy-text">咨询事由与背景加密保存，仅咨询师及心理咨询中心工作人员在服务职责范围内查看。涉及安全风险时，按学校危机干预流程处理。</text>
			</view>

			<view class="action-wrap" v-if="canCancel">
				<button class="cancel-btn" @click="cancelAppointment">取消预约</button>
			</view>
		</view>
	</view>
</template>

<script>
	import {
		getCounselAppointment,
		cancelCounselAppointment,
		getCounselCollabConsent,
		updateCounselCollabConsent
	} from '@/api/counsel/index.js'
	import requireLogin from '@/mixins/requireLogin.js'

	const STATUS = {
		PENDING: { text: '待中心确认', desc: '预约已提交，请耐心等待中心确认', cls: 'st-pending' },
		CONFIRMED: { text: '咨询已确认', desc: '请提前十分钟到达咨询室', cls: 'st-confirmed' },
		COMPLETED: { text: '本次咨询已完成', desc: '感谢你认真对待自己的感受', cls: 'st-completed' },
		REJECTED: { text: '预约未通过', desc: '中心暂未能安排本次预约，可重新选择时段', cls: 'st-rejected' },
		CANCELED: { text: '预约已取消', desc: '本次预约已取消，可重新预约', cls: 'st-canceled' },
		NO_SHOW: { text: '本次预约爽约', desc: '如仍有需要，请重新提交预约', cls: 'st-rejected' }
	}

	const URGENCY = {
		NORMAL: '一般',
		URGENT: '较急',
		CRISIS: '紧急'
	}

	export default {
		mixins: [requireLogin],
		data() {
			return {
				id: '',
				appointment: null,
				loading: true,
				collabConsent: null,
				consentSaving: false
			}
		},
		computed: {
			statusMeta() {
				const status = this.appointment ? this.appointment.status : ''
				return STATUS[status] || { text: status || '未知状态', desc: '', cls: 'st-canceled' }
			},
			statusText() {
				return this.statusMeta.text
			},
			statusDesc() {
				return this.statusMeta.desc
			},
			statusClass() {
				return this.statusMeta.cls
			},
			urgencyText() {
				const urgency = this.appointment ? this.appointment.urgency : ''
				return URGENCY[urgency] || urgency || '--'
			},
			canCancel() {
				if (!this.appointment) return false
				if (['PENDING', 'CONFIRMED'].indexOf(this.appointment.status) < 0) return false
				const start = this.parseTime(this.appointment.scheduledStart)
				return start && start.getTime() > Date.now()
			},
			collabMessage() {
				if (!this.collabConsent) {
					return '咨询结束后，如咨询师生成协同摘要，可在这里决定是否授权辅导员查看。'
				}
				return this.collabConsent.message
					|| '咨询结束后，如咨询师生成协同摘要，可在这里决定是否授权辅导员查看。'
			}
		},
		onLoad(options) {
			this.id = options && options.id ? String(options.id) : ''
			if (!this.id) {
				this.loading = false
				return
			}
			this.loadDetail()
		},
		methods: {
			async loadDetail() {
				this.loading = true
				try {
					const res = await getCounselAppointment(this.id)
					this.appointment = res.data.data || null
					if (this.appointment && this.appointment.status === 'COMPLETED') {
						await this.loadCollabConsent()
					}
				} catch (e) {
					this.appointment = null
				} finally {
					this.loading = false
				}
			},
			async loadCollabConsent() {
				try {
					const res = await getCounselCollabConsent(this.id)
					this.collabConsent = res.data.data || null
				} catch (e) {
					this.collabConsent = null
				}
			},
			toggleCollabConsent(event) {
				const granted = !!event.detail.value
				const action = granted ? '授权' : '撤回'
				const content = granted
					? '授权后班级辅导员可看到本次咨询的协同事项和建议，不包含咨询原文。确认授权？'
					: '撤回后辅导员将不能继续查看协同摘要，相关跟进任务会取消。确认撤回？'
				uni.showModal({
					title: action + '协同授权',
					content,
					confirmText: '确认' + action,
					confirmColor: granted ? '#2563eb' : '#dc2626',
					success: async res => {
						if (!res.confirm) return
						this.consentSaving = true
						try {
							const result = await updateCounselCollabConsent(this.id, granted)
							this.collabConsent = result.data.data || this.collabConsent
							uni.showToast({ title: granted ? '已授权' : '已撤回授权', icon: 'success' })
						} catch (e) {
							await this.loadCollabConsent()
						} finally {
							this.consentSaving = false
						}
					}
				})
			},
			cancelAppointment() {
				uni.showModal({
					title: '取消预约',
					content: '距咨询开始不足 24 小时将无法自助取消。确定取消这次预约吗？',
					confirmText: '确定取消',
					confirmColor: '#dc2626',
					success: async res => {
						if (!res.confirm) return
						try {
							await cancelCounselAppointment(this.id, '学生取消预约')
							uni.showToast({ title: '预约已取消', icon: 'success' })
							this.loadDetail()
						} catch (e) {
							// 拦截器已提示
						}
					}
				})
			},
			parseTime(value) {
				if (!value) return null
				const date = new Date(String(value).replace(/-/g, '/'))
				return isNaN(date.getTime()) ? null : date
			},
			formatFull(value) {
				if (!value) return ''
				const text = String(value)
				return text.slice(0, 10) + ' ' + text.slice(11, 16)
			},
			formatRange(start, end) {
				if (!start) return '--'
				const startText = String(start)
				const endText = String(end || '')
				const head = startText.slice(0, 10) + ' ' + startText.slice(11, 16)
				return endText ? head + ' - ' + endText.slice(11, 16) : head
			}
		}
	}
</script>

<style lang="scss" scoped>
	.detail-page {
		min-height: 100vh;
		background: #f4f7fb;
		padding: 24rpx 24rpx 60rpx;
		box-sizing: border-box;
	}

	.loading-box {
		padding: 180rpx 0;
		display: flex;
		justify-content: center;
	}

	.loading-text {
		font-size: 26rpx;
		color: #94a3b8;
	}

	.status-hero {
		border-radius: 16rpx;
		padding: 34rpx 28rpx;
		margin-bottom: 24rpx;
		background: linear-gradient(135deg, #2563eb 0%, #0d9488 100%);
	}

	.st-pending {
		background: linear-gradient(135deg, #c2410c 0%, #ea580c 100%);
	}

	.st-confirmed {
		background: linear-gradient(135deg, #047857 0%, #0d9488 100%);
	}

	.st-completed {
		background: linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%);
	}

	.st-rejected {
		background: linear-gradient(135deg, #b91c1c 0%, #ef4444 100%);
	}

	.st-canceled {
		background: linear-gradient(135deg, #475569 0%, #94a3b8 100%);
	}

	.status-title {
		display: block;
		font-size: 38rpx;
		font-weight: 700;
		color: #ffffff;
	}

	.status-desc {
		display: block;
		margin-top: 10rpx;
		font-size: 24rpx;
		color: rgba(255, 255, 255, 0.88);
	}

	.status-time {
		display: block;
		margin-top: 20rpx;
		font-size: 27rpx;
		color: rgba(255, 255, 255, 0.95);
		font-weight: 500;
	}

	.block {
		background: #ffffff;
		border-radius: 16rpx;
		padding: 24rpx;
		margin-bottom: 20rpx;
		box-shadow: 0 4rpx 16rpx rgba(15, 23, 42, 0.04);
	}

	.block-title {
		display: block;
		font-size: 29rpx;
		font-weight: 600;
		color: #0f172a;
		margin-bottom: 18rpx;
	}

	.info-line {
		display: flex;
		align-items: flex-start;
		padding: 12rpx 0;
		border-bottom: 2rpx solid #f6f8fb;
	}

	.info-line:last-child {
		border-bottom: none;
	}

	.info-label {
		width: 150rpx;
		font-size: 24rpx;
		color: #94a3b8;
		flex-shrink: 0;
	}

	.info-value {
		flex: 1;
		font-size: 25rpx;
		color: #334155;
		line-height: 1.55;
		word-break: break-all;
	}

	.info-extra {
		font-size: 22rpx;
		color: #94a3b8;
	}

	.mono {
		font-size: 22rpx;
		color: #64748b;
	}

	.urgency-tag {
		font-size: 22rpx;
		padding: 2rpx 14rpx;
		border-radius: 8rpx;
		background: #f1f5f9;
		color: #475569;
	}

	.urg-urgent {
		background: #fff7ed;
		color: #c2410c;
	}

	.urg-crisis {
		background: #fef2f2;
		color: #b91c1c;
	}

	.content-item {
		margin-bottom: 20rpx;
	}

	.content-item:last-child {
		margin-bottom: 0;
	}

	.content-label {
		display: block;
		font-size: 22rpx;
		color: #94a3b8;
		margin-bottom: 8rpx;
	}

	.content-text {
		display: block;
		font-size: 25rpx;
		color: #334155;
		line-height: 1.7;
		background: #f8fafc;
		border-radius: 12rpx;
		padding: 16rpx 18rpx;
		word-break: break-all;
	}

	.consent-title-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 12rpx;
	}

	.consent-badge {
		font-size: 20rpx;
		padding: 4rpx 14rpx;
		border-radius: 999rpx;
	}

	.consent-badge.on {
		background: #ecfdf5;
		color: #047857;
	}

	.consent-badge.off {
		background: #fff7ed;
		color: #c2410c;
	}

	.consent-copy {
		font-size: 23rpx;
		color: #475569;
		line-height: 1.7;
		margin-bottom: 18rpx;
	}

	.consent-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 20rpx;
		padding: 18rpx;
		background: #f8fafc;
		border-radius: 12rpx;
	}

	.consent-person {
		display: flex;
		flex-direction: column;
		gap: 6rpx;
		min-width: 0;
	}

	.consent-name {
		font-size: 26rpx;
		color: #0f172a;
		font-weight: 600;
	}

	.consent-sub {
		font-size: 21rpx;
		color: #94a3b8;
	}

	.consent-note {
		margin-top: 12rpx;
		font-size: 20rpx;
		color: #94a3b8;
		line-height: 1.6;
	}

	.privacy-box {
		display: flex;
		align-items: flex-start;
		background: #eef6ff;
		border-radius: 12rpx;
		padding: 18rpx;
		margin-bottom: 24rpx;
	}

	.privacy-text {
		margin-left: 10rpx;
		font-size: 21rpx;
		color: #475569;
		line-height: 1.6;
	}

	.action-wrap {
		padding: 10rpx 0 20rpx;
	}

	.cancel-btn {
		width: 100%;
		height: 84rpx;
		line-height: 84rpx;
		border-radius: 42rpx;
		border: 2rpx solid #fecaca;
		background: #ffffff;
		color: #b91c1c;
		font-size: 27rpx;
	}
</style>
