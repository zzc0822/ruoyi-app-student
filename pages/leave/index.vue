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
						<text class="leave-type">{{ leaveTypeText(item.leaveType) }}</text>
						<view :class="['status-tag', 'status-' + item.approvalStatus]">
							{{ statusText(item.approvalStatus) }}
						</view>
					</view>
					<view class="item-body">
						<view class="info-row">
							<text class="info-label">假期时间</text>
							<text class="info-val">{{ formatDate(item.startTime) }} 至 {{ formatDate(item.endTime) }}</text>
						</view>
						<view class="info-row">
							<text class="info-label">请假天数</text>
							<text class="info-val">{{ item.leaveDays }} 天</text>
						</view>
						<view class="info-row">
							<text class="info-label">请假原因</text>
							<text class="info-val reason-text">{{ item.leaveReason || '--' }}</text>
						</view>
						<view class="info-row" v-if="item.approvalRemark">
							<text class="info-label">审批意见</text>
							<text class="info-val">{{ item.approvalRemark }}</text>
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

				<!-- 开始日期 -->
				<view class="form-item">
					<text class="form-label">开始日期 <text class="required">*</text></text>
					<picker mode="date" :value="form.startTime" :start="todayStr" :end="startDateMaxStr" @change="onStartChange">
						<view class="picker-display">
							<text>{{ form.startTime || '请选择开始日期' }}</text>
							<text class="arrow">›</text>
						</view>
					</picker>
					<text class="sub-tip">最多可提前7天申请</text>
				</view>

				<!-- 结束日期 -->
				<view class="form-item">
					<text class="form-label">结束日期 <text class="required">*</text></text>
					<picker mode="date" :value="form.endTime" :start="form.startTime || todayStr" :end="endDateMaxStr" @change="onEndChange">
						<view class="picker-display">
							<text>{{ form.endTime || '请选择结束日期' }}</text>
							<text class="arrow">›</text>
						</view>
					</picker>
					<text class="sub-tip">单次请假最多7天，超出请线下找辅导员申请</text>
				</view>

				<!-- 请假天数（自动计算） -->
				<view class="form-item" v-if="form.startTime && form.endTime">
					<text class="form-label">请假天数</text>
					<text class="days-text">{{ leaveDaysCalc }} 天</text>
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
					<input class="input" v-model="form.destination" placeholder="请填写去往地点" />
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
					<text class="tips-text" v-if="scoreHint">· 本次属于{{ scoreHint.sceneName }}，预计{{ scoreHint.points >= 0 ? '加' : '扣' }}{{ Math.abs(scoreHint.points) }}分二课积分</text>
					<text class="tips-text" v-else>· 请选择起止日期后查看积分变化提示</text>
					<text class="tips-text">· 请如实填写信息，祝假期愉快</text>
				</view>

				<u-button type="primary" :loading="submitting" @click="submitApply">提交申请</u-button>
			</view>
		</view>
	</view>
</template>

<script>
import { getMyLeaves, applyLeave, getLeaveScoreHint } from '@/api/leave.js'
import userInfoApi from '@/api/userInfo.js'
import config from '@/config'
import { isLogin } from '@/utils/auth'

export default {
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
				leaveReason: '',
				reasonType: '',
				destination: '',
				contactPhone: '',
				transportType: '',
				transportInfo: '',
			},
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
		// 结束日期最大值：开始日期+7天
		endDateMaxStr() {
			if (this.form.startTime) {
				const d = new Date(this.form.startTime)
				d.setDate(d.getDate() + 6) // +6因为包含开始当天共7天
				return this.formatDateStr(d)
			}
			// 未选开始日期时默认限制为今天+14天（开始7+结束7）
			const d = new Date()
			d.setDate(d.getDate() + 14)
			return this.formatDateStr(d)
		},
		leaveDaysCalc() {
			if (!this.form.startTime || !this.form.endTime) return 0
			const start = new Date(this.form.startTime)
			const end = new Date(this.form.endTime)
			const diff = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1
			return diff > 0 ? diff : 0
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
				console.error('加载学生信息失败', e)
			}
		},
		// 静默登录成功后加载学生信息
		onSilentLoginForLeave() {
			if (!this.originalPhone) {
				this.loadMyStudentInfo()
			}
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
		onStartChange(e) {
			this.form.startTime = e.detail.value
			// 如果结束日期已超出新范围（开始日期+7天），则清空结束日期
			if (this.form.endTime) {
				const start = new Date(this.form.startTime)
				const end = new Date(this.form.endTime)
				const maxEnd = new Date(start)
				maxEnd.setDate(maxEnd.getDate() + 6)
				if (end > maxEnd || end < start) {
					this.form.endTime = ''
				}
			}
			this.fetchScoreHint()
		},
		onEndChange(e) {
			this.form.endTime = e.detail.value
			this.fetchScoreHint()
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
					if (data.code === 200 && data.data) {
						const fileData = data.data
						this.uploadedFiles.push({
							filePath: fileData.url || '',
							fileName: fileData.fileName || '',
							fileSize: fileData.fileSize || 0,
							fileType: fileData.fileType || 'jpg',
							mediaType: fileData.mediaType || 'image'
						})
					} else {
						this.removeUploadFail(filePath)
						uni.showToast({ title: data.msg || '上传失败', icon: 'none' })
					}
				},
				fail: (err) => {
					this.removeUploadFail(filePath)
					console.error('上传失败', err)
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
			if (!this.form.startTime) return uni.showToast({ title: '请选择开始日期', icon: 'none' })
			if (!this.form.endTime) return uni.showToast({ title: '请选择结束日期', icon: 'none' })
			if (this.leaveDaysCalc <= 0) return uni.showToast({ title: '结束日期不能早于开始日期', icon: 'none' })
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
						console.warn('保存历史电话失败', phoneErr)
						// 不阻断请假提交
					}
				}

				await applyLeave({
					...this.form,
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
		statusText(val) {
			const map = { pending: '待审批', approved: '已批准', rejected: '已拒绝', forward: '转上级' }
			return map[val] || val || '--'
		},
		formatDate(val) {
			if (!val) return '--'
			return String(val).substring(0, 10)
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
.picker-display { display: flex; justify-content: space-between; align-items: center; border: 2rpx solid #e8e8e8; border-radius: 12rpx; padding: 16rpx 20rpx; font-size: 26rpx; color: #333; }
.arrow { color: #bbb; font-size: 28rpx; }
.days-text { font-size: 28rpx; color: #4a7cf6; font-weight: bold; }
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
