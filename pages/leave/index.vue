<template>
	<view class="page-wrap">
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

		<!-- 列表Tab -->
		<view v-if="activeTab === 0">
			<!-- 筛选状态 -->
			<scroll-view scroll-x class="filter-bar">
				<view
					v-for="(s, idx) in statusOptions"
					:key="idx"
					:class="['filter-chip', filterStatus === s.value ? 'chip-active' : '']"
					@click="filterStatus = s.value; loadList()">
					{{ s.label }}
				</view>
			</scroll-view>

			<view v-if="list.length > 0" class="leave-list">
				<view class="leave-item" v-for="item in list" :key="item.id">
					<view class="item-header">
						<view class="header-left">
							<text class="leave-type">{{ leaveTypeText(item.leaveType) }} {{ item.applyNo }}</text>
							<text class="transport-info" v-if="item.transportType">{{ transportText(item.transportType, item.transportInfo) }}</text>
						</view>
						<view :class="['status-tag', 'status-' + item.approvalStatus]">
							{{ statusText(item.approvalStatus) }}
						</view>
					</view>
					<view class="item-body">
						<view class="info-row">
							<text class="info-label">假期时间</text>
							<text class="info-val">{{ formatLeaveRange(item.startTime, item.endTime) }}</text>
						</view>
						<view class="info-row compact-row">
							<text class="compact-item"><text class="info-label">天数</text> <text class="info-val">{{ formatDays(item.leaveDays) }} 天</text></text>
							<text class="compact-item"><text class="info-label">原因</text> <text class="info-val reason-text">{{ item.leaveReason || '--' }}</text></text>
						</view>
						<view class="info-row" v-if="item.transportType">
							<text class="info-label">交通</text>
							<text class="info-val">{{ transportText(item.transportType, item.transportInfo) }}</text>
						</view>
						<view class="info-row" v-if="item.approvalRemark">
							<text class="info-label">审批意见</text>
							<text class="info-val">{{ item.approvalRemark }}</text>
						</view>
						<view class="info-row" v-if="item.approvalStatus === 'pending' || item.approvalStatus === 'forward'">
							<text class="info-label">下一步审批</text>
							<text class="info-val next-approver">{{ nextApproverText(item) }}</text>
						</view>
						<view class="info-row">
							<text class="info-label">审批流程</text>
							<text class="info-val flow-text">{{ flowText(item) }}</text>
						</view>
						<view class="info-row" v-if="item.scorePoints != null && item.scorePoints !== 0">
							<text class="info-label">扣分</text>
							<text class="info-val score-points">{{ item.scorePoints }} 分</text>
						</view>
						<view class="info-row" v-if="item.leaveAttachmentList && item.leaveAttachmentList.length">
							<text class="info-label">佐证材料</text>
							<view class="attach-list">
								<image
									v-for="(img, imgIdx) in item.leaveAttachmentList"
									:key="imgIdx"
									class="attach-img"
									:src="getAttachmentUrl(img.filePath)"
									mode="aspectFill"
									@click.stop="previewAttachment(imgIdx, item.leaveAttachmentList)"
									@error="onImageError"></image>
							</view>
						</view>
						<view class="info-row">
							<text class="info-label">申请时间</text>
							<text class="info-val">{{ formatDate(item.createTime) }}</text>
						</view>
					</view>
				</view>
			</view>
			<view v-else class="empty-tip">
				<text>暂无请假记录</text>
			</view>

			<!-- 加载更多 -->
			<view v-if="hasMore" class="load-more" @click="loadMore">
				<text>{{ loading ? '加载中...' : '加载更多' }}</text>
			</view>
		</view>

		<!-- 申请Tab -->
		<view v-if="activeTab === 1" class="apply-wrap">
			<view class="form-card">
				<view class="form-title">申请请假</view>

				<!-- 请假类型 -->
				<view class="form-item">
					<text class="form-label">请假类型 <text class="required">*</text></text>
					<view class="radio-group">
						<view
							v-for="t in leaveTypes"
							:key="t.value"
							:class="['radio-item', form.leaveType === t.value ? 'radio-active' : '']"
							@click="form.leaveType = t.value">
							{{ t.label }}
						</view>
					</view>
				</view>

				<!-- 请假时间（支持半天） -->
				<view class="form-item">
					<text class="form-label">请假时间 <text class="required">*</text></text>
					<view class="quick-duration">
						<view
							v-for="q in quickDurations"
							:key="q.value"
							:class="['quick-chip', leaveDaysCalc === q.value ? 'quick-active' : '']"
							@click="applyQuickDuration(q.value)">
							{{ q.label }}
						</view>
					</view>
					<view class="time-block">
						<text class="time-block-label">开始</text>
						<view class="time-row">
							<picker class="time-date-picker" mode="date" :value="startDateValue" :start="todayStr" :end="startDateMaxStr" @change="onStartDateChange">
								<view class="picker-display">
									<text>{{ startDateValue ? startDateValue + ' ' + halfText(form.startHalf) : '请选择开始日期' }}</text>
									<text class="arrow">›</text>
								</view>
							</picker>
							<view class="half-toggle">
								<view :class="['half-item', form.startHalf === 'am' ? 'half-active' : '']" @click="onStartHalfChange('am')">上午</view>
								<view :class="['half-item', form.startHalf === 'pm' ? 'half-active' : '']" @click="onStartHalfChange('pm')">下午</view>
							</view>
						</view>
						<text class="sub-tip">上午按 08:00 开始，下午按 14:00 开始</text>
					</view>
					<view class="time-block">
						<text class="time-block-label">结束</text>
						<view class="time-row">
							<picker class="time-date-picker" mode="date" :value="endDateValue" :start="startDateValue || todayStr" :end="endDateMaxStr" @change="onEndDateChange">
								<view class="picker-display">
									<text>{{ endDateValue ? endDateValue + ' ' + halfText(form.endHalf) : '请选择结束日期' }}</text>
									<text class="arrow">›</text>
								</view>
							</picker>
							<view class="half-toggle">
								<view :class="['half-item', form.endHalf === 'am' ? 'half-active' : '']" @click="onEndHalfChange('am')">上午</view>
								<view :class="['half-item', form.endHalf === 'pm' ? 'half-active' : '']" @click="onEndHalfChange('pm')">下午</view>
							</view>
						</view>
						<text class="sub-tip">上午按 12:00 结束，下午按 18:00 结束</text>
					</view>
					<text class="sub-tip">最多提前7天申请，单次请假最多7天，超出请线下找辅导员申请</text>
				</view>

				<!-- 请假天数（自动计算） -->
				<view class="form-item" v-if="form.startTime && form.endTime">
					<text class="form-label">请假天数</text>
					<text class="days-text">{{ formatDays(leaveDaysCalc) }} 天</text>
					<text class="days-warn" v-if="leaveDaysCalc > 7">超过7天，请线下申请</text>
				</view>

				<!-- 请假原因（选择为主） -->
				<view class="form-item">
					<text class="form-label">请假原因 <text class="required">*</text></text>
					<view class="radio-group">
						<view
							v-for="r in reasonOptions"
							:key="r.value"
							:class="['radio-item', form.reasonType === r.value ? 'radio-active' : '']"
							@click="onReasonSelect(r.value)">
							{{ r.label }}
						</view>
					</view>
					<textarea
						class="textarea"
						v-model="form.leaveReason"
						placeholder="补充说明（选填）"
						maxlength="200"
						:auto-height="true"
					/>
					<text class="char-count">{{ (form.leaveReason || '').length }}/200</text>
				</view>

				<!-- 目的地 -->
				<view class="form-item">
					<text class="form-label">去往地点</text>
					<region-picker v-model="form.destination" default-province="广东省" detail-placeholder="具体地点（选填）" />
				</view>

				<!-- 联系电话 -->
				<view class="form-item">
					<text class="form-label">联系电话 <text class="required">*</text></text>
					<input class="input" v-model="form.contactPhone" placeholder="请假期间联系电话" type="number" maxlength="11" />
					<text class="sub-tip">自动带出学生信息中的手机号，修改后将记录为历史电话</text>
				</view>

				<!-- 离校方式 -->
				<view class="form-item">
					<text class="form-label">离校方式 <text class="required">*</text></text>
					<picker mode="selector" :range="transportTypes" range-key="label" :value="transportIndex" @change="onTransportChange">
						<view class="picker-display">
							<text>{{ transportName || '请选择离校方式' }}</text>
							<text class="arrow">›</text>
						</view>
					</picker>
				</view>

				<!-- 交通信息 -->
				<view class="form-item" v-if="form.transportType">
					<text class="form-label">{{ transportInfoLabel }}</text>
					<input class="input" v-model="form.transportInfo" :placeholder="transportInfoPlaceholder" />
				</view>

				<!-- 佐证材料 -->
				<view class="form-item">
					<text class="form-label">佐证材料 <text class="required">*</text></text>
					<view class="upload-box" @click="chooseImage">
						<text class="upload-icon">+</text>
						<text class="upload-text">上传图片（至少1张，如病假证明、车票等）</text>
						<text class="upload-limit">{{ photoList.length }}/5</text>
					</view>
					<view class="photo-list" v-if="photoList.length > 0">
						<view class="photo-item" v-for="(src, idx) in photoList" :key="idx">
							<image class="photo-img" :src="src" mode="aspectFill" @click="previewImage(idx)"></image>
							<text class="photo-remove" @click.stop="removeImage(idx)">×</text>
						</view>
					</view>
				</view>

				<!-- 温馨提示 -->
				<view class="tips-box">
					<text class="tips-title">温馨提示</text>
					<text class="tips-text">· 3天及以内由辅导员审批，超过3天需书记审批</text>
					<text class="tips-text" v-if="scoreHint && scoreHint.points !== 0">· 本次属于{{ scoreHint.sceneName }}，预计{{ scoreHint.points >= 0 ? '加' : '扣' }}{{ Math.abs(scoreHint.points) }}分二课积分</text>
					<text class="tips-text" v-else-if="!scoreHint">· 请选择起止时间后查看积分变化提示</text>
					<text class="tips-text">· 请如实填写信息，祝假期愉快</text>
				</view>

				<u-button type="primary" :loading="submitting" @click="submitApply">提交申请</u-button>
			</view>
		</view>
	</view>
</template>

<script>
import { getMyLeaves, applyLeave, getLeaveScoreHint } from '@/api/affair/leave.js'
import userInfoApi from '@/api/student/userInfo.js'
import config from '@/config'
import { isLogin } from '@/utils/auth'
import requireLogin from '@/mixins/requireLogin.js'

export default {
	mixins: [requireLogin],
	data() {
		return {
			activeTab: 0,
			tabs: [{ label: '我的请假' }, { label: '申请请假' }],
			// 列表
			list: [],
			pageNum: 1,
			pageSize: 10,
			hasMore: false,
			loading: false,
			filterStatus: '',
			statusOptions: [
				{ label: '全部', value: '' },
				{ label: '待审批', value: 'pending' },
				{ label: '已批准', value: 'approved' },
				{ label: '已拒绝', value: 'rejected' },
			],
			// 申请表单
			form: {
				leaveType: 'personal',
				startTime: '',
				endTime: '',
				startHalf: 'am',
				endHalf: 'pm',
				leaveReason: '',
				reasonType: '',
				destination: '',
				contactPhone: '',
				transportType: '',
				transportInfo: '',
			},
			// 请假时长快捷选项（按半天为最小粒度）
			quickDurations: [
				{ label: '半天', value: 0.5 },
				{ label: '1天', value: 1 },
				{ label: '3天', value: 3 },
				{ label: '一周', value: 7 },
			],
			leaveTypes: [
				{ label: '事假', value: 'personal' },
				{ label: '病假', value: 'sick' },
				{ label: '公假', value: 'public' },
				{ label: '其他', value: 'other' },
			],
			// 请假原因快捷选项（根据请假类型动态显示）
			reasonMap: {
				personal: ['家庭急事', '办理证件', '其他事假'],
				sick: ['生病就医', '复诊检查', '身体不适'],
				public: ['学校活动', '竞赛考试', '会议培训'],
				other: ['交通延误', '天气原因', '其他原因'],
			},
			transportTypes: [
				{ label: '火车', value: 'train' },
				{ label: '飞机', value: 'plane' },
				{ label: '汽车', value: 'bus' },
				{ label: '其他', value: 'other' },
			],
			photoList: [],
			uploadedFiles: [],
			originalPhone: '',
			scoreHint: null,
			submitting: false,
		}
	},
	computed: {
		// 今天 yyyy-MM-dd
		todayStr() {
			return this.formatDateStr(new Date())
		},
		// 开始日期最大值：今天+7天
		startDateMaxStr() {
			const d = new Date()
			d.setDate(d.getDate() + 7)
			return this.formatDateStr(d)
		},
		startDateValue() {
			return this.dateOnly(this.form.startTime)
		},
		endDateValue() {
			return this.dateOnly(this.form.endTime)
		},
		// 结束日期最大值：开始日期+7天（下午开始的一周假需要跨到第7天上午）
		endDateMaxStr() {
			if (this.form.startTime) {
				const d = new Date(this.dateOnly(this.form.startTime) + 'T00:00:00')
				d.setDate(d.getDate() + 7)
				return this.formatDateStr(d)
			}
			// 未选开始日期时默认限制为今天+14天（开始7+结束7）
			const d = new Date()
			d.setDate(d.getDate() + 14)
			return this.formatDateStr(d)
		},
		leaveDaysCalc() {
			if (!this.form.startTime || !this.form.endTime) return 0
			const start = this.halfIndex(this.dateOnly(this.form.startTime), this.form.startHalf)
			const end = this.halfIndex(this.dateOnly(this.form.endTime), this.form.endHalf)
			return end >= start ? (end - start + 1) / 2 : 0
		},
		reasonOptions() {
			const opts = this.reasonMap[this.form.leaveType] || this.reasonMap.other
			return opts.map(label => ({ label, value: label }))
		},
		transportIndex() {
			const idx = this.transportTypes.findIndex(t => t.value === this.form.transportType)
			return idx >= 0 ? idx : 0
		},
		transportName() {
			const t = this.transportTypes.find(t => t.value === this.form.transportType)
			return t ? t.label : ''
		},
		transportInfoLabel() {
			const map = { train: '车次', plane: '航班号', bus: '车牌/班线', other: '交通信息' }
			return map[this.form.transportType] || '交通信息'
		},
		transportInfoPlaceholder() {
			const map = {
				train: '如：G1234',
				plane: '如：CA1234',
				bus: '如：粤A12345 / 广州-深圳快线',
				other: '请填写交通工具信息'
			}
			return map[this.form.transportType] || '请填写交通工具信息'
		}
	},
	onLoad() {
		this.loadList()
		if (isLogin()) {
			this.loadMyStudentInfo()
		}
		// 监听静默登录成功事件，登录后自动加载学生信息填充联系电话
		uni.$on('app:silentLoginSuccess', this.onSilentLoginForLeave)
	},
	onUnload() {
		uni.$off('app:silentLoginSuccess', this.onSilentLoginForLeave)
	},
	methods: {
		switchTab(idx) {
			this.activeTab = idx
			if (idx === 0) this.loadList()
		},
		// 加载当前登录学生信息并填充联系电话
		async loadMyStudentInfo() {
			try {
				const { data } = await userInfoApi.getMyStudentInfo()
				if (data.code === 200 && data.data) {
					const stu = data.data
					if (stu.phone) {
						this.form.contactPhone = stu.phone
						this.originalPhone = stu.phone
					}
				}
			} catch (e) {
				// 加载学生信息失败
			}
		},
		// 静默登录成功后加载学生信息
		onSilentLoginForLeave() {
			if (!this.originalPhone) {
				this.loadMyStudentInfo()
			}
		},
		// 获取佐证材料完整 URL（/profile 在 Nginx 根路径，不在 /prod-api 下）
		getAttachmentUrl(filePath) {
			if (!filePath) return ''
			if (filePath.startsWith('http')) return filePath
			// 从 baseURL 提取域名根路径（去掉 /prod-api）
			const origin = config.baseURL.replace(/\/prod-api$/, '')
			return origin + '/profile' + filePath
		},
		// 图片加载失败处理
		onImageError(e) {
			// 佐证图片加载失败
		},
		// 获取请假扣分提示
		fetchScoreHint() {
			if (!this.form.startTime || !this.form.endTime || this.leaveDaysCalc <= 0) {
				this.scoreHint = null
				return
			}
			getLeaveScoreHint({
				startTime: this.form.startTime,
				endTime: this.form.endTime,
				leaveDays: this.leaveDaysCalc
			}).then(({ data }) => {
				if (data.code === 200 && data.data) {
					this.scoreHint = data.data
				} else {
					this.scoreHint = null
				}
			}).catch(() => {
				this.scoreHint = null
			})
		},
		async loadList(refresh = true) {
			if (refresh) {
				this.pageNum = 1
				this.list = []
			}
			this.loading = true
			try {
				const params = { pageNum: this.pageNum, pageSize: this.pageSize }
				if (this.filterStatus) params.approvalStatus = this.filterStatus
				const res = await getMyLeaves(params)
				const rows = res.data.rows || []
				const total = res.data.total || 0
				this.list = refresh ? rows : [...this.list, ...rows]
				this.hasMore = this.list.length < total
			} catch (e) {
				uni.showToast({ title: '加载失败', icon: 'none' })
			} finally {
				this.loading = false
			}
		},
		loadMore() {
			if (this.loading || !this.hasMore) return
			this.pageNum++
			this.loadList(false)
		},
		onReasonSelect(val) {
			this.form.reasonType = val
			// 如果已有补充说明则拼接，否则直接设为原因
			this.form.leaveReason = val
		},
		onStartDateChange(e) {
			this.form.startTime = this.buildTimeStr(e.detail.value, this.form.startHalf, false)
			this.ensureEndAfterStart()
			this.fetchScoreHint()
		},
		onStartHalfChange(half) {
			if (this.form.startHalf === half) return
			this.form.startHalf = half
			const date = this.dateOnly(this.form.startTime) || this.todayStr
			this.form.startTime = this.buildTimeStr(date, half, false)
			this.ensureEndAfterStart()
			this.fetchScoreHint()
		},
		onEndDateChange(e) {
			this.form.endTime = this.buildTimeStr(e.detail.value, this.form.endHalf, true)
			this.ensureEndAfterStart()
			this.fetchScoreHint()
		},
		onEndHalfChange(half) {
			if (this.form.endHalf === half) return
			this.form.endHalf = half
			let date = this.dateOnly(this.form.endTime) || this.dateOnly(this.form.startTime) || this.todayStr
			if (this.form.startTime) {
				const startIndex = this.halfIndex(this.dateOnly(this.form.startTime), this.form.startHalf)
				if (this.halfIndex(date, half) < startIndex) {
					// 同一天的上午结束早于下午开始，顺延到次日同一时段
					date = this.dateFromHalfIndex(this.halfIndex(date, half) + 2)
				}
			}
			this.form.endTime = this.buildTimeStr(date, half, true)
			this.fetchScoreHint()
		},
		// 快捷选择：以已选开始时间为起点，按半天粒度补齐结束时间
		applyQuickDuration(days) {
			if (!this.form.startTime) {
				const def = this.defaultStart()
				this.form.startHalf = def.half
				this.form.startTime = this.buildTimeStr(def.date, def.half, false)
			}
			const startIndex = this.halfIndex(this.dateOnly(this.form.startTime), this.form.startHalf)
			const endIndex = startIndex + Math.round(days * 2) - 1
			this.form.endHalf = endIndex % 2 === 0 ? 'am' : 'pm'
			this.form.endTime = this.buildTimeStr(this.dateFromHalfIndex(endIndex), this.form.endHalf, true)
			this.fetchScoreHint()
		},
		// 结束时间早于开始时间时，自动落到“同半天”，保证至少 0.5 天
		ensureEndAfterStart() {
			if (!this.form.startTime) return
			const startDate = this.dateOnly(this.form.startTime)
			if (!this.form.endTime) {
				this.form.endHalf = this.form.startHalf
				this.form.endTime = this.buildTimeStr(startDate, this.form.endHalf, true)
				return
			}
			const startIndex = this.halfIndex(startDate, this.form.startHalf)
			const endIndex = this.halfIndex(this.dateOnly(this.form.endTime), this.form.endHalf)
			if (endIndex < startIndex) {
				this.form.endHalf = this.form.startHalf
				this.form.endTime = this.buildTimeStr(startDate, this.form.endHalf, true)
				return
			}
			// 单次最多7天，修改开始日期后把超出的结束时间收回到上限
			const maxEndIndex = startIndex + 13
			if (endIndex > maxEndIndex) {
				this.form.endHalf = maxEndIndex % 2 === 0 ? 'am' : 'pm'
				this.form.endTime = this.buildTimeStr(this.dateFromHalfIndex(maxEndIndex), this.form.endHalf, true)
			}
		},
		defaultStart() {
			const now = new Date()
			const half = now.getHours() >= 18 ? 'am' : (now.getHours() >= 12 ? 'pm' : 'am')
			const d = new Date(now)
			if (now.getHours() >= 18) d.setDate(d.getDate() + 1)
			return { date: this.formatDateStr(d), half }
		},
		halfText(half) {
			return half === 'pm' ? '下午' : '上午'
		},
		dateOnly(val) {
			if (!val) return ''
			return String(val).replace('T', ' ').substring(0, 10)
		},
		buildTimeStr(dateStr, half, isEnd) {
			let time
			if (isEnd) {
				time = half === 'am' ? '12:00:00' : '18:00:00'
			} else {
				time = half === 'am' ? '08:00:00' : '14:00:00'
			}
			return `${dateStr} ${time}`
		},
		// 用日期序号*2 + 上下午表示半天序号，避免时区和夏令时影响
		halfIndex(dateStr, half) {
			const parts = String(dateStr).split('-').map(Number)
			const dayIndex = Math.floor(Date.UTC(parts[0], parts[1] - 1, parts[2]) / 86400000)
			return dayIndex * 2 + (half === 'pm' ? 1 : 0)
		},
		dateFromHalfIndex(index) {
			const d = new Date(Math.floor(index / 2) * 86400000)
			const y = d.getUTCFullYear()
			const m = String(d.getUTCMonth() + 1).padStart(2, '0')
			const day = String(d.getUTCDate()).padStart(2, '0')
			return `${y}-${m}-${day}`
		},
		onTransportChange(e) {
			const idx = e.detail.value
			if (this.transportTypes[idx]) {
				this.form.transportType = this.transportTypes[idx].value
				this.form.transportInfo = ''
			}
		},
		// 选择佐证图片
		chooseImage() {
			if (this.photoList.length >= 5) {
				return uni.showToast({ title: '最多上传5张', icon: 'none' })
			}
			uni.chooseImage({
				count: 5 - this.photoList.length,
				sizeType: ['compressed'],
				sourceType: ['album', 'camera'],
				success: (res) => {
					res.tempFilePaths.forEach(path => {
						this.photoList.push(path)
						this.uploadImage(path)
					})
				}
			})
		},
		// 上传图片到服务器
		uploadImage(filePath) {
			uni.uploadFile({
				url: config.baseURL + '/stumanage/attachment/upload/image',
				filePath: filePath,
				name: 'file',
				header: {
					'Authorization': 'Bearer ' + uni.getStorageSync('App-Token')
				},
				success: (res) => {
					let data
					try {
						data = JSON.parse(res.data)
					} catch (e) {
						this.removeUploadFail(filePath)
						uni.showToast({ title: '上传响应解析失败', icon: 'none' })
						return
					}
					if (data.code === 200) {
						// 后端上传接口直接返回扁平结构（url/fileName等），也可能在 data 字段中
						const fileData = data.data || data
						if (!fileData.url) {
							this.removeUploadFail(filePath)
							uni.showToast({ title: '上传响应缺少文件URL', icon: 'none' })
							return
						}
						this.uploadedFiles.push({
							filePath: fileData.url || '',
							fileName: fileData.fileName || '',
							fileSize: fileData.fileSize || 0,
							fileType: fileData.fileType || 'jpg',
							mediaType: fileData.mediaType || 'image'
						})
						uni.showToast({ title: '上传成功', icon: 'success' })
					} else {
						this.removeUploadFail(filePath)
						uni.showToast({ title: data.msg || '上传失败', icon: 'none' })
					}
				},
				fail: (err) => {
					this.removeUploadFail(filePath)
					uni.showToast({ title: '图片上传失败，请重试', icon: 'none' })
				}
			})
		},
		// 上传失败时移除对应图片
		removeUploadFail(filePath) {
			const idx = this.photoList.indexOf(filePath)
			if (idx > -1) {
				this.photoList.splice(idx, 1)
			}
		},
		// 移除已选图片
		removeImage(idx) {
			this.photoList.splice(idx, 1)
			this.uploadedFiles.splice(idx, 1)
		},
		// 预览图片
		previewImage(idx) {
			uni.previewImage({
				current: idx,
				urls: this.photoList
			})
		},
		async submitApply() {
			if (!this.form.leaveType) return uni.showToast({ title: '请选择请假类型', icon: 'none' })
			if (!this.form.startTime) return uni.showToast({ title: '请选择开始时间', icon: 'none' })
			if (!this.form.endTime) return uni.showToast({ title: '请选择结束时间', icon: 'none' })
			if (this.leaveDaysCalc <= 0) return uni.showToast({ title: '结束时间不能早于开始时间', icon: 'none' })
			if (this.leaveDaysCalc > 7) return uni.showToast({ title: '单次请假最多7天，请线下申请', icon: 'none' })
			if (!this.form.reasonType) {
				return uni.showToast({ title: '请选择请假原因', icon: 'none' })
			}
			if (!this.form.contactPhone || !/^1\d{10}$/.test(this.form.contactPhone.trim())) {
				return uni.showToast({ title: '请填写正确的11位手机号', icon: 'none' })
			}
			if (!this.form.transportType) {
				return uni.showToast({ title: '请选择离校方式', icon: 'none' })
			}
			if (this.photoList.length === 0) {
				return uni.showToast({ title: '请至少上传1张佐证材料', icon: 'none' })
			}
			// 等待所有图片上传完成
			if (this.uploadedFiles.length < this.photoList.length) {
				return uni.showToast({ title: '图片正在上传中，请稍候', icon: 'none' })
			}

			this.submitting = true
			try {
				// 如果联系电话与学生信息中的不同，才保存到历史电话
				const currentPhone = this.form.contactPhone.trim()
				if (this.originalPhone && currentPhone !== this.originalPhone) {
					try {
						await userInfoApi.updatePhone(currentPhone)
						this.originalPhone = currentPhone
					} catch (phoneErr) {
						// 保存历史电话失败，不阻断请假提交
					}
				}

				const formData = { ...this.form }
				delete formData.startHalf
				delete formData.endHalf
				await applyLeave({
					...formData,
					contactPhone: currentPhone,
					leaveDays: this.leaveDaysCalc,
					fileList: this.uploadedFiles
				})
				uni.showToast({ title: '申请已提交', icon: 'success' })
				// 重置表单
				this.form = {
					leaveType: 'personal',
					startTime: '',
					endTime: '',
					startHalf: 'am',
					endHalf: 'pm',
					leaveReason: '',
					reasonType: '',
					destination: '',
					contactPhone: this.originalPhone,
					transportType: '',
					transportInfo: ''
				}
				this.photoList = []
				this.uploadedFiles = []
				this.scoreHint = null
				// 切换到列表tab并刷新
				this.activeTab = 0
				this.loadList()
			} catch (e) {
				uni.showToast({ title: '提交失败', icon: 'none' })
			} finally {
				this.submitting = false
			}
		},
		leaveTypeText(val) {
			const map = { personal: '事假', sick: '病假', public: '公假', other: '其他' }
			return map[val] || val || '--'
		},
		transportText(type, info) {
			const map = { train: '火车', plane: '飞机', bus: '汽车', other: '其他' }
			const name = map[type] || type
			return info ? `${name}(${info})` : name
		},
		statusText(val) {
			const map = { pending: '待审批', approved: '已批准', rejected: '已拒绝', forward: '转上级' }
			return map[val] || val || '--'
		},
		formatDate(val) {
			if (!val) return '--'
			return String(val).substring(0, 10)
		},
		formatLeaveRange(start, end) {
			const format = (val) => {
				if (!val) return '--'
				const text = String(val).replace('T', ' ')
				return text.length >= 16 ? text.substring(5, 16) : text.substring(0, 10)
			}
			return `${format(start)} 至 ${format(end)}`
		},
		formatDays(days) {
			const value = Number(days) || 0
			return value % 1 === 0 ? String(value) : value.toFixed(1)
		},
		// 审批流程文本
		flowText(item) {
			const status = item.approvalStatus
			const level = item.approvalLevel
			const steps = ['提交申请']
			if (level === 'secretary') {
				steps.push('辅导员核验')
				steps.push('书记审批')
			} else {
				steps.push('辅导员审批')
			}
			const prefix = steps.join(' → ')
			if (status === 'approved') return prefix + '（已完成）'
			if (status === 'rejected') return prefix + '（已拒绝）'
			if (status === 'forward') return prefix + '（转上级审批中）'
			return prefix + '（进行中）'
		},
		// 下一步审批人文本
		nextApproverText(item) {
			if (item.approvalStatus === 'approved' || item.approvalStatus === 'rejected') {
				return '—'
			}
			const name = item.counselorName || '辅导员'
			const phone = item.counselorPhone || ''
			const counselor = `${name}${phone ? '（' + phone + '）' : ''}`
			if (item.approvalStatus === 'forward' || item.approvalLevel === 'secretary') {
				return `${counselor} → 书记`
			}
			return counselor
		},
		// 预览列表项佐证图片
		previewAttachment(idx, list) {
			const origin = config.baseURL.replace(/\/prod-api$/, '')
			const urls = (list || []).map(a => {
				if (!a.filePath) return ''
				return a.filePath.startsWith('http') ? a.filePath : origin + '/profile' + a.filePath
			}).filter(Boolean)
			if (!urls.length) return
			uni.previewImage({
				current: idx,
				urls: urls
			})
		},
		// Date对象格式化为 yyyy-MM-dd
		formatDateStr(d) {
			const y = d.getFullYear()
			const m = String(d.getMonth() + 1).padStart(2, '0')
			const day = String(d.getDate()).padStart(2, '0')
			return `${y}-${m}-${day}`
		},
	}
}
</script>

<style scoped>
.page-wrap { background: #f4f6f8; min-height: 100vh; }
.tab-bar { display: flex; background: #fff; border-bottom: 1rpx solid #eee; }
.tab-item { flex: 1; text-align: center; padding: 26rpx 0; font-size: 28rpx; color: #666; }
.tab-active { color: #4a7cf6; font-weight: bold; border-bottom: 4rpx solid #4a7cf6; }
.filter-bar { white-space: nowrap; padding: 16rpx 24rpx; background: #fff; border-bottom: 1rpx solid #f0f0f0; }
.filter-chip { display: inline-block; padding: 10rpx 28rpx; border-radius: 32rpx; font-size: 24rpx; color: #666; background: #f0f0f0; margin-right: 16rpx; }
.chip-active { background: #4a7cf6; color: #fff; }
.leave-list { padding: 16rpx; }
.leave-item { background: #fff; border-radius: 16rpx; margin-bottom: 16rpx; overflow: hidden; }
.item-header { display: flex; justify-content: space-between; align-items: center; padding: 20rpx 24rpx 12rpx; border-bottom: 1rpx solid #f5f5f5; }
.leave-type { font-size: 30rpx; font-weight: bold; color: #333; }
.header-left { display: flex; align-items: baseline; flex: 1; overflow: hidden; }
.transport-info { font-size: 22rpx; color: #888; margin-left: 10rpx; flex-shrink: 0; }
.status-tag { font-size: 22rpx; padding: 6rpx 18rpx; border-radius: 24rpx; }
.status-pending { background: #fff7e6; color: #fa8c16; }
.status-approved { background: #f0fff4; color: #52c41a; }
.status-rejected { background: #fff1f0; color: #f5222d; }
.status-forward { background: #e6f7ff; color: #1890ff; }
.item-body { padding: 16rpx 24rpx; }
.info-row { display: flex; padding: 8rpx 0; }
.info-label { color: #999; font-size: 24rpx; width: 150rpx; flex-shrink: 0; }
.info-val { color: #333; font-size: 24rpx; flex: 1; }
.reason-text { word-break: break-all; }
.compact-row { align-items: center; }
.compact-item { margin-right: 40rpx; display: inline-flex; align-items: baseline; }
.compact-item .info-label { width: auto; margin-right: 8rpx; }
.compact-item .info-val { flex: none; }
.flow-text { color: #4a7cf6; word-break: break-all; }
.next-approver { color: #fa8c16; word-break: break-all; }
.score-points { color: #f5222d; font-weight: bold; }
.attach-list { display: flex; flex-wrap: wrap; gap: 12rpx; margin-top: 8rpx; flex: 1; }
.attach-img { width: 120rpx; height: 120rpx; border-radius: 10rpx; background: #f5f5f5; }
.empty-tip { text-align: center; padding: 80rpx 0; color: #999; font-size: 28rpx; }
.load-more { text-align: center; padding: 24rpx; color: #4a7cf6; font-size: 26rpx; }
.apply-wrap { padding: 16rpx; }
.form-card { background: #fff; border-radius: 16rpx; padding: 20rpx 24rpx; }
.form-title { font-size: 30rpx; font-weight: bold; color: #222; margin-bottom: 16rpx; }
.form-item { margin-bottom: 16rpx; }
.form-label { font-size: 26rpx; color: #333; display: block; margin-bottom: 8rpx; }
.required { color: #f5222d; }
.radio-group { display: flex; flex-wrap: wrap; gap: 12rpx; }
.radio-item { padding: 10rpx 24rpx; border-radius: 28rpx; border: 2rpx solid #ddd; font-size: 26rpx; color: #555; }
.radio-active { border-color: #4a7cf6; color: #4a7cf6; background: #f0f4ff; }
.quick-duration { display: flex; flex-wrap: wrap; gap: 12rpx; margin-bottom: 16rpx; }
.quick-chip { padding: 10rpx 26rpx; border-radius: 28rpx; border: 2rpx solid #d9e2ff; background: #f7f9ff; color: #4a7cf6; font-size: 24rpx; }
.quick-active { background: #4a7cf6; border-color: #4a7cf6; color: #fff; }
.time-block { margin-bottom: 12rpx; }
.time-block-label { display: block; font-size: 24rpx; color: #888; margin-bottom: 6rpx; }
.time-row { display: flex; align-items: stretch; }
.time-date-picker { flex: 1; min-width: 0; }
.half-toggle { display: flex; margin-left: 12rpx; border: 2rpx solid #e8e8e8; border-radius: 12rpx; overflow: hidden; flex-shrink: 0; }
.half-item { padding: 16rpx 22rpx; font-size: 24rpx; color: #666; background: #fff; }
.half-active { background: #4a7cf6; color: #fff; }
.picker-display { display: flex; justify-content: space-between; align-items: center; border: 2rpx solid #e8e8e8; border-radius: 12rpx; padding: 16rpx 20rpx; font-size: 26rpx; color: #333; }
.arrow { color: #bbb; font-size: 28rpx; }
.days-text { font-size: 28rpx; color: #4a7cf6; font-weight: bold; }
.days-warn { font-size: 22rpx; color: #f5222d; margin-left: 12rpx; }
.textarea { width: 100%; border: 2rpx solid #e8e8e8; border-radius: 12rpx; padding: 16rpx 20rpx; font-size: 26rpx; color: #333; min-height: 100rpx; box-sizing: border-box; }
.char-count { font-size: 22rpx; color: #bbb; text-align: right; display: block; margin-top: 4rpx; }
.input { border: 2rpx solid #e8e8e8; border-radius: 12rpx; padding: 16rpx 20rpx; font-size: 26rpx; color: #333; }
.sub-tip { font-size: 22rpx; color: #999; margin-top: 6rpx; display: block; }
.upload-box { border: 2rpx dashed #c0c4cc; border-radius: 12rpx; padding: 20rpx; display: flex; align-items: center; justify-content: center; background: #f8f9fa; flex-wrap: wrap; }
.upload-icon { font-size: 36rpx; color: #999; margin-right: 8rpx; }
.upload-text { font-size: 24rpx; color: #666; }
.upload-limit { font-size: 22rpx; color: #999; margin-left: 12rpx; }
.photo-list { display: flex; flex-wrap: wrap; gap: 12rpx; margin-top: 12rpx; }
.photo-item { position: relative; width: 140rpx; height: 140rpx; border-radius: 10rpx; overflow: hidden; }
.photo-img { width: 100%; height: 100%; }
.photo-remove { position: absolute; top: 2rpx; right: 2rpx; width: 32rpx; height: 32rpx; line-height: 30rpx; text-align: center; background: rgba(0,0,0,0.5); color: #fff; border-radius: 50%; font-size: 26rpx; }
.tips-box { background: #fffbe6; border-radius: 10rpx; padding: 14rpx 18rpx; margin-bottom: 20rpx; }
.tips-title { font-size: 22rpx; font-weight: bold; color: #fa8c16; display: block; margin-bottom: 6rpx; }
.tips-text { font-size: 22rpx; color: #a87810; display: block; line-height: 1.7; }
</style>
