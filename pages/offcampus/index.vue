<template>
	<view class="page-container">
		<!-- 顶部统计 -->
		<view class="stats-bar">
			<view class="stats-item">
				<text class="stats-num">{{ list.length }}</text>
				<text class="stats-label">申请总数</text>
			</view>
			<view class="stats-item">
				<text class="stats-num green">{{ approvedCount }}</text>
				<text class="stats-label">已通过</text>
			</view>
			<view class="stats-item">
				<text class="stats-num orange">{{ pendingCount }}</text>
				<text class="stats-label">待审批</text>
			</view>
		</view>

		<!-- 申请列表 -->
		<scroll-view scroll-y class="list-scroll" @scrolltolower="loadMore">
			<view class="list-item" v-for="item in list" :key="item.id" @click="goDetail(item.id)">
				<view class="item-header">
					<text class="item-title">{{ item.studentName }}</text>
					<text :class="['item-status', getStatusClass(item.status)]">{{ formatStatus(item.status) }}</text>
				</view>
				<view class="item-row">
					<text class="item-label">申请编号</text>
					<text class="item-value">{{ item.applyNo }}</text>
				</view>
				<view class="item-row">
					<text class="item-label">外宿类型</text>
					<text class="item-value">{{ formatHousingType(item.housingType) }}</text>
				</view>
				<view class="item-row">
					<text class="item-label">地址</text>
					<text class="item-value ellipsis">{{ item.address }}</text>
				</view>
				<view class="item-row">
					<text class="item-label">学年</text>
					<text class="item-value">{{ item.academicYear }}</text>
				</view>
				<view class="item-row" v-if="item.startDate">
					<text class="item-label">外宿期限</text>
					<text class="item-value">{{ item.startDate }} 至 {{ item.endDate }}</text>
				</view>
			</view>
			<view class="empty-tip" v-if="!loading && list.length === 0">
				<text>暂无外宿申请记录</text>
			</view>
			<uni-load-more :status="loadStatus" v-else></uni-load-more>
		</scroll-view>

		<!-- 浮动新增按钮 -->
		<view class="fab-btn" @click="goAdd">
			<text class="fab-icon">+</text>
		</view>
	</view>
</template>

<script>
	import { getMyOffcampus } from '@/api/affair/offcampus'
	import requireLogin from '@/mixins/requireLogin.js'

	const STATUS_MAP = {
		'pending_verify': '待核实',
		'pending_counselor': '待辅导员审批',
		'pending_secretary': '待书记审批',
		'pending_affairs': '待学生处审批',
		'approved': '已通过',
		'rejected': '已驳回'
	}
	const STATUS_CLASS_MAP = {
		'pending_verify': 'status-pending',
		'pending_counselor': 'status-pending',
		'pending_secretary': 'status-pending',
		'pending_affairs': 'status-pending',
		'approved': 'status-approved',
		'rejected': 'status-rejected'
	}
	const HOUSING_TYPE_MAP = {
		'own_house': '自有住房',
		'rent_house': '租房'
	}

	export default {
		mixins: [requireLogin],
		data() {
			return {
				list: [],
				loading: false,
				loadStatus: 'more'
			}
		},
		computed: {
			approvedCount() {
				return this.list.filter(i => i.status === 'approved').length
			},
			pendingCount() {
				return this.list.filter(i => i.status && i.status.startsWith('pending')).length
			}
		},
		onShow() {
			this.loadList()
		},
		methods: {
			loadList() {
				this.loading = true
				this.loadStatus = 'loading'
				getMyOffcampus().then(res => {
					this.list = (res.data && res.data.rows) || []
					this.loadStatus = 'noMore'
				}).catch(() => {
					uni.showToast({ title: '加载失败', icon: 'none' })
					this.loadStatus = 'more'
				}).finally(() => {
					this.loading = false
				})
			},
			loadMore() {},
			goDetail(id) {
				uni.navigateTo({ url: '/pages/offcampus/detail?id=' + id })
			},
			goAdd() {
				uni.navigateTo({ url: '/pages/offcampus/add' })
			},
			formatStatus(val) {
				return STATUS_MAP[val] || val || '未知'
			},
			getStatusClass(val) {
				return STATUS_CLASS_MAP[val] || 'status-pending'
			},
			formatHousingType(val) {
				return HOUSING_TYPE_MAP[val] || val || '-'
			}
		}
	}
</script>

<style scoped lang="scss">
	.page-container {
		display: flex;
		flex-direction: column;
		height: 100vh;
		background-color: #f5f6f8;
	}
	.stats-bar {
		display: flex;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		padding: 16px 20px;
		color: #fff;
	}
	.stats-item {
		flex: 1;
		text-align: center;
	}
	.stats-num {
		font-size: 22px;
		font-weight: 700;
		display: block;
	}
	.stats-num.green { color: #81c784; }
	.stats-num.orange { color: #ffb74d; }
	.stats-label {
		font-size: 12px;
		opacity: 0.85;
	}
	.list-scroll {
		flex: 1;
		padding: 10px 12px;
	}
	.list-item {
		background: #fff;
		border-radius: 10px;
		padding: 14px;
		margin-bottom: 10px;
	}
	.item-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 8px;
	}
	.item-title {
		font-size: 16px;
		font-weight: 600;
		color: #333;
	}
	.item-status {
		font-size: 12px;
		padding: 2px 8px;
		border-radius: 10px;
	}
	.status-pending {
		background: #fff3e0;
		color: #ff9800;
	}
	.status-approved {
		background: #e8f5e9;
		color: #4caf50;
	}
	.status-rejected {
		background: #ffebee;
		color: #f44336;
	}
	.item-row {
		display: flex;
		margin-top: 5px;
		font-size: 13px;
	}
	.item-label {
		color: #999;
		width: 70px;
		flex-shrink: 0;
	}
	.item-value {
		color: #333;
		flex: 1;
	}
	.ellipsis {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.empty-tip {
		text-align: center;
		color: #999;
		padding: 40px 0;
	}
	.fab-btn {
		position: fixed;
		right: 20px;
		bottom: 80px;
		width: 50px;
		height: 50px;
		border-radius: 50%;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 4px 12px rgba(102, 126, 234, 0.5);
	}
	.fab-icon {
		color: #fff;
		font-size: 28px;
		line-height: 1;
	}
</style>
