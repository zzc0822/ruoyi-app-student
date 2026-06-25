<template>
	<view class="page-container">
		<!-- 维度筛选 -->
		<scroll-view scroll-x class="dim-bar" show-scrollbar="false">
			<view :class="['dim-item', activeDim === '' ? 'active' : '']" @click="switchDim('')">全部</view>
			<view :class="['dim-item', activeDim === 'de' ? 'active' : '']" @click="switchDim('de')">德育</view>
			<view :class="['dim-item', activeDim === 'zhi' ? 'active' : '']" @click="switchDim('zhi')">智育</view>
			<view :class="['dim-item', activeDim === 'ti' ? 'active' : '']" @click="switchDim('ti')">体育</view>
			<view :class="['dim-item', activeDim === 'mei' ? 'active' : '']" @click="switchDim('mei')">美育</view>
			<view :class="['dim-item', activeDim === 'lao' ? 'active' : '']" @click="switchDim('lao')">劳育</view>
			<view :class="['dim-item', activeDim === 'chuang' ? 'active' : '']" @click="switchDim('chuang')">创新创业</view>
		</scroll-view>

		<!-- 活动列表 -->
		<scroll-view scroll-y class="list-scroll" @scrolltolower="loadMore">
			<view class="list-item" v-for="item in list" :key="item.id" @click="goDetail(item)">
				<view class="item-header">
					<text class="item-title">{{ item.title }}</text>
					<text class="item-dim">{{ formatCategory(item.category) }}</text>
				</view>
				<view class="item-row">
					<text class="item-label">范围</text>
					<text class="item-value">{{ formatTargetType(item.targetType) }}</text>
				</view>
				<view class="item-row">
					<text class="item-label">时间</text>
					<text class="item-value">{{ formatDate(item.startTime) }} ~ {{ formatDate(item.endTime) }}</text>
				</view>
				<view class="item-row" v-if="item.signupEnd">
					<text class="item-label">报名截止</text>
					<text class="item-value">{{ formatDate(item.signupEnd) }}</text>
				</view>
			</view>
			<view class="empty-tip" v-if="!loading && list.length === 0">
				<text>暂无可报名活动</text>
			</view>
			<uni-load-more :status="loadStatus" v-else></uni-load-more>
		</scroll-view>
	</view>
</template>

<script>
	import {
		listOpenActivities
	} from '@/api/activity'

	const CATEGORY_MAP = {
		de: '德育',
		zhi: '智育',
		ti: '体育',
		mei: '美育',
		lao: '劳育',
		chuang: '创新创业'
	}

	export default {
		data() {
			return {
				activeDim: '',
				queryParam: {
					pageNum: 1,
					pageSize: 20,
					category: undefined
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
				listOpenActivities(this.queryParam).then(res => {
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
			switchDim(dim) {
				this.activeDim = dim
				this.queryParam.category = dim || undefined
				this.queryParam.pageNum = 1
				this.list = []
				this.getList()
			},
			goDetail(item) {
				uni.navigateTo({
					url: `/pages/activity/detail?id=${item.id}`
				})
			},
			formatCategory(val) {
				return CATEGORY_MAP[val] || val || '-'
			},
			formatTargetType(val) {
				return val === '1' ? '指定班级' : '全校'
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

	.dim-bar {
		white-space: nowrap;
		background: #fff;
		padding: 10px 12px;
		border-bottom: 1px solid #eee;
	}

	.dim-item {
		display: inline-block;
		padding: 6px 12px;
		margin-right: 8px;
		font-size: 13px;
		color: #666;
		background: #f2f3f5;
		border-radius: 16px;
	}

	.dim-item.active {
		color: #fff;
		background: #2979ff;
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

	.item-dim {
		font-size: 12px;
		color: #2979ff;
		background: #e6f3ff;
		padding: 2px 8px;
		border-radius: 10px;
		margin-left: 8px;
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

	.empty-tip {
		text-align: center;
		color: #999;
		padding: 40px 0;
	}
</style>
