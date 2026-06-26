<template>
	<view class="page-container">
		<scroll-view scroll-y class="list-scroll" @scrolltolower="loadMore">
			<view class="list-item" v-for="item in list" :key="item.recordId">
				<view class="item-header">
					<text class="item-title">{{ item.activity ? item.activity.title : '活动' }}</text>
					<text :class="['item-status', 'status-' + item.status]">{{ formatStatus(item.status) }}</text>
				</view>
				<view class="item-row" v-if="item.activity">
					<text class="item-label">维度</text>
					<text class="item-value">{{ formatCategory(item.activity.category) }}</text>
				</view>
				<view class="item-row" v-if="item.activity">
					<text class="item-label">时间</text>
					<text class="item-value">{{ formatDate(item.activity.startTime) }} ~ {{ formatDate(item.activity.endTime) }}</text>
				</view>
				<view class="item-row">
					<text class="item-label">报名时间</text>
					<text class="item-value">{{ formatDate(item.signupTime) }}</text>
				</view>
				<view class="item-actions" v-if="item.status === '0'">
					<text class="cancel-btn" @click="cancelSignup(item)">取消报名</text>
				</view>
			</view>
			<view class="empty-tip" v-if="!loading && list.length === 0">
				<text>暂无活动记录</text>
			</view>
			<uni-load-more :status="loadStatus" v-else></uni-load-more>
		</scroll-view>
	</view>
</template>

<script>
	import {
		listMyActivities,
		cancelSignupActivity
	} from '@/api/activity'
	import requireLogin from '@/mixins/requireLogin.js'

	const STATUS_MAP = {
		'0': '已报名',
		'1': '已参与',
		'2': '已弃权'
	}
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
				queryParam: {
					pageNum: 1,
					pageSize: 20
				},
				list: [],
				total: 0,
				loadStatus: 'more',
				loading: false
			}
		},
		onShow() {
			this.refresh()
		},
		methods: {
			refresh() {
				this.queryParam.pageNum = 1
				this.list = []
				this.getList()
			},
			getList() {
				if (this.loading) return
				this.loading = true
				this.loadStatus = 'loading'
				listMyActivities(this.queryParam).then(res => {
					const rows = res.rows || []
					if (this.queryParam.pageNum === 1) {
						this.list = rows
					} else {
						this.list = [...this.list, ...rows]
					}
					this.total = res.total || 0
					if (this.list.length >= this.total) {
						this.loadStatus = 'noMore'
					} else {
						this.loadStatus = 'more'
					}
				}).catch(() => {
					this.loadStatus = 'more'
					uni.showToast({
						title: '加载失败',
						icon: 'none'
					})
				}).finally(() => {
					this.loading = false
				})
			},
			loadMore() {
				if (this.list.length < this.total) {
					this.queryParam.pageNum++
					this.getList()
				}
			},
			cancelSignup(item) {
				uni.showModal({
					title: '确认取消',
					content: '确定取消该活动报名？',
					success: (res) => {
						if (res.confirm) {
							cancelSignupActivity(item.activityId).then(() => {
								uni.showToast({
									title: '取消成功',
									icon: 'success'
								})
								this.refresh()
							}).catch(() => {
								uni.showToast({
									title: '取消失败',
									icon: 'none'
								})
							})
						}
					}
				})
			},
			formatStatus(val) {
				return STATUS_MAP[val] || val || '未知'
			},
			formatCategory(val) {
				return CATEGORY_MAP[val] || val || '-'
			},
			formatDate(val) {
				if (!val) return '-'
				const d = new Date(val.replace(/ /g, 'T'))
				return `${d.getMonth()+1}/${d.getDate()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
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
		margin-bottom: 10px;
	}

	.item-title {
		font-size: 16px;
		font-weight: 600;
		color: #333;
		flex: 1;
	}

	.item-status {
		font-size: 12px;
		padding: 2px 8px;
		border-radius: 10px;
		margin-left: 8px;
	}

	.status-0 {
		background: #e6f3ff;
		color: #2979ff;
	}

	.status-1 {
		background: #e8f5e9;
		color: #4caf50;
	}

	.status-2 {
		background: #ffebee;
		color: #ff4d4f;
	}

	.item-row {
		display: flex;
		margin-top: 6px;
		font-size: 13px;
	}

	.item-label {
		color: #999;
		width: 70px;
	}

	.item-value {
		color: #333;
		flex: 1;
	}

	.item-actions {
		display: flex;
		justify-content: flex-end;
		margin-top: 10px;
	}

	.cancel-btn {
		font-size: 13px;
		color: #ff4d4f;
		padding: 4px 10px;
		border: 1px solid #ff4d4f;
		border-radius: 12px;
	}

	.empty-tip {
		text-align: center;
		color: #999;
		padding: 40px 0;
	}
</style>
