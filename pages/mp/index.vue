<template>
	<view class="page">
		<view class="header">
			<view class="college">{{ collegeName || '学院数据' }}</view>
			<view class="sub">学工数据 · {{ updatedAt }}</view>
		</view>

		<view v-if="!loggedIn" class="login-box">
			<view class="login-title">登录后查看学院数据</view>
			<view class="login-tip">{{ loginTip }}</view>
			<button v-if="oauthReady" class="btn primary" @tap="startOauth">微信授权登录</button>
			<button v-else class="btn primary" @tap="goLogin">账号登录</button>
		</view>

		<template v-else>
			<view class="stat-grid">
				<view class="stat-card">
					<view class="stat-value">{{ num(students.total) }}</view>
					<view class="stat-label">在册学生</view>
				</view>
				<view class="stat-card">
					<view class="stat-value warn">{{ num(leaves.pending) }}</view>
					<view class="stat-label">请假在批</view>
				</view>
				<view class="stat-card">
					<view class="stat-value danger">{{ num(arrears.total) }}</view>
					<view class="stat-label">欠费待跟进</view>
				</view>
				<view class="stat-card">
					<view class="stat-value">{{ num(dorm.tasks) }}</view>
					<view class="stat-label">近30天查寝</view>
				</view>
			</view>

			<view class="tabs">
				<view v-for="item in tabs" :key="item.key" class="tab" :class="{ active: activeTab === item.key }" @tap="switchTab(item.key)">
					{{ item.label }}
				</view>
			</view>

			<view v-if="activeTab === 'overview'" class="panel">
				<view class="panel-title">学生构成</view>
				<view class="kv"><text>男生</text><text>{{ num(students.male) }} 人</text></view>
				<view class="kv"><text>女生</text><text>{{ num(students.female) }} 人</text></view>
				<view v-for="grade in grades" :key="grade.grade" class="kv">
					<text>{{ grade.grade }} 级</text><text>{{ num(grade.total) }} 人</text>
				</view>
				<view class="panel-title second">欠费与查寝</view>
				<view class="kv"><text>待缴金额</text><text>{{ money(arrears.amount) }} 元</text></view>
				<view class="kv"><text>在校床位</text><text>{{ num(dorm.beds) }} 个</text></view>
				<view class="kv"><text>近30天查寝覆盖</text><text>{{ num(dorm.rooms) }} 间</text></view>
				<view class="kv"><text>其中已查</text><text>{{ num(dorm.checked) }} 间</text></view>
			</view>

			<view v-else class="panel">
				<view class="panel-title">{{ currentTabTitle }}</view>
				<view v-if="detailList.length === 0" class="empty">暂无数据</view>
				<view v-for="(row, index) in detailList" :key="index" class="row">
					<view class="row-main">{{ rowTitle(row) }}</view>
					<view class="row-sub">{{ rowSub(row) }}</view>
				</view>
			</view>
		</template>
	</view>
</template>

<script>
	import {
		setToken
	} from '@/utils/auth'
	import {
		getMpConfig,
		getCollegeSummary,
		getCollegeDetail,
		getMpAuthorizeUrl,
		wxMpLogin
	} from '@/api/mp/index'

	export default {
		data() {
			return {
				appId: '',
				mpConfig: {},
				loggedIn: false,
				oauthReady: false,
				loginTip: '请先登录学工系统账号',
				collegeName: '',
				updatedAt: '',
				students: {},
				leaves: {},
				arrears: {},
				dorm: {},
				grades: [],
				activeTab: 'overview',
				initialTab: '',
				detailList: [],
				tabs: [
					{ key: 'overview', label: '总览' },
					{ key: 'leave', label: '请假' },
					{ key: 'arrears', label: '欠费' },
					{ key: 'dorm', label: '查寝' }
				]
			}
		},
		computed: {
			currentTabTitle() {
				const tab = this.tabs.find(item => item.key === this.activeTab)
				return tab ? tab.label + '明细' : '明细'
			}
		},
		onLoad(options) {
			this.appId = options.appId || uni.getStorageSync('mpAppId') || ''
			if (this.appId) {
				uni.setStorageSync('mpAppId', this.appId)
			}
			const tab = options.tab || ''
			this.initialTab = this.tabs.some(item => item.key === tab) ? tab : ''
			if (!this.appId) {
				this.loginTip = '请从学院公众号菜单进入'
				return
			}
			this.loadConfig()
			const token = uni.getStorageSync('App-Token')
			if (token) {
				this.loggedIn = true
				this.loadSummary()
				this.applyInitialTab()
				return
			}
			if (options.code) {
				this.exchangeCode(options.code)
			}
		},
		methods: {
			loadConfig() {
				getMpConfig(this.appId).then(res => {
					this.mpConfig = res.data || {}
					this.collegeName = this.mpConfig.collegeName || ''
					this.oauthReady = !!this.mpConfig.supportsOauth
					this.loginTip = this.oauthReady ?
						'认证服务号可直接微信授权登录' :
						'当前为认证订阅号，微信暂不开放网页授权，请用账号密码登录'
				}).catch(err => {
					this.loginTip = (err && err.msg) || '该公众号尚未接入学工系统'
				})
			},
			startOauth() {
				// #ifdef H5
				const redirectUri = window.location.origin + window.location.pathname +
					'#/pages/mp/index?appId=' + this.appId
				getMpAuthorizeUrl(this.appId, redirectUri).then(res => {
					window.location.href = res.data.authorizeUrl
				}).catch(err => {
					uni.showToast({ title: (err && err.msg) || '获取授权地址失败', icon: 'none' })
				})
				// #endif
				// #ifndef H5
				this.goLogin()
				// #endif
			},
			exchangeCode(code) {
				wxMpLogin(code, this.appId).then(res => {
					const token = res.token || (res.data && res.data.token)
					if (!token) {
						this.goLogin()
						return
					}
					setToken(token)
					this.loggedIn = true
					this.loadSummary()
					this.applyInitialTab()
				}).catch(() => {
					this.goLogin()
				})
			},
			goLogin() {
				const tabQuery = this.initialTab ? '&tab=' + this.initialTab : ''
				const redirect = encodeURIComponent('/pages/mp/index?appId=' + this.appId + tabQuery)
				uni.reLaunch({
					url: '/pages/login/accountLogin?redirect=' + redirect
				})
			},
			applyInitialTab() {
				if (this.initialTab && this.initialTab !== 'overview') {
					this.switchTab(this.initialTab)
				}
			},
			loadSummary() {
				getCollegeSummary().then(res => {
					const data = res.data || {}
					this.collegeName = data.collegeName || this.collegeName
					this.students = data.students || {}
					this.leaves = data.leaves || {}
					this.arrears = data.arrears || {}
					this.dorm = data.dorm || {}
					this.grades = data.grades || []
					const now = new Date()
					this.updatedAt = now.getFullYear() + '-' + this.pad(now.getMonth() + 1) + '-' + this.pad(now.getDate())
				}).catch(err => {
					if (err && err.code === 401) {
						this.loggedIn = false
					} else {
						uni.showToast({ title: (err && err.msg) || '数据加载失败', icon: 'none' })
					}
				})
			},
			switchTab(key) {
				this.activeTab = key
				if (key === 'overview') return
				getCollegeDetail(key, 30).then(res => {
					this.detailList = (res.data && res.data.list) || []
				}).catch(() => {
					this.detailList = []
				})
			},
			rowTitle(row) {
				if (this.activeTab === 'leave') {
					return (row.studentName || '') + ' · ' + (row.className || '')
				}
				if (this.activeTab === 'arrears') {
					return (row.studentName || '') + ' · ' + (row.className || '')
				}
				return row.taskName || '查寝任务'
			},
			rowSub(row) {
				if (this.activeTab === 'leave') {
					return this.formatTime(row.startTime) + ' 至 ' + this.formatTime(row.endTime) + ' · ' +
						this.leaveType(row.leaveType) + ' · ' + this.leaveStatus(row.approvalStatus)
				}
				if (this.activeTab === 'arrears') {
					return '待缴 ' + this.money(row.balance) + ' 元 · ' + (row.counselorName || '')
				}
				return this.formatDate(row.checkDate) + ' · 已查 ' + (row.checkedCount || 0) + '/' + (row.roomCount || 0) + ' 间'
			},
			leaveType(type) {
				if (type === 'sick') return '病假'
				if (type === 'public') return '公假'
				if (type === 'personal') return '事假'
				return type || '请假'
			},
			formatDate(value) {
				if (!value) return ''
				const parts = String(value).replace('T', ' ').replace(/-/g, '/').split(/[ /:]/)
				if (parts.length < 3) return String(value)
				return parts[1] + '-' + parts[2]
			},
			formatTime(value) {
				if (!value) return ''
				const parts = String(value).replace('T', ' ').replace(/-/g, '/').split(/[ /:]/)
				if (parts.length < 5) return String(value)
				return parts[1] + '-' + parts[2] + ' ' + parts[3] + ':' + parts[4]
			},
			leaveStatus(status) {
				if (status === 'pending') return '审批中'
				if (status === 'approved') return '已通过'
				if (status === 'rejected') return '已驳回'
				return status || ''
			},
			num(value) {
				return value === null || value === undefined ? 0 : value
			},
			money(value) {
				const number = Number(value || 0)
				return number.toFixed(2)
			},
			pad(value) {
				return value < 10 ? '0' + value : '' + value
			}
		}
	}
</script>

<style scoped>
	.page {
		min-height: 100vh;
		background: #f3f5f8;
		padding-bottom: 40rpx;
	}

	.header {
		padding: 48rpx 40rpx 72rpx;
		background: #1f6feb;
		color: #fff;
	}

	.college {
		font-size: 44rpx;
		font-weight: 600;
	}

	.sub {
		margin-top: 12rpx;
		font-size: 24rpx;
		opacity: 0.82;
	}

	.login-box {
		margin: -40rpx 32rpx 0;
		padding: 48rpx 36rpx;
		background: #fff;
		border-radius: 12rpx;
		box-shadow: 0 8rpx 24rpx rgba(22, 45, 78, 0.08);
	}

	.login-title {
		font-size: 34rpx;
		font-weight: 600;
		color: #1f2d3d;
	}

	.login-tip {
		margin: 16rpx 0 32rpx;
		font-size: 25rpx;
		line-height: 1.7;
		color: #7a8797;
	}

	.btn {
		height: 88rpx;
		line-height: 88rpx;
		border-radius: 8rpx;
		font-size: 30rpx;
	}

	.btn.primary {
		background: #1f6feb;
		color: #fff;
	}

	.stat-grid {
		display: flex;
		flex-wrap: wrap;
		margin: -44rpx 32rpx 0;
	}

	.stat-card {
		width: calc(50% - 12rpx);
		margin: 0 12rpx 24rpx 0;
		padding: 28rpx 24rpx;
		background: #fff;
		border-radius: 10rpx;
		box-shadow: 0 6rpx 18rpx rgba(22, 45, 78, 0.06);
		box-sizing: border-box;
	}

	.stat-value {
		font-size: 46rpx;
		font-weight: 700;
		color: #1f2d3d;
	}

	.stat-value.warn {
		color: #d98600;
	}

	.stat-value.danger {
		color: #d64545;
	}

	.stat-label {
		margin-top: 6rpx;
		font-size: 24rpx;
		color: #7a8797;
	}

	.tabs {
		display: flex;
		margin: 8rpx 32rpx 0;
		background: #fff;
		border-radius: 10rpx;
		overflow: hidden;
	}

	.tab {
		flex: 1;
		height: 80rpx;
		line-height: 80rpx;
		text-align: center;
		font-size: 26rpx;
		color: #5b6b7c;
	}

	.tab.active {
		color: #1f6feb;
		font-weight: 600;
		box-shadow: inset 0 -4rpx 0 #1f6feb;
	}

	.panel {
		margin: 24rpx 32rpx 0;
		padding: 28rpx;
		background: #fff;
		border-radius: 10rpx;
	}

	.panel-title {
		font-size: 30rpx;
		font-weight: 600;
		color: #1f2d3d;
		margin-bottom: 16rpx;
	}

	.panel-title.second {
		margin-top: 28rpx;
	}

	.kv {
		display: flex;
		justify-content: space-between;
		padding: 14rpx 0;
		font-size: 27rpx;
		color: #34495e;
		border-bottom: 1rpx solid #f0f2f5;
	}

	.row {
		padding: 20rpx 0;
		border-bottom: 1rpx solid #f0f2f5;
	}

	.row-main {
		font-size: 28rpx;
		color: #1f2d3d;
	}

	.row-sub {
		margin-top: 6rpx;
		font-size: 23rpx;
		color: #7a8797;
	}

	.empty {
		padding: 40rpx 0;
		text-align: center;
		font-size: 25rpx;
		color: #9aa6b2;
	}
</style>
