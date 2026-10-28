<template>
	<view class="sign-page">
		<view class="hero">
			<view>
				<text class="hero-title">手机点名</text>
				<text class="hero-desc">课堂签到与晚寝确认都在这里完成</text>
			</view>
			<view class="scan-button" @click="scanQr()">
				<u-icon name="scan" size="42" color="#ffffff"></u-icon>
				<text>扫一扫</text>
			</view>
		</view>

		<view class="scene-tabs">
			<view
				v-for="item in sceneTabs"
				:key="item.value"
				class="scene-tab"
				:class="{ active: scene === item.value }"
				@click="switchScene(item.value)"
			>
				{{ item.label }}
				<text class="count" v-if="scene === item.value && tasks.length">{{ tasks.length }}</text>
			</view>
		</view>

		<view class="task-list" v-if="tasks.length">
			<view class="task-card" v-for="task in tasks" :key="task.sessionId">
				<view class="task-head">
					<view class="task-title-wrap">
						<text class="scene-tag" :class="task.scene">{{ task.scene === 'dorm' ? '晚寝' : '课堂' }}</text>
						<text class="task-title">{{ task.sessionName }}</text>
					</view>
					<text class="type-tag">{{ signTypeText(task.signType) }}</text>
				</view>
				<view class="task-meta">
					<view class="meta-row">
						<u-icon name="clock" size="15" color="#7a8494"></u-icon>
						<text>{{ formatTime(task.startTime) }} - {{ formatEnd(task.endTime) }}</text>
					</view>
					<view class="meta-row" v-if="task.scene === 'class'">
						<u-icon name="account" size="15" color="#7a8494"></u-icon>
						<text>{{ task.className || task.bjdm || '本班课堂' }}</text>
					</view>
					<view class="meta-row" v-else>
						<u-icon name="home" size="15" color="#7a8494"></u-icon>
						<text>{{ task.dormBuilding }} {{ task.dormFloor || '' }}</text>
					</view>
					<view class="meta-row" v-if="task.courseName || task.classRoom">
						<u-icon name="map" size="15" color="#7a8494"></u-icon>
						<text>{{ task.courseName || '' }} {{ task.classRoom || '' }}</text>
					</view>
				</view>

				<view class="code-row" v-if="task.signType === 'code'">
					<input
						class="code-input"
						type="number"
						maxlength="4"
						:value="codeInputs[task.sessionId] || ''"
						placeholder="输入教师提供的 4 位签到码"
						@input="setCode(task.sessionId, $event.detail.value)"
					/>
				</view>

				<button
					class="sign-button"
					:class="{ scanning: task.signType === 'qr', locating: task.signType === 'location' }"
					:loading="submitting[task.sessionId]"
					@click="confirmTask(task)"
				>
					{{ actionText(task) }}
				</button>
			</view>
		</view>

		<view class="empty" v-else-if="!loading">
			<u-icon name="clock" size="72" color="#c6ccd8"></u-icon>
			<text class="empty-title">当前没有可确认的点名</text>
			<text class="empty-desc">教师发起后，任务会自动出现在这里</text>
			<button class="refresh-button" @click="loadTasks">刷新任务</button>
		</view>

		<view class="loading" v-if="loading">
			<text>正在获取点名任务...</text>
		</view>
	</view>
</template>

<script>
import {
	getActiveSignSessions,
	getSignSessionDetail,
	signByCode,
	signByQr,
	signByLocation
} from '@/api/attendance/sign'
import requireLogin from '@/mixins/requireLogin.js'

export default {
	mixins: [requireLogin],
	data() {
		return {
			scene: '',
			sceneTabs: [
				{ value: '', label: '全部' },
				{ value: 'class', label: '课堂签到' },
				{ value: 'dorm', label: '晚寝确认' }
			],
			tasks: [],
			loading: false,
			codeInputs: {},
			submitting: {}
		}
	},
	onShow() {
		if (!this.loading) this.loadTasks()
	},
	onPullDownRefresh() {
		this.loadTasks().finally(() => uni.stopPullDownRefresh())
	},
	methods: {
		async loadTasks() {
			this.loading = true
			try {
				const res = await getActiveSignSessions(this.scene)
				const payload = res.data || {}
				this.tasks = payload.code === 200 ? (payload.data || []) : []
			} catch (e) {
				this.tasks = []
			} finally {
				this.loading = false
			}
		},
		switchScene(scene) {
			if (this.scene === scene) return
			this.scene = scene
			this.loadTasks()
		},
		setCode(sessionId, value) {
			this.$set(this.codeInputs, sessionId, String(value || '').replace(/\D/g, '').slice(0, 4))
		},
		signTypeText(type) {
			return { code: '签到码', qr: '二维码', location: '定位确认' }[type] || '手机确认'
		},
		actionText(task) {
			if (task.scene === 'dorm') {
				return task.signType === 'location' ? '确认我在宿舍楼' : '确认我在寝'
			}
			return task.signType === 'location' ? '确认我已到课' : '确认签到'
		},
		formatTime(value) {
			if (!value) return '--:--'
			return String(value).substring(11, 16) || String(value)
		},
		formatEnd(value) {
			if (!value) return '--:--'
			return String(value).substring(11, 16) || String(value)
		},
		async scanQr(expectedSessionId) {
			uni.scanCode({
				onlyFromCamera: true,
				scanType: ['qrCode'],
				success: async result => {
					const content = String(result.result || '')
					const match = content.match(/^SIGN:(\d+):([a-f0-9]+)$/)
					if (!match) {
						uni.showToast({ title: '不是有效的点名二维码', icon: 'none' })
						return
					}
					const sessionId = Number(match[1])
					const token = match[2]
					if (expectedSessionId && sessionId !== expectedSessionId) {
						uni.showToast({ title: '二维码不属于当前点名任务', icon: 'none' })
						return
					}
					try {
						const res = await getSignSessionDetail(sessionId)
						const payload = res.data || {}
						if (payload.code !== 200) {
							uni.showToast({ title: payload.msg || '点名任务不可用', icon: 'none' })
							return
						}
						await this.submitQr(sessionId, token)
					} catch (e) {
						uni.showToast({ title: '无法读取点名任务', icon: 'none' })
					}
				}
			})
		},
		async confirmTask(task) {
			if (this.submitting[task.sessionId]) return
			if (task.signType === 'code') {
				const code = this.codeInputs[task.sessionId] || ''
				if (code.length !== 4) {
					uni.showToast({ title: '请输入 4 位签到码', icon: 'none' })
					return
				}
				return this.execute(task.sessionId, () => signByCode(task.sessionId, code))
			}
			if (task.signType === 'qr') {
				this.scanQr(task.sessionId)
				return
			}
			if (task.signType === 'location') {
				return this.submitLocation(task.sessionId)
			}
			uni.showToast({ title: '该任务暂不支持手机确认', icon: 'none' })
		},
		async submitQr(sessionId, token) {
			return this.execute(sessionId, () => signByQr(sessionId, token))
		},
		async submitLocation(sessionId) {
			if (this.submitting[sessionId]) return
			uni.getLocation({
				type: 'gcj02',
				success: async location => {
					await this.execute(
						sessionId,
						() => signByLocation(sessionId, location.latitude, location.longitude, 'student-mini-app'),
						true
					)
				},
				fail: () => {
					uni.showToast({ title: '请开启定位权限后重试', icon: 'none' })
				}
			})
		},
		async execute(sessionId, request, keepSubmitting) {
			this.$set(this.submitting, sessionId, true)
			try {
				const res = await request()
				const payload = res.data || {}
				if (payload.code === 200) {
					uni.showToast({ title: payload.msg || '确认成功', icon: 'success' })
					setTimeout(() => this.loadTasks(), 500)
				} else {
					uni.showToast({ title: payload.msg || '确认失败', icon: 'none' })
				}
			} catch (e) {
				// 请求层已经展示后端返回的具体原因
			} finally {
				this.$set(this.submitting, sessionId, false)
			}
		}
	}
}
</script>

<style scoped>
.sign-page {
	min-height: 100vh;
	background: #f3f6fb;
	padding: 24rpx 24rpx 48rpx;
	box-sizing: border-box;
}
.hero {
	display: flex;
	align-items: center;
	justify-content: space-between;
	background: #2457d6;
	border-radius: 20rpx;
	padding: 34rpx 30rpx;
	color: #ffffff;
}
.hero-title {
	display: block;
	font-size: 42rpx;
	font-weight: 700;
	letter-spacing: 0;
}
.hero-desc {
	display: block;
	margin-top: 10rpx;
	font-size: 24rpx;
	color: rgba(255, 255, 255, 0.82);
}
.scan-button {
	width: 126rpx;
	height: 126rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	background: rgba(255, 255, 255, 0.16);
	border: 2rpx solid rgba(255, 255, 255, 0.28);
	border-radius: 16rpx;
	font-size: 22rpx;
}
.scene-tabs {
	display: flex;
	gap: 12rpx;
	margin: 24rpx 0;
}
.scene-tab {
	flex: 1;
	height: 76rpx;
	line-height: 76rpx;
	text-align: center;
	background: #ffffff;
	border-radius: 12rpx;
	color: #5e6878;
	font-size: 26rpx;
}
.scene-tab.active {
	background: #e8efff;
	color: #2457d6;
	font-weight: 600;
}
.count {
	margin-left: 8rpx;
	font-size: 20rpx;
	background: #2457d6;
	color: #ffffff;
	border-radius: 16rpx;
	padding: 2rpx 8rpx;
}
.task-card {
	background: #ffffff;
	border-radius: 16rpx;
	padding: 26rpx;
	margin-bottom: 20rpx;
	border: 2rpx solid #edf1f7;
}
.task-head {
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: 16rpx;
}
.task-title-wrap {
	display: flex;
	align-items: center;
	gap: 12rpx;
	min-width: 0;
}
.task-title {
	font-size: 30rpx;
	font-weight: 600;
	color: #1e2735;
	word-break: break-all;
}
.scene-tag,
.type-tag {
	flex-shrink: 0;
	font-size: 20rpx;
	padding: 6rpx 12rpx;
	border-radius: 8rpx;
}
.scene-tag.class {
	background: #e8efff;
	color: #2457d6;
}
.scene-tag.dorm {
	background: #e9f7f1;
	color: #16865c;
}
.type-tag {
	background: #f3f5f8;
	color: #667085;
}
.task-meta {
	margin-top: 20rpx;
	padding: 18rpx;
	background: #f7f9fc;
	border-radius: 12rpx;
}
.meta-row {
	display: flex;
	align-items: center;
	gap: 10rpx;
	font-size: 24rpx;
	color: #667085;
	margin-bottom: 10rpx;
}
.meta-row:last-child {
	margin-bottom: 0;
}
.code-row {
	margin-top: 20rpx;
}
.code-input {
	height: 82rpx;
	background: #f7f9fc;
	border: 2rpx solid #e2e8f2;
	border-radius: 12rpx;
	padding: 0 22rpx;
	font-size: 30rpx;
	letter-spacing: 8rpx;
}
.sign-button {
	margin-top: 22rpx;
	height: 84rpx;
	line-height: 84rpx;
	border: none;
	border-radius: 12rpx;
	background: #2457d6;
	color: #ffffff;
	font-size: 28rpx;
	font-weight: 600;
}
.sign-button.scanning {
	background: #16865c;
}
.sign-button.locating {
	background: #b85d16;
}
.sign-button::after,
.refresh-button::after {
	border: none;
}
.empty,
.loading {
	padding: 120rpx 0;
	display: flex;
	flex-direction: column;
	align-items: center;
}
.empty-title {
	margin-top: 20rpx;
	font-size: 30rpx;
	color: #344054;
	font-weight: 600;
}
.empty-desc,
.loading text {
	margin-top: 10rpx;
	font-size: 24rpx;
	color: #98a2b3;
}
.refresh-button {
	margin-top: 28rpx;
	height: 72rpx;
	line-height: 72rpx;
	padding: 0 34rpx;
	background: #ffffff;
	color: #2457d6;
	border: 2rpx solid #cdd9f5;
	border-radius: 12rpx;
	font-size: 24rpx;
}
</style>
