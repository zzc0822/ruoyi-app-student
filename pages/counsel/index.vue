<template>
	<view class="counsel-page">
		<view class="hero">
			<view class="hero-row">
				<view class="hero-copy">
					<text class="hero-title">心理咨询</text>
					<text class="hero-sub">给自己留一段被认真倾听的时间</text>
				</view>
				<view class="bell-wrap" @click="switchTab(2)">
					<u-icon name="bell" size="22" color="#ffffff"></u-icon>
					<view class="bell-badge" v-if="unreadCount > 0">{{ unreadCount > 99 ? '99+' : unreadCount }}</view>
				</view>
			</view>
			<view class="hero-note">
				<u-icon name="lock" size="13" color="rgba(255,255,255,0.9)"></u-icon>
				<text class="hero-note-text">咨询信息仅限服务团队在职责范围内查看</text>
			</view>
		</view>

		<view class="tab-bar">
			<view
				v-for="(tab, idx) in tabs"
				:key="idx"
				:class="['tab-item', activeTab === idx ? 'tab-active' : '']"
				@click="switchTab(idx)">
				<text class="tab-label">{{ tab.label }}</text>
				<view class="tab-underline" v-if="activeTab === idx"></view>
			</view>
		</view>

		<!-- 预约咨询 -->
		<view v-if="activeTab === 0" class="tab-content">
			<view class="section">
				<view class="section-head">
					<text class="section-title">选择服务</text>
					<text class="section-note">按需选择，首次建议初次评估</text>
				</view>
				<view v-if="services.length === 0" class="empty-box">
					<text class="empty-title">暂无可预约的服务</text>
					<text class="empty-sub">请稍后再试或联系心理咨询中心</text>
				</view>
				<view
					v-for="s in services"
					:key="s.id"
					:class="['service-item', String(activeServiceId) === String(s.id) ? 'service-active' : '']"
					@click="selectService(s)">
					<view class="service-icon">
						<u-icon :name="serviceIcon(s.serviceType)" size="20" color="#2563eb"></u-icon>
					</view>
					<view class="service-body">
						<view class="service-line">
							<text class="service-name">{{ s.serviceName }}</text>
							<text class="service-duration">{{ s.durationMin }} 分钟</text>
						</view>
						<text class="service-desc">{{ s.description || s.audience || '面对面咨询' }}</text>
					</view>
					<view :class="['select-mark', String(activeServiceId) === String(s.id) ? 'mark-on' : '']">
						<u-icon v-if="String(activeServiceId) === String(s.id)" name="checkmark" size="12" color="#ffffff"></u-icon>
					</view>
				</view>
			</view>

			<view class="section">
				<view class="section-head">
					<text class="section-title">选择时段</text>
					<text class="section-note">每位咨询师开放时间不同</text>
				</view>
				<scroll-view scroll-x class="chip-scroll" v-if="counselors.length > 0">
					<view class="chip-row">
						<view
							:class="['filter-chip', !activeCounselorId ? 'chip-active' : '']"
							@click="selectCounselor('')">全部咨询师</view>
						<view
							v-for="c in counselors"
							:key="c.id"
							:class="['filter-chip', String(activeCounselorId) === String(c.id) ? 'chip-active' : '']"
							@click="selectCounselor(c.id)">{{ c.name }}</view>
					</view>
				</scroll-view>

				<view v-if="filteredGroups.length === 0" class="empty-box">
					<text class="empty-title">近期暂无可约时段</text>
					<text class="empty-sub">可以切换服务或咨询师再看看</text>
				</view>
				<view v-for="group in filteredGroups" :key="group.date" class="date-group">
					<view class="date-head">
						<view class="date-main">
							<text class="date-title">{{ group.label }}</text>
							<text class="date-badge" v-if="group.relative">{{ group.relative }}</text>
						</view>
						<text class="date-count">{{ group.slots.length }} 个时段</text>
					</view>
					<view
						v-for="slot in group.slots"
						:key="slot.id"
						:class="['slot-item', String(selectedSlotId) === String(slot.id) ? 'slot-active' : '']"
						@click="selectSlot(slot)">
						<view class="slot-time">
							<text class="slot-start">{{ hm(slot.startTime) }}</text>
							<text class="slot-end">{{ hm(slot.endTime) }}</text>
						</view>
						<view class="slot-info">
							<text class="slot-counselor">{{ slot.counselorName }}<text class="slot-title" v-if="slot.counselorTitle"> · {{ slot.counselorTitle }}</text></text>
							<text class="slot-loc">{{ slot.roomName }}<text v-if="slot.roomLocation"> · {{ slot.roomLocation }}</text></text>
						</view>
						<view class="slot-right">
							<text class="slot-left" v-if="Number(slot.capacity) - Number(slot.bookedCount) <= 2">余 {{ Number(slot.capacity) - Number(slot.bookedCount) }}</text>
							<view :class="['slot-radio', String(selectedSlotId) === String(slot.id) ? 'radio-on' : '']"></view>
						</view>
					</view>
				</view>
			</view>

			<view class="section form-section">
				<view class="section-head">
					<text class="section-title">预约信息</text>
					<text class="section-note">带 * 为必填</text>
				</view>
				<view class="picked-box" v-if="selectedSlot">
					<view class="picked-line">
						<u-icon name="calendar" size="15" color="#2563eb"></u-icon>
						<text class="picked-text">{{ selectedServiceName }} · {{ formatDateTime(selectedSlot.startTime) }}</text>
					</view>
					<view class="picked-line">
						<u-icon name="account" size="15" color="#2563eb"></u-icon>
						<text class="picked-text">{{ selectedSlot.counselorName }} · {{ selectedSlot.roomName }}</text>
					</view>
				</view>

				<view class="form-item">
					<text class="form-label">紧急程度</text>
					<view class="urgency-row">
						<view
							v-for="u in urgencyOptions"
							:key="u.value"
							:class="['urgency-chip', form.urgency === u.value ? 'urgency-active' : '']"
							@click="form.urgency = u.value">
							<text>{{ u.label }}</text>
						</view>
					</view>
					<text class="form-hint">如遇危及自身或他人的紧急情况，请直接联系心理咨询中心</text>
				</view>

				<view class="form-item">
					<view class="label-row">
						<text class="form-label">咨询事由 <text class="required">*</text></text>
						<text class="counter">{{ form.reason.length }}/500</text>
					</view>
					<textarea
						class="textarea"
						v-model="form.reason"
						maxlength="500"
						placeholder="简单说说你想聊的方向，例如学业压力、人际困扰、情绪低落" />
				</view>

				<view class="form-item">
					<view class="label-row">
						<text class="form-label">背景补充</text>
						<text class="counter">{{ form.background.length }}/1000</text>
					</view>
					<textarea
						class="textarea"
						v-model="form.background"
						maxlength="1000"
						placeholder="选填。近期变化、既往咨询经历、希望获得的帮助等" />
				</view>

				<view class="form-item">
					<text class="form-label">联系电话 <text class="required">*</text></text>
					<input class="input" v-model="form.contactPhone" maxlength="20" type="number" placeholder="便于中心与你确认时间" />
				</view>

				<view class="consent-row" @click="form.consent = !form.consent">
					<view :class="['checkbox', form.consent ? 'checkbox-on' : '']">
						<u-icon v-if="form.consent" name="checkmark" size="12" color="#ffffff"></u-icon>
					</view>
					<view class="consent-copy">
						<text class="consent-title">我已阅读并同意预约隐私告知</text>
						<text class="consent-desc">咨询事由与背景仅用于本次服务；咨询师及中心工作人员在职责范围内可查看。涉及安全风险时，按学校危机干预流程处理。</text>
					</view>
				</view>

				<button class="submit-btn" :disabled="submitting" @click="submit">
					{{ submitting ? '提交中...' : '提交预约' }}
				</button>
			</view>
		</view>

		<!-- 我的预约 -->
		<view v-if="activeTab === 1" class="tab-content">
			<scroll-view scroll-x class="chip-scroll">
				<view class="chip-row">
					<view
						v-for="f in myFilters"
						:key="f.value"
						:class="['filter-chip', myFilter === f.value ? 'chip-active' : '']"
						@click="myFilter = f.value">{{ f.label }}</view>
				</view>
			</scroll-view>

			<view v-if="filteredMyList.length === 0" class="empty-box">
				<text class="empty-title">{{ myFilter === 'ALL' ? '还没有预约记录' : '当前筛选下没有预约' }}</text>
				<text class="empty-sub">选择合适的时段，迈出第一步</text>
			</view>

			<view
				v-for="item in filteredMyList"
				:key="item.id"
				class="appointment-card"
				@click="openDetail(item.id)">
				<view class="card-head">
					<text class="card-service">{{ item.serviceName }}</text>
					<view :class="['status-tag', 'st-' + String(item.status).toLowerCase()]">{{ statusText(item.status) }}</view>
				</view>
				<view class="card-line">
					<u-icon name="calendar" size="15" color="#64748b"></u-icon>
					<text class="card-line-text">{{ formatDateTime(item.scheduledStart) }}</text>
				</view>
				<view class="card-line">
					<u-icon name="account" size="15" color="#64748b"></u-icon>
					<text class="card-line-text">{{ item.counselorName || '待中心安排咨询师' }}</text>
				</view>
				<view class="card-line">
					<u-icon name="map" size="15" color="#64748b"></u-icon>
					<text class="card-line-text">{{ item.roomName || '待安排咨询室' }}</text>
				</view>
				<view class="card-foot">
					<text class="card-no">{{ item.appointmentNo }}</text>
					<view class="card-actions">
						<view class="ghost-btn" v-if="canCancel(item)" @click.stop="cancelAppointment(item)">取消预约</view>
						<view class="detail-btn" @click.stop="openDetail(item.id)">查看详情</view>
					</view>
				</view>
			</view>
		</view>

		<!-- 消息通知 -->
		<view v-if="activeTab === 2" class="tab-content">
			<view class="notify-head">
				<text class="notify-count">{{ unreadCount > 0 ? unreadCount + ' 条未读' : '全部已读' }}</text>
				<view class="read-all" v-if="unreadCount > 0" @click="markAllRead">全部标记已读</view>
			</view>
			<view v-if="notifications.length === 0" class="empty-box">
				<text class="empty-title">暂无预约消息</text>
				<text class="empty-sub">预约状态变化时会在这里提醒你</text>
			</view>
			<view
				v-for="n in notifications"
				:key="n.id"
				:class="['notify-item', n.readFlag === '0' ? 'notify-unread' : '']"
				@click="openNotification(n)">
				<view class="notify-dot" v-if="n.readFlag === '0'"></view>
				<view class="notify-body">
					<text class="notify-title">{{ n.title }}</text>
					<text class="notify-content">{{ n.content }}</text>
					<text class="notify-time">{{ n.createTime }}</text>
				</view>
				<u-icon name="arrow-right" size="14" color="#cbd5e1"></u-icon>
			</view>
		</view>
	</view>
</template>

<script>
	import {
		getCounselServices,
		getCounselSlots,
		createCounselAppointment,
		getMyCounselAppointments,
		cancelCounselAppointment,
		getCounselNotifications,
		getCounselUnreadCount,
		markCounselNotificationRead,
		markAllCounselNotificationsRead
	} from '@/api/counsel/index.js'
	import userInfoApi from '@/api/student/userInfo.js'
	import requireLogin from '@/mixins/requireLogin.js'

	const STATUS_TEXT = {
		PENDING: '待确认',
		CONFIRMED: '已确认',
		COMPLETED: '已完成',
		REJECTED: '已驳回',
		CANCELED: '已取消',
		NO_SHOW: '爽约'
	}

	export default {
		mixins: [requireLogin],
		data() {
			return {
				activeTab: 0,
				tabs: [
					{ label: '预约咨询' },
					{ label: '我的预约' },
					{ label: '消息通知' }
				],
				services: [],
				activeServiceId: '',
				slots: [],
				counselors: [],
				activeCounselorId: '',
				selectedSlot: null,
				selectedSlotId: '',
				form: {
					urgency: 'NORMAL',
					reason: '',
					background: '',
					contactPhone: '',
					consent: false
				},
				urgencyOptions: [
					{ label: '一般', value: 'NORMAL' },
					{ label: '较急', value: 'URGENT' },
					{ label: '紧急', value: 'CRISIS' }
				],
				myList: [],
				myFilter: 'ALL',
				myFilters: [
					{ label: '全部', value: 'ALL' },
					{ label: '待确认', value: 'PENDING' },
					{ label: '已确认', value: 'CONFIRMED' },
					{ label: '已完成', value: 'COMPLETED' },
					{ label: '其他', value: 'OTHER' }
				],
				notifications: [],
				unreadCount: 0,
				submitting: false,
				loadingSlots: false
			}
		},
		computed: {
			selectedServiceName() {
				const service = this.services.find(s => String(s.id) === String(this.activeServiceId))
				return service ? service.serviceName : ''
			},
			filteredSlots() {
				if (!this.activeCounselorId) return this.slots
				return this.slots.filter(s => String(s.counselorId) === String(this.activeCounselorId))
			},
			filteredGroups() {
				const groups = []
				const map = {}
				this.filteredSlots.forEach(slot => {
					const date = String(slot.startTime || '').slice(0, 10)
					if (!date) return
					if (!map[date]) {
						map[date] = {
							date: date,
							label: this.dateLabel(date),
							relative: this.relativeDay(date),
							slots: []
						}
						groups.push(map[date])
					}
					map[date].slots.push(slot)
				})
				groups.forEach(g => g.slots.sort((a, b) => String(a.startTime).localeCompare(String(b.startTime))))
				return groups
			},
			filteredMyList() {
				if (this.myFilter === 'ALL') return this.myList
				if (this.myFilter === 'OTHER') {
					return this.myList.filter(i => ['COMPLETED', 'REJECTED', 'CANCELED', 'NO_SHOW'].indexOf(i.status) >= 0)
				}
				return this.myList.filter(i => i.status === this.myFilter)
			}
		},
		onLoad() {
			this.loadServices()
			this.loadMyAppointments()
			this.loadNotifications()
			this.loadStudentPhone()
		},
		methods: {
			switchTab(idx) {
				this.activeTab = idx
				if (idx === 1) this.loadMyAppointments()
				if (idx === 2) this.loadNotifications()
			},
			async loadServices() {
				try {
					const res = await getCounselServices()
					this.services = res.data.data || []
					if (this.services.length > 0) {
						const preferred = this.services.find(s => s.serviceType === 'INDIVIDUAL') || this.services[0]
						this.activeServiceId = preferred.id
						this.loadSlots()
					}
				} catch (e) {
					// 拦截器已提示
				}
			},
			async loadSlots() {
				if (!this.activeServiceId) return
				this.loadingSlots = true
				try {
					const res = await getCounselSlots({ serviceId: this.activeServiceId })
					this.slots = res.data.data || []
					this.buildCounselors()
					if (this.selectedSlot && !this.slots.some(s => String(s.id) === String(this.selectedSlotId))) {
						this.selectedSlot = null
						this.selectedSlotId = ''
					}
				} catch (e) {
					this.slots = []
				} finally {
					this.loadingSlots = false
				}
			},
			buildCounselors() {
				const map = {}
				const list = []
				this.slots.forEach(slot => {
					if (!slot.counselorId || map[slot.counselorId]) return
					map[slot.counselorId] = true
					list.push({
						id: slot.counselorId,
						name: slot.counselorName,
						title: slot.counselorTitle
					})
				})
				this.counselors = list
				if (this.activeCounselorId && !list.some(c => String(c.id) === String(this.activeCounselorId))) {
					this.activeCounselorId = ''
				}
			},
			selectService(service) {
				if (String(this.activeServiceId) === String(service.id)) return
				this.activeServiceId = service.id
				this.selectedSlot = null
				this.selectedSlotId = ''
				this.activeCounselorId = ''
				this.loadSlots()
			},
			selectCounselor(id) {
				this.activeCounselorId = id
				if (this.selectedSlot && id && String(this.selectedSlot.counselorId) !== String(id)) {
					this.selectedSlot = null
					this.selectedSlotId = ''
				}
			},
			selectSlot(slot) {
				if (this.selectedSlotId && String(this.selectedSlotId) === String(slot.id)) {
					this.selectedSlot = null
					this.selectedSlotId = ''
					return
				}
				this.selectedSlot = slot
				this.selectedSlotId = slot.id
			},
			async loadStudentPhone() {
				try {
					const { data } = await userInfoApi.getMyStudentInfo()
					if (data.code === 200 && data.data && data.data.phone && !this.form.contactPhone) {
						this.form.contactPhone = data.data.phone
					}
				} catch (e) {
					// 手机号可手动填写
				}
			},
			async loadMyAppointments() {
				try {
					const res = await getMyCounselAppointments()
					this.myList = res.data.data || []
				} catch (e) {
					// 拦截器已提示
				}
			},
			async loadNotifications() {
				try {
					const [listRes, countRes] = await Promise.all([
						getCounselNotifications(30),
						getCounselUnreadCount()
					])
					this.notifications = listRes.data.data || []
					this.unreadCount = Number(countRes.data.data || 0)
				} catch (e) {
					// 拦截器已提示
				}
			},
			async markAllRead() {
				try {
					await markAllCounselNotificationsRead()
					this.notifications.forEach(n => { n.readFlag = '1' })
					this.unreadCount = 0
					uni.showToast({ title: '已全部标记为已读', icon: 'none' })
				} catch (e) {
					// 拦截器已提示
				}
			},
			async openNotification(item) {
				if (item.readFlag === '0') {
					try {
						await markCounselNotificationRead(item.id)
						item.readFlag = '1'
						this.unreadCount = Math.max(0, this.unreadCount - 1)
					} catch (e) {
						// 已读失败不阻断查看
					}
				}
				if (item.businessType === 'appointment' && item.businessId) {
					this.openDetail(item.businessId)
				}
			},
			openDetail(id) {
				uni.navigateTo({ url: '/pages/counsel/detail?id=' + id })
			},
			canCancel(item) {
				if (!item || ['PENDING', 'CONFIRMED'].indexOf(item.status) < 0) return false
				const start = this.parseTime(item.scheduledStart)
				return start && start.getTime() > Date.now()
			},
			cancelAppointment(item) {
				uni.showModal({
					title: '取消预约',
					content: '距咨询开始不足 24 小时将无法自助取消。确定取消这次预约吗？',
					confirmText: '确定取消',
					confirmColor: '#dc2626',
					success: async res => {
						if (!res.confirm) return
						try {
							await cancelCounselAppointment(item.id, '学生取消预约')
							uni.showToast({ title: '预约已取消', icon: 'success' })
							this.loadSlots()
							this.loadMyAppointments()
							this.loadNotifications()
						} catch (e) {
							// 拦截器已提示
						}
					}
				})
			},
			submit() {
				if (!this.selectedSlot) {
					uni.showToast({ title: '请先选择可约时段', icon: 'none' })
					return
				}
				if (!this.form.reason.trim()) {
					uni.showToast({ title: '请填写咨询事由', icon: 'none' })
					return
				}
				const phone = this.form.contactPhone.trim()
				if (!phone) {
					uni.showToast({ title: '请填写联系电话', icon: 'none' })
					return
				}
				if (!/^[0-9+\-\s]{6,20}$/.test(phone)) {
					uni.showToast({ title: '联系电话格式不正确', icon: 'none' })
					return
				}
				if (!this.form.consent) {
					uni.showToast({ title: '请先阅读并同意隐私告知', icon: 'none' })
					return
				}
				uni.showModal({
					title: '确认预约',
					content: this.selectedServiceName + '\n' + this.formatDateTime(this.selectedSlot.startTime) + '\n' + this.selectedSlot.counselorName,
					confirmText: '确认提交',
					success: async res => {
						if (!res.confirm) return
						await this.doSubmit()
					}
				})
			},
			async doSubmit() {
				this.submitting = true
				try {
					const res = await createCounselAppointment({
						slotId: this.selectedSlotId,
						urgency: this.form.urgency,
						reason: this.form.reason.trim(),
						background: this.form.background.trim(),
						contactPhone: this.form.contactPhone.trim(),
						consent: true
					})
					uni.showToast({ title: res.data.msg || '预约已提交', icon: 'success' })
					this.form.reason = ''
					this.form.background = ''
					this.form.urgency = 'NORMAL'
					this.form.consent = false
					this.selectedSlot = null
					this.selectedSlotId = ''
					this.loadSlots()
					this.activeTab = 1
					this.loadMyAppointments()
					this.loadNotifications()
				} catch (e) {
					// 拦截器已提示具体原因
				} finally {
					this.submitting = false
				}
			},
			serviceIcon(type) {
				if (type === 'INTAKE') return 'file-text'
				if (type === 'GROUP') return 'account'
				return 'heart'
			},
			statusText(status) {
				return STATUS_TEXT[status] || status || '未知'
			},
			hm(value) {
				return String(value || '').slice(11, 16)
			},
			parseTime(value) {
				if (!value) return null
				const date = new Date(String(value).replace(/-/g, '/'))
				return isNaN(date.getTime()) ? null : date
			},
			formatDateTime(value) {
				if (!value) return '--'
				const text = String(value)
				return text.slice(5, 10).replace('-', '月') + '日 ' + text.slice(11, 16)
			},
			dateLabel(dateStr) {
				const date = new Date(String(dateStr).replace(/-/g, '/') + ' 00:00:00')
				const week = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][date.getDay()]
				return dateStr.slice(5, 7) + '月' + dateStr.slice(8, 10) + '日 ' + week
			},
			relativeDay(dateStr) {
				const today = new Date()
				const base = new Date(today.getFullYear(), today.getMonth(), today.getDate())
				const target = new Date(String(dateStr).replace(/-/g, '/') + ' 00:00:00')
				const diff = Math.round((target.getTime() - base.getTime()) / 86400000)
				if (diff === 0) return '今天'
				if (diff === 1) return '明天'
				if (diff === 2) return '后天'
				return ''
			}
		}
	}
</script>

<style lang="scss" scoped>
	.counsel-page {
		min-height: 100vh;
		background: #f4f7fb;
		padding-bottom: 40rpx;
	}

	.hero {
		background: linear-gradient(135deg, #2563eb 0%, #0ea5a4 100%);
		padding: 36rpx 32rpx 30rpx;
		border-bottom-left-radius: 28rpx;
		border-bottom-right-radius: 28rpx;
	}

	.hero-row {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
	}

	.hero-copy {
		display: flex;
		flex-direction: column;
	}

	.hero-title {
		font-size: 44rpx;
		font-weight: 700;
		color: #ffffff;
		letter-spacing: 0;
	}

	.hero-sub {
		margin-top: 10rpx;
		font-size: 25rpx;
		color: rgba(255, 255, 255, 0.88);
	}

	.bell-wrap {
		position: relative;
		width: 72rpx;
		height: 72rpx;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.16);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.bell-badge {
		position: absolute;
		top: -6rpx;
		right: -6rpx;
		min-width: 30rpx;
		height: 30rpx;
		padding: 0 8rpx;
		border-radius: 15rpx;
		background: #f97316;
		color: #ffffff;
		font-size: 19rpx;
		line-height: 30rpx;
		text-align: center;
		box-sizing: border-box;
	}

	.hero-note {
		margin-top: 26rpx;
		display: flex;
		align-items: center;
		background: rgba(255, 255, 255, 0.12);
		border-radius: 12rpx;
		padding: 12rpx 18rpx;
	}

	.hero-note-text {
		margin-left: 10rpx;
		font-size: 22rpx;
		color: rgba(255, 255, 255, 0.9);
	}

	.tab-bar {
		display: flex;
		background: #ffffff;
		margin: 24rpx 24rpx 0;
		border-radius: 16rpx;
		overflow: hidden;
		box-shadow: 0 4rpx 16rpx rgba(15, 23, 42, 0.04);
	}

	.tab-item {
		flex: 1;
		position: relative;
		padding: 24rpx 0 22rpx;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.tab-label {
		font-size: 27rpx;
		color: #64748b;
	}

	.tab-active .tab-label {
		color: #1d4ed8;
		font-weight: 600;
	}

	.tab-underline {
		position: absolute;
		bottom: 10rpx;
		width: 36rpx;
		height: 6rpx;
		border-radius: 3rpx;
		background: #2563eb;
	}

	.tab-content {
		padding: 24rpx;
	}

	.section {
		background: #ffffff;
		border-radius: 16rpx;
		padding: 26rpx 24rpx;
		margin-bottom: 24rpx;
		box-shadow: 0 4rpx 16rpx rgba(15, 23, 42, 0.04);
	}

	.section-head {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		margin-bottom: 20rpx;
	}

	.section-title {
		font-size: 31rpx;
		font-weight: 600;
		color: #0f172a;
	}

	.section-note {
		font-size: 22rpx;
		color: #94a3b8;
	}

	.service-item {
		display: flex;
		align-items: center;
		border: 2rpx solid #e2e8f0;
		border-radius: 14rpx;
		padding: 20rpx 18rpx;
		margin-bottom: 16rpx;
	}

	.service-item:last-child {
		margin-bottom: 0;
	}

	.service-active {
		border-color: #2563eb;
		background: #eff6ff;
	}

	.service-icon {
		width: 64rpx;
		height: 64rpx;
		border-radius: 12rpx;
		background: #dbeafe;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.service-body {
		flex: 1;
		margin-left: 18rpx;
		min-width: 0;
	}

	.service-line {
		display: flex;
		align-items: center;
	}

	.service-name {
		font-size: 28rpx;
		font-weight: 600;
		color: #0f172a;
	}

	.service-duration {
		margin-left: 14rpx;
		font-size: 22rpx;
		color: #64748b;
		background: #f1f5f9;
		border-radius: 8rpx;
		padding: 2rpx 10rpx;
	}

	.service-desc {
		display: block;
		margin-top: 8rpx;
		font-size: 22rpx;
		color: #64748b;
		line-height: 1.5;
	}

	.select-mark {
		width: 36rpx;
		height: 36rpx;
		border-radius: 50%;
		border: 2rpx solid #cbd5e1;
		margin-left: 14rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.mark-on {
		background: #2563eb;
		border-color: #2563eb;
	}

	.chip-scroll {
		white-space: nowrap;
		width: 100%;
		margin-bottom: 12rpx;
	}

	.chip-row {
		display: inline-flex;
		align-items: center;
		padding-bottom: 6rpx;
	}

	.filter-chip {
		display: inline-block;
		padding: 10rpx 24rpx;
		border-radius: 32rpx;
		font-size: 24rpx;
		color: #475569;
		background: #f1f5f9;
		margin-right: 14rpx;
		border: 2rpx solid transparent;
	}

	.filter-chip:last-child {
		margin-right: 0;
	}

	.chip-active {
		color: #1d4ed8;
		background: #eff6ff;
		border-color: #93c5fd;
		font-weight: 500;
	}

	.date-group {
		margin-top: 16rpx;
	}

	.date-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 6rpx 2rpx 12rpx;
	}

	.date-main {
		display: flex;
		align-items: center;
	}

	.date-title {
		font-size: 26rpx;
		font-weight: 600;
		color: #334155;
	}

	.date-badge {
		margin-left: 10rpx;
		font-size: 20rpx;
		color: #ea580c;
		background: #fff7ed;
		border-radius: 8rpx;
		padding: 2rpx 10rpx;
	}

	.date-count {
		font-size: 22rpx;
		color: #94a3b8;
	}

	.slot-item {
		display: flex;
		align-items: center;
		border: 2rpx solid #e2e8f0;
		border-radius: 14rpx;
		padding: 18rpx;
		margin-bottom: 14rpx;
	}

	.slot-active {
		border-color: #2563eb;
		background: #f8fbff;
	}

	.slot-time {
		width: 104rpx;
		flex-shrink: 0;
		display: flex;
		flex-direction: column;
	}

	.slot-start {
		font-size: 32rpx;
		font-weight: 600;
		color: #0f172a;
	}

	.slot-end {
		margin-top: 4rpx;
		font-size: 21rpx;
		color: #94a3b8;
	}

	.slot-info {
		flex: 1;
		min-width: 0;
		padding-left: 16rpx;
		border-left: 2rpx solid #eef2f7;
	}

	.slot-counselor {
		display: block;
		font-size: 26rpx;
		color: #1e293b;
		font-weight: 500;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.slot-title {
		font-size: 22rpx;
		color: #64748b;
		font-weight: 400;
	}

	.slot-loc {
		display: block;
		margin-top: 6rpx;
		font-size: 21rpx;
		color: #94a3b8;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.slot-right {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		margin-left: 12rpx;
		flex-shrink: 0;
	}

	.slot-left {
		font-size: 20rpx;
		color: #ea580c;
		margin-bottom: 8rpx;
	}

	.slot-radio {
		width: 34rpx;
		height: 34rpx;
		border-radius: 50%;
		border: 2rpx solid #cbd5e1;
		box-sizing: border-box;
	}

	.radio-on {
		border: 9rpx solid #2563eb;
	}

	.picked-box {
		background: #f8fbff;
		border: 2rpx solid #dbeafe;
		border-radius: 12rpx;
		padding: 16rpx 18rpx;
		margin-bottom: 24rpx;
	}

	.picked-line {
		display: flex;
		align-items: center;
		margin-bottom: 8rpx;
	}

	.picked-line:last-child {
		margin-bottom: 0;
	}

	.picked-text {
		margin-left: 10rpx;
		font-size: 24rpx;
		color: #1e3a8a;
	}

	.form-item {
		margin-bottom: 26rpx;
	}

	.form-label {
		display: block;
		font-size: 26rpx;
		color: #334155;
		font-weight: 500;
		margin-bottom: 12rpx;
	}

	.required {
		color: #ef4444;
	}

	.label-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.counter {
		font-size: 21rpx;
		color: #94a3b8;
	}

	.urgency-row {
		display: flex;
	}

	.urgency-chip {
		flex: 1;
		text-align: center;
		padding: 14rpx 0;
		border: 2rpx solid #e2e8f0;
		border-radius: 12rpx;
		font-size: 25rpx;
		color: #475569;
		margin-right: 14rpx;
	}

	.urgency-chip:last-child {
		margin-right: 0;
	}

	.urgency-active {
		border-color: #2563eb;
		background: #eff6ff;
		color: #1d4ed8;
		font-weight: 500;
	}

	.form-hint {
		display: block;
		margin-top: 10rpx;
		font-size: 21rpx;
		color: #94a3b8;
		line-height: 1.5;
	}

	.textarea {
		width: 100%;
		min-height: 128rpx;
		border: 2rpx solid #e2e8f0;
		border-radius: 12rpx;
		padding: 16rpx 18rpx;
		font-size: 25rpx;
		color: #334155;
		background: #fbfdff;
		box-sizing: border-box;
		line-height: 1.5;
	}

	.input {
		width: 100%;
		height: 88rpx;
		line-height: 52rpx;
		border: 2rpx solid #e2e8f0;
		border-radius: 12rpx;
		padding: 0 18rpx;
		font-size: 25rpx;
		color: #334155;
		background: #fbfdff;
		box-sizing: border-box;
	}

	.consent-row {
		display: flex;
		align-items: flex-start;
		padding: 18rpx;
		background: #f8fafc;
		border-radius: 12rpx;
		margin-bottom: 26rpx;
	}

	.checkbox {
		width: 34rpx;
		height: 34rpx;
		border-radius: 8rpx;
		border: 2rpx solid #cbd5e1;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		margin-top: 2rpx;
		box-sizing: border-box;
	}

	.checkbox-on {
		background: #2563eb;
		border-color: #2563eb;
	}

	.consent-copy {
		margin-left: 14rpx;
		flex: 1;
	}

	.consent-title {
		display: block;
		font-size: 25rpx;
		color: #334155;
		font-weight: 500;
	}

	.consent-desc {
		display: block;
		margin-top: 8rpx;
		font-size: 21rpx;
		color: #64748b;
		line-height: 1.55;
	}

	.submit-btn {
		width: 100%;
		height: 88rpx;
		line-height: 88rpx;
		background: linear-gradient(135deg, #2563eb 0%, #0d9488 100%);
		color: #ffffff;
		font-size: 29rpx;
		font-weight: 600;
		border-radius: 44rpx;
		border: none;
	}

	.submit-btn[disabled] {
		opacity: 0.6;
	}

	.empty-box {
		padding: 60rpx 20rpx;
		display: flex;
		flex-direction: column;
		align-items: center;
		background: #ffffff;
		border-radius: 16rpx;
	}

	.empty-title {
		font-size: 27rpx;
		color: #475569;
	}

	.empty-sub {
		margin-top: 10rpx;
		font-size: 22rpx;
		color: #94a3b8;
	}

	.appointment-card {
		background: #ffffff;
		border-radius: 16rpx;
		padding: 24rpx;
		margin-bottom: 20rpx;
		box-shadow: 0 4rpx 16rpx rgba(15, 23, 42, 0.04);
	}

	.card-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 18rpx;
	}

	.card-service {
		font-size: 30rpx;
		font-weight: 600;
		color: #0f172a;
	}

	.status-tag {
		font-size: 22rpx;
		padding: 4rpx 16rpx;
		border-radius: 20rpx;
		background: #f1f5f9;
		color: #64748b;
	}

	.st-pending {
		background: #fff7ed;
		color: #c2410c;
	}

	.st-confirmed {
		background: #ecfdf5;
		color: #047857;
	}

	.st-completed {
		background: #eff6ff;
		color: #1d4ed8;
	}

	.st-rejected,
	.st-no_show {
		background: #fef2f2;
		color: #b91c1c;
	}

	.card-line {
		display: flex;
		align-items: center;
		margin-bottom: 12rpx;
	}

	.card-line-text {
		margin-left: 10rpx;
		font-size: 24rpx;
		color: #475569;
	}

	.card-foot {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-top: 20rpx;
		padding-top: 18rpx;
		border-top: 2rpx solid #f1f5f9;
	}

	.card-no {
		font-size: 20rpx;
		color: #94a3b8;
	}

	.card-actions {
		display: flex;
		align-items: center;
	}

	.ghost-btn {
		font-size: 23rpx;
		color: #b91c1c;
		border: 2rpx solid #fecaca;
		border-radius: 24rpx;
		padding: 6rpx 18rpx;
		margin-right: 12rpx;
	}

	.detail-btn {
		font-size: 23rpx;
		color: #1d4ed8;
		background: #eff6ff;
		border-radius: 24rpx;
		padding: 6rpx 18rpx;
	}

	.notify-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 4rpx 4rpx 18rpx;
	}

	.notify-count {
		font-size: 25rpx;
		color: #475569;
	}

	.read-all {
		font-size: 23rpx;
		color: #1d4ed8;
	}

	.notify-item {
		display: flex;
		align-items: center;
		background: #ffffff;
		border-radius: 16rpx;
		padding: 22rpx 20rpx;
		margin-bottom: 16rpx;
		box-shadow: 0 4rpx 16rpx rgba(15, 23, 42, 0.04);
	}

	.notify-unread {
		background: #f8fbff;
	}

	.notify-dot {
		width: 14rpx;
		height: 14rpx;
		border-radius: 50%;
		background: #f97316;
		margin-right: 16rpx;
		flex-shrink: 0;
	}

	.notify-body {
		flex: 1;
		min-width: 0;
	}

	.notify-title {
		display: block;
		font-size: 27rpx;
		font-weight: 500;
		color: #0f172a;
	}

	.notify-content {
		display: block;
		margin-top: 8rpx;
		font-size: 24rpx;
		color: #475569;
		line-height: 1.55;
	}

	.notify-time {
		display: block;
		margin-top: 10rpx;
		font-size: 21rpx;
		color: #94a3b8;
	}
</style>
