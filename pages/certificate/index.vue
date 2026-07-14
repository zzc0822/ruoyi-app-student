<template>
	<view class="page-container">
		<!-- Tab 切换 -->
		<view class="tab-bar">
			<view
				v-for="(tab, idx) in tabs"
				:key="idx"
				:class="['tab-item', activeTab === idx ? 'tab-active' : '']"
				@click="switchTab(idx)">
				{{ tab.label }}
			</view>
		</view>

		<!-- 统计栏 -->
		<view class="stats-bar">
			<view class="stats-item">
				<text class="stats-num">{{ allList.length }}</text>
				<text class="stats-label">全部证书</text>
			</view>
			<view class="stats-item">
				<text class="stats-num green">{{ typeCount('activity') }}</text>
				<text class="stats-label">活动证书</text>
			</view>
			<view class="stats-item">
				<text class="stats-num blue">{{ typeCount('volunteer') }}</text>
				<text class="stats-label">志愿证明</text>
			</view>
			<view class="stats-item">
				<text class="stats-num gold">{{ typeCount('award') }}</text>
				<text class="stats-label">荣誉证书</text>
			</view>
		</view>

		<!-- 证书列表 -->
		<scroll-view scroll-y class="list-scroll">
			<view class="cert-item" v-for="item in filteredList" :key="item.id" @click="goDetail(item.id)">
				<view class="cert-header">
					<view :class="['cert-badge', 'badge-' + item.certType]">
						{{ formatType(item.certType) }}
					</view>
					<text class="cert-name">{{ item.certName }}</text>
				</view>
				<view class="cert-body">
					<view class="cert-row">
						<text class="cert-label">学号</text>
						<text class="cert-value">{{ item.xh }}</text>
					</view>
					<view class="cert-row">
						<text class="cert-label">生成时间</text>
						<text class="cert-value">{{ item.generateTime }}</text>
					</view>
					<view class="cert-row" v-if="item.studentName">
						<text class="cert-label">姓名</text>
						<text class="cert-value">{{ item.studentName }}</text>
					</view>
				</view>
				<view class="cert-footer">
					<text class="cert-pdf" v-if="item.pdfPath">PDF证书已生成</text>
					<text class="cert-pdf no-pdf" v-else>证书生成中</text>
				</view>
			</view>
			<view class="empty-tip" v-if="!loading && filteredList.length === 0">
				<text>暂无证书记录</text>
			</view>
		</scroll-view>
	</view>
</template>

<script>
	import { getMyCertificates } from '@/api/affair/certificate'
	import requireLogin from '@/mixins/requireLogin.js'

	const TYPE_MAP = { activity: '活动证书', volunteer: '志愿证明', award: '荣誉证书' }

	export default {
		mixins: [requireLogin],
		data() {
			return {
				allList: [],
				loading: false,
				activeTab: 0,
				tabs: [
					{ label: '全部', value: '' },
					{ label: '活动', value: 'activity' },
					{ label: '志愿', value: 'volunteer' },
					{ label: '评奖', value: 'award' }
				]
			}
		},
		computed: {
			filteredList() {
				const type = this.tabs[this.activeTab].value
				if (!type) return this.allList
				return this.allList.filter(i => i.certType === type)
			}
		},
		onShow() {
			this.loadList()
		},
		methods: {
			loadList() {
				this.loading = true
				getMyCertificates().then(res => {
					if (res.data && res.data.code === 200) {
						this.allList = res.data.data || []
					}
				}).catch(() => {
					uni.showToast({ title: '加载失败', icon: 'none' })
				}).finally(() => {
					this.loading = false
				})
			},
			switchTab(idx) {
				this.activeTab = idx
			},
			typeCount(type) {
				return this.allList.filter(i => i.certType === type).length
			},
			formatType(val) {
				return TYPE_MAP[val] || val
			},
			goDetail(id) {
				uni.navigateTo({ url: '/pages/certificate/detail?id=' + id })
			}
		}
	}
</script>

<style scoped lang="scss">
	.page-container {
		display: flex;
		flex-direction: column;
		height: 100vh;
		background: #f5f6f8;
	}

	.tab-bar {
		display: flex;
		background: #fff;
		border-bottom: 1rpx solid #eee;
	}
	.tab-item {
		flex: 1;
		text-align: center;
		padding: 24rpx 0;
		font-size: 28rpx;
		color: #666;
		position: relative;
	}
	.tab-active {
		color: #667eea;
		font-weight: 600;
	}
	.tab-active::after {
		content: '';
		position: absolute;
		bottom: 0;
		left: 30%;
		width: 40%;
		height: 4rpx;
		background: #667eea;
		border-radius: 2rpx;
	}

	.stats-bar {
		display: flex;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		padding: 24rpx 20rpx;
		color: #fff;
	}
	.stats-item { flex: 1; text-align: center; }
	.stats-num { font-size: 36rpx; font-weight: 700; display: block; }
	.stats-num.green { color: #81c784; }
	.stats-num.blue { color: #64b5f6; }
	.stats-num.gold { color: #ffd54f; }
	.stats-label { font-size: 22rpx; opacity: 0.85; }

	.list-scroll { flex: 1; padding: 16rpx 24rpx; }

	.cert-item {
		background: #fff;
		border-radius: 16rpx;
		padding: 24rpx;
		margin-bottom: 20rpx;
		box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
	}
	.cert-header {
		display: flex;
		align-items: center;
		margin-bottom: 16rpx;
		gap: 12rpx;
	}
	.cert-badge {
		font-size: 22rpx;
		padding: 4rpx 16rpx;
		border-radius: 20rpx;
		color: #fff;
	}
	.badge-activity { background: #43a047; }
	.badge-volunteer { background: #1e88e5; }
	.badge-award { background: #f9a825; }
	.cert-name { font-size: 30rpx; font-weight: 600; color: #333; flex: 1; }

	.cert-body { margin-bottom: 12rpx; }
	.cert-row { display: flex; padding: 4rpx 0; font-size: 26rpx; }
	.cert-label { color: #999; width: 140rpx; flex-shrink: 0; }
	.cert-value { color: #333; flex: 1; }

	.cert-footer {
		border-top: 1rpx solid #f0f0f0;
		padding-top: 12rpx;
	}
	.cert-pdf { font-size: 24rpx; color: #43a047; }
	.no-pdf { color: #999; }

	.empty-tip { text-align: center; color: #999; padding: 60rpx 0; }
</style>
