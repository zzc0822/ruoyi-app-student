<template>
	<view class="page-container" v-if="detail">
		<!-- 状态卡片 -->
		<view :class="['status-card', 'status-bg-' + statusGroup]">
			<text class="status-text">{{ formatStatus(detail.status) }}</text>
			<text class="status-desc">{{ statusDesc }}</text>
		</view>

		<!-- 学生信息 -->
		<view class="card">
			<view class="card-title">学生信息</view>
			<view class="info-row">
				<text class="info-label">学号</text>
				<text class="info-value">{{ detail.xh }}</text>
			</view>
			<view class="info-row">
				<text class="info-label">姓名</text>
				<text class="info-value">{{ detail.studentName }}</text>
			</view>
			<view class="info-row">
				<text class="info-label">班级</text>
				<text class="info-value">{{ detail.className }}</text>
			</view>
			<view class="info-row">
				<text class="info-label">申请编号</text>
				<text class="info-value">{{ detail.applyNo }}</text>
			</view>
			<view class="info-row">
				<text class="info-label">学年</text>
				<text class="info-value">{{ detail.academicYear || '-' }}</text>
			</view>
		</view>

		<!-- 外宿信息 -->
		<view class="card">
			<view class="card-title">外宿信息</view>
			<view class="info-row">
				<text class="info-label">外宿类型</text>
				<text class="info-value">{{ formatHousingType(detail.housingType) }}</text>
			</view>
			<view class="info-row" v-if="detail.startDate">
				<text class="info-label">外宿期限</text>
				<text class="info-value">{{ detail.startDate }} 至 {{ detail.endDate }}</text>
			</view>
			<view class="info-row">
				<text class="info-label">外宿地址</text>
				<text class="info-value">{{ detail.address }}</text>
			</view>
			<offcampus-location :saved="detail" :auto-preview="false" />
			<view class="info-row">
				<text class="info-label">外宿理由</text>
				<text class="info-value">{{ detail.applyReason }}</text>
			</view>
			<view class="info-row" v-if="detail.transportType">
				<text class="info-label">交通方式</text>
				<text class="info-value">{{ formatTransport(detail.transportType) }}</text>
			</view>
		</view>

		<!-- 佐证材料 -->
		<view class="card" v-if="hasMaterials">
			<view class="card-title">佐证材料</view>
			<!-- 房产证/租房合同 -->
			<view v-if="detail.housingType === 'own_house' && detail.propertyCert" class="material-section">
				<text class="material-label">房产证</text>
				<image :src="detail.propertyCert" class="material-img" mode="aspectFill" @click="previewImage(detail.propertyCert)" />
			</view>
			<view v-if="(detail.housingType === 'own_house' || detail.housingType === 'relative') && detail.relationCert" class="material-section">
				<text class="material-label">关系证明</text>
				<image :src="detail.relationCert" class="material-img" mode="aspectFill" @click="previewImage(detail.relationCert)" />
			</view>
			<view v-if="detail.housingType === 'rent_house' && detail.rentContract" class="material-section">
				<text class="material-label">租房合同</text>
				<image :src="detail.rentContract" class="material-img" mode="aspectFill" @click="previewImage(detail.rentContract)" />
			</view>
			<!-- 理由佐证照片 -->
			<view v-if="reasonPhotoList.length > 0" class="material-section">
				<text class="material-label">理由佐证照片</text>
				<view class="photo-grid">
					<image v-for="(p, idx) in reasonPhotoList" :key="idx" :src="p" class="photo-thumb" mode="aspectFill" @click="previewPhotoList(reasonPhotoList, idx)" />
				</view>
			</view>
			<!-- 住宿环境照片 -->
			<view v-if="housingPhotoList.length > 0" class="material-section">
				<text class="material-label">住宿环境照片</text>
				<view class="photo-grid">
					<image v-for="(p, idx) in housingPhotoList" :key="idx" :src="p" class="photo-thumb" mode="aspectFill" @click="previewPhotoList(housingPhotoList, idx)" />
				</view>
			</view>
			<!-- 交通证明 -->
			<view v-if="detail.transportProof" class="material-section">
				<text class="material-label">交通证明</text>
				<image :src="detail.transportProof" class="material-img" mode="aspectFill" @click="previewImage(detail.transportProof)" />
			</view>
		</view>

		<!-- 审批流程时间线 -->
		<view class="card">
			<view class="card-title">审批流程</view>
			<view class="timeline">
				<!-- 提交申请 -->
				<view class="timeline-item timeline-done">
					<view class="timeline-dot"></view>
					<view class="timeline-line"></view>
					<view class="timeline-content">
						<text class="timeline-title">提交申请</text>
						<text class="timeline-info">{{ detail.studentName }} 提交外宿申请</text>
						<text class="timeline-time">{{ detail.createTime }}</text>
					</view>
				</view>
				<!-- 现场核实 -->
				<view :class="['timeline-item', verifyClass]">
					<view class="timeline-dot"></view>
					<view class="timeline-line"></view>
					<view class="timeline-content">
						<text class="timeline-title">现场核实</text>
						<text class="timeline-info" v-if="detail.verifyRemark">{{ detail.verifyRemark }}</text>
						<text class="timeline-info" v-else>{{ verifyStatusText }}</text>
						<text class="timeline-time" v-if="detail.verifyTime">{{ detail.verifyTime }}</text>
					</view>
				</view>
				<!-- 辅导员审批 -->
				<view :class="['timeline-item', counselorClass]">
					<view class="timeline-dot"></view>
					<view class="timeline-line"></view>
					<view class="timeline-content">
						<text class="timeline-title">辅导员审批</text>
						<text class="timeline-info" v-if="detail.counselorOpinion">{{ detail.counselorOpinion }}</text>
						<text class="timeline-info" v-else-if="detail.status === 'pending_counselor'">等待辅导员审批</text>
						<text class="timeline-info" v-else>未处理</text>
						<text class="timeline-time" v-if="detail.counselorTime">{{ detail.counselorTime }}</text>
					</view>
				</view>
				<!-- 书记审批 -->
				<view :class="['timeline-item', secretaryClass]">
					<view class="timeline-dot"></view>
					<view class="timeline-line"></view>
					<view class="timeline-content">
						<text class="timeline-title">书记审批</text>
						<text class="timeline-info" v-if="detail.secretaryOpinion">{{ detail.secretaryOpinion }}</text>
						<text class="timeline-info" v-else-if="detail.status === 'pending_secretary'">等待书记审批</text>
						<text class="timeline-info" v-else-if="isAfterCounselor">待处理</text>
						<text class="timeline-info" v-else>未到达</text>
						<text class="timeline-time" v-if="detail.secretaryTime">{{ detail.secretaryTime }}</text>
					</view>
				</view>
				<!-- 学生处审批 -->
				<view :class="['timeline-item', affairsClass]">
					<view class="timeline-dot"></view>
					<view class="timeline-content">
						<text class="timeline-title">学生处审批</text>
						<text class="timeline-info" v-if="detail.studentAffairsOpinion">{{ detail.studentAffairsOpinion }}</text>
						<text class="timeline-info" v-else-if="detail.status === 'pending_affairs'">等待学生处审批</text>
						<text class="timeline-info" v-else-if="isAfterSecretary">待处理</text>
						<text class="timeline-info" v-else>未到达</text>
						<text class="timeline-time" v-if="detail.studentAffairsTime">{{ detail.studentAffairsTime }}</text>
					</view>
				</view>
			</view>
		</view>

		<!-- 审批记录列表 -->
		<view class="card" v-if="detail.approvalList && detail.approvalList.length > 0">
			<view class="card-title">审批记录</view>
			<view class="approval-item" v-for="(a, idx) in detail.approvalList" :key="idx">
				<view class="approval-header">
					<text class="approval-level">{{ formatApprovalLevel(a.approvalLevel) }}</text>
					<text :class="['approval-action', a.action === 'approve' ? 'action-pass' : 'action-reject']">
						{{ a.action === 'approve' ? '通过' : '驳回' }}
					</text>
				</view>
				<text class="approval-opinion" v-if="a.opinion">意见：{{ a.opinion }}</text>
				<text class="approval-info">{{ a.approverName }} · {{ a.createTime }}</text>
			</view>
		</view>
	</view>
</template>

<script>
	import { getOffcampusDetail } from '@/api/affair/offcampus'
	import requireLogin from '@/mixins/requireLogin.js'
	import OffcampusLocation from '@/components/offcampus-location/offcampus-location.vue'

	const STATUS_MAP = {
		'pending_verify': '待核实',
		'pending_counselor': '待辅导员审批',
		'pending_secretary': '待书记审批',
		'pending_affairs': '待学生处审批',
		'approved': '已通过',
		'rejected': '已驳回'
	}
	const HOUSING_TYPE_MAP = { 'own_house': '自有住房', 'rent_house': '租房' }
	const TRANSPORT_MAP = { walk: '步行', bus: '公交车', metro: '地铁', electric_bike: '电动车', motorcycle: '摩托车', car: '汽车', other: '其他' }
	const APPROVAL_LEVEL_MAP = { verify: '现场核实', counselor: '辅导员', secretary: '书记', affairs: '学生处' }

	export default {
		components: { OffcampusLocation },
		mixins: [requireLogin],
		data() {
			return {
				detailId: null,
				detail: null
			}
		},
		computed: {
			statusGroup() {
				if (!this.detail) return 'pending'
				if (this.detail.status === 'approved') return 'approved'
				if (this.detail.status === 'rejected') return 'rejected'
				return 'pending'
			},
			statusDesc() {
				if (!this.detail) return ''
				const s = this.detail.status
				if (s === 'approved') return '您的外宿申请已通过全部审批'
				if (s === 'rejected') return '您的外宿申请未通过审批'
				if (s === 'pending_verify') return '等待老师现场核实'
				return '申请正在审批中，请耐心等待'
			},
			reasonPhotoList() {
				return this.parsePhotos(this.detail?.reasonPhotos)
			},
			housingPhotoList() {
				return this.parsePhotos(this.detail?.housingPhotos)
			},
			hasMaterials() {
				const d = this.detail
				if (!d) return false
				return d.propertyCert || d.relationCert || d.rentContract || d.transportProof || this.reasonPhotoList.length || this.housingPhotoList.length
			},
			verifyClass() {
				const s = this.detail?.status
				if (this.detail?.verifyStatus === 'verified') return 'timeline-done'
				if (s === 'pending_verify') return 'timeline-active'
				return this.isAfterVerify ? 'timeline-done' : 'timeline-pending'
			},
			verifyStatusText() {
				const v = this.detail?.verifyStatus
				if (v === 'verified') return '已核实'
				if (v === 'failed') return '核实未通过'
				return '等待核实'
			},
			counselorClass() {
				const s = this.detail?.status
				if (this.detail?.counselorTime) return 'timeline-done'
				if (s === 'pending_counselor') return 'timeline-active'
				if (s === 'approved' || this.detail?.counselorOpinion) return 'timeline-done'
				return 'timeline-pending'
			},
			secretaryClass() {
				const s = this.detail?.status
				if (this.detail?.secretaryTime) return 'timeline-done'
				if (s === 'pending_secretary') return 'timeline-active'
				if (s === 'approved' || this.detail?.secretaryOpinion) return 'timeline-done'
				return 'timeline-pending'
			},
			affairsClass() {
				const s = this.detail?.status
				if (this.detail?.studentAffairsTime) return 'timeline-done'
				if (s === 'pending_affairs') return 'timeline-active'
				if (s === 'approved' || this.detail?.studentAffairsOpinion) return 'timeline-done'
				return 'timeline-pending'
			},
			isAfterVerify() {
				const s = this.detail?.status
				return ['pending_counselor', 'pending_secretary', 'pending_affairs', 'approved', 'rejected'].includes(s)
			},
			isAfterCounselor() {
				const s = this.detail?.status
				return ['pending_secretary', 'pending_affairs', 'approved'].includes(s)
			},
			isAfterSecretary() {
				const s = this.detail?.status
				return ['pending_affairs', 'approved'].includes(s)
			}
		},
		onLoad(options) {
			this.detailId = Number(options.id)
			this.loadDetail()
		},
		methods: {
			loadDetail() {
				getOffcampusDetail(this.detailId).then(res => {
					if (res.data && res.data.code === 200) {
						this.detail = res.data.data
					}
				}).catch(() => {
					uni.showToast({ title: '加载失败', icon: 'none' })
				})
			},
			parsePhotos(val) {
				if (!val) return []
				try {
					const arr = JSON.parse(val)
					return Array.isArray(arr) ? arr : []
				} catch (e) {
					return []
				}
			},
			formatStatus(val) {
				return STATUS_MAP[val] || val || '未知'
			},
			formatHousingType(val) {
				return HOUSING_TYPE_MAP[val] || val || '-'
			},
			formatTransport(val) {
				return TRANSPORT_MAP[val] || val || '-'
			},
			formatApprovalLevel(val) {
				return APPROVAL_LEVEL_MAP[val] || val || '-'
			},
			previewImage(url) {
				uni.previewImage({ urls: [url], current: url })
			},
			previewPhotoList(list, idx) {
				uni.previewImage({ urls: list, current: list[idx] })
			}
		}
	}
</script>

<style scoped lang="scss">
	.page-container {
		min-height: 100vh;
		background: #f5f6f8;
		padding-bottom: 30rpx;
	}

	.status-card {
		padding: 40rpx 30rpx;
		color: #fff;
	}
	.status-bg-pending { background: linear-gradient(135deg, #f3a044, #ff8c00); }
	.status-bg-approved { background: linear-gradient(135deg, #43a047, #66bb6a); }
	.status-bg-rejected { background: linear-gradient(135deg, #e53935, #ef5350); }
	.status-text { font-size: 36rpx; font-weight: 700; display: block; margin-bottom: 8rpx; }
	.status-desc { font-size: 24rpx; opacity: 0.9; }

	.card {
		background: #fff;
		margin: 16rpx 24rpx;
		border-radius: 12rpx;
		padding: 24rpx;
	}
	.card-title {
		font-size: 30rpx;
		font-weight: 600;
		color: #333;
		margin-bottom: 20rpx;
		padding-left: 16rpx;
		border-left: 6rpx solid #667eea;
	}
	.info-row {
		display: flex;
		padding: 12rpx 0;
		border-bottom: 1rpx solid #f5f5f5;
		font-size: 28rpx;
	}
	.info-row:last-child { border-bottom: none; }
	.info-label { color: #999; width: 160rpx; flex-shrink: 0; }
	.info-value { flex: 1; color: #333; word-break: break-all; }

	/* 佐证材料 */
	.material-section { margin-bottom: 20rpx; }
	.material-label { font-size: 26rpx; color: #666; margin-bottom: 12rpx; display: block; }
	.material-img { width: 200rpx; height: 200rpx; border-radius: 8rpx; }
	.photo-grid { display: flex; flex-wrap: wrap; gap: 12rpx; }
	.photo-thumb { width: 150rpx; height: 150rpx; border-radius: 8rpx; }

	/* 时间线 */
	.timeline { padding-left: 10rpx; }
	.timeline-item {
		display: flex;
		position: relative;
		padding-bottom: 30rpx;
	}
	.timeline-item:last-child { padding-bottom: 0; }
	.timeline-dot {
		width: 20rpx;
		height: 20rpx;
		border-radius: 50%;
		background: #ddd;
		flex-shrink: 0;
		margin-top: 6rpx;
		z-index: 1;
	}
	.timeline-line {
		position: absolute;
		left: 9rpx;
		top: 28rpx;
		bottom: -2rpx;
		width: 2rpx;
		background: #e0e0e0;
	}
	.timeline-item:last-child .timeline-line { display: none; }
	.timeline-content { margin-left: 20rpx; flex: 1; }
	.timeline-title { font-size: 28rpx; font-weight: 600; color: #333; display: block; }
	.timeline-info { font-size: 24rpx; color: #666; display: block; margin-top: 4rpx; }
	.timeline-time { font-size: 22rpx; color: #999; display: block; margin-top: 4rpx; }

	/* 时间线状态 */
	.timeline-done .timeline-dot { background: #43a047; }
	.timeline-done .timeline-line { background: #43a047; }
	.timeline-active .timeline-dot { background: #f3a044; box-shadow: 0 0 0 6rpx rgba(243, 160, 68, 0.2); }
	.timeline-active .timeline-line { background: #e0e0e0; }
	.timeline-pending .timeline-dot { background: #ddd; }

	/* 审批记录 */
	.approval-item {
		padding: 16rpx 0;
		border-bottom: 1rpx solid #f5f5f5;
	}
	.approval-item:last-child { border-bottom: none; }
	.approval-header { display: flex; justify-content: space-between; align-items: center; }
	.approval-level { font-size: 28rpx; font-weight: 600; color: #333; }
	.approval-action { font-size: 24rpx; padding: 4rpx 16rpx; border-radius: 10rpx; }
	.action-pass { background: #e8f5e9; color: #43a047; }
	.action-reject { background: #ffebee; color: #e53935; }
	.approval-opinion { font-size: 24rpx; color: #666; display: block; margin-top: 8rpx; }
	.approval-info { font-size: 22rpx; color: #999; display: block; margin-top: 4rpx; }
</style>
