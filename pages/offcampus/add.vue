<template>
	<view class="page-wrap">
		<!-- 学生信息（自动填充） -->
		<view class="form-card">
			<view class="card-title">我的信息</view>
			<view class="form-item">
				<text class="form-label">学号</text>
				<text class="form-value">{{ form.xh }}</text>
			</view>
			<view class="form-item">
				<text class="form-label">姓名</text>
				<text class="form-value">{{ form.studentName }}</text>
			</view>
			<view class="form-item">
				<text class="form-label">班级</text>
				<text class="form-value">{{ form.className }}</text>
			</view>
		</view>

		<!-- 外宿信息 -->
		<view class="form-card">
			<view class="card-title">外宿信息</view>
			<view class="form-item">
				<text class="form-label">外宿类型 <text class="required">*</text></text>
				<picker :range="housingTypeOptions" range-key="label" @change="onHousingTypeChange">
					<view class="form-picker">
						<text :class="{ placeholder: !form.housingType }">{{ form.housingType ? housingTypeText(form.housingType) : '请选择外宿类型' }}</text>
						<text class="picker-arrow">▼</text>
					</view>
				</picker>
			</view>
			<view class="form-item">
				<text class="form-label">学年</text>
				<text class="form-value">{{ form.academicYear }}</text>
			</view>
			<view class="form-item">
				<text class="form-label">外宿期限 <text class="required">*</text></text>
				<view class="period-chips">
					<text v-for="p in periodOptions" :key="p.code" class="period-chip" :class="{ active: periodPreset === p.code }" @click="pickPreset(p.code)">{{ p.short }}</text>
					<text class="period-chip" :class="{ active: periodPreset === 'custom' }" @click="periodPreset = 'custom'">自定义</text>
				</view>
				<view class="period-range">
					<picker class="period-cell" mode="date" :value="form.startDate" @change="onStartDateChange">
						<view class="form-picker"><text :class="{ placeholder: !form.startDate }">{{ form.startDate || '开始日期' }}</text></view>
					</picker>
					<text class="period-sep">至</text>
					<picker class="period-cell" mode="date" :value="form.endDate" @change="onEndDateChange">
						<view class="form-picker"><text :class="{ placeholder: !form.endDate }">{{ form.endDate || '结束日期' }}</text></view>
					</picker>
				</view>
				<text class="period-tip">外宿一般覆盖整学年；学期中途开始可自开学日起、学年末止</text>
			</view>
			<view class="form-item">
				<text class="form-label">外宿地址 <text class="required">*</text></text>
				<input class="form-input" v-model="form.address" placeholder="请输入详细地址" />
			</view>
			<view class="form-item">
				<text class="form-label">外宿理由 <text class="required">*</text></text>
				<textarea class="form-textarea" v-model="form.applyReason" placeholder="请详细说明外宿理由" maxlength="500" />
			</view>
		</view>

		<!-- 佐证材料 -->
		<view class="form-card" v-if="form.housingType">
			<view class="card-title">佐证材料</view>
			<!-- 自有住房 -->
			<view v-if="form.housingType === 'own_house'">
				<view class="form-item">
					<text class="form-label">房产证照片 <text class="required">*</text></text>
					<view class="upload-box" @click="chooseImage('propertyCert')">
						<image v-if="form.propertyCert" :src="form.propertyCert" class="upload-preview" mode="aspectFill" />
						<view v-else class="upload-placeholder"><text class="upload-icon">+</text><text>拍照上传</text></view>
					</view>
				</view>
			</view>
			<!-- 自有住房与投靠亲属都要关系证明 -->
			<view v-if="form.housingType === 'own_house' || form.housingType === 'relative'">
				<view class="form-item">
					<text class="form-label">{{ form.housingType === 'relative' ? '亲属关系证明' : '关系证明' }} <text class="required">*</text></text>
					<view class="upload-box" @click="chooseImage('relationCert')">
						<image v-if="form.relationCert" :src="form.relationCert" class="upload-preview" mode="aspectFill" />
						<view v-else class="upload-placeholder"><text class="upload-icon">+</text><text>拍照上传</text></view>
					</view>
				</view>
			</view>
			<!-- 租房 -->
			<view v-if="form.housingType === 'rent_house'">
				<view class="form-item">
					<text class="form-label">租房合同 <text class="required">*</text></text>
					<view class="upload-box" @click="chooseImage('rentContract')">
						<image v-if="form.rentContract" :src="form.rentContract" class="upload-preview" mode="aspectFill" />
						<view v-else class="upload-placeholder"><text class="upload-icon">+</text><text>拍照上传</text></view>
					</view>
				</view>
			</view>
			<!-- 通用：理由佐证照片 -->
			<view class="form-item">
				<text class="form-label">理由佐证照片（3-5张）<text class="required">*</text></text>
				<view class="photo-grid">
					<view class="photo-item" v-for="(p, idx) in reasonPhotos" :key="idx">
						<image :src="p" class="photo-img" mode="aspectFill" />
						<view class="photo-remove" @click="reasonPhotos.splice(idx, 1)">×</view>
					</view>
					<view class="photo-item photo-add" v-if="reasonPhotos.length < 5" @click="chooseMultiImage('reason')">
						<text class="upload-icon">+</text>
					</view>
				</view>
			</view>
			<!-- 通用：住宿环境照片 -->
			<view class="form-item">
				<text class="form-label">住宿环境照片（3-5张）<text class="required">*</text></text>
				<view class="photo-grid">
					<view class="photo-item" v-for="(p, idx) in housingPhotos" :key="idx">
						<image :src="p" class="photo-img" mode="aspectFill" />
						<view class="photo-remove" @click="housingPhotos.splice(idx, 1)">×</view>
					</view>
					<view class="photo-item photo-add" v-if="housingPhotos.length < 5" @click="chooseMultiImage('housing')">
						<text class="upload-icon">+</text>
					</view>
				</view>
			</view>
		</view>

		<!-- 交通信息 -->
		<view class="form-card" v-if="form.housingType">
			<view class="card-title">交通信息</view>
			<view class="form-item">
				<text class="form-label">交通工具 <text class="required">*</text></text>
				<picker :range="transportOptions" range-key="label" @change="onTransportChange">
					<view class="form-picker">
						<text :class="{ placeholder: !form.transportType }">{{ form.transportType ? transportText(form.transportType) : '请选择交通工具' }}</text>
						<text class="picker-arrow">▼</text>
					</view>
				</picker>
			</view>
			<view class="form-item">
				<text class="form-label">交通证明</text>
				<view class="upload-box" @click="chooseImage('transportProof')">
					<image v-if="form.transportProof" :src="form.transportProof" class="upload-preview" mode="aspectFill" />
					<view v-else class="upload-placeholder"><text class="upload-icon">+</text><text>拍照上传</text></view>
				</view>
			</view>
		</view>

		<!-- 提交按钮 -->
		<view class="submit-area">
			<view class="submit-btn" @click="submit">
				<text>提交申请</text>
			</view>
		</view>
	</view>
</template>

<script>
	import { submitOffcampus, getOffcampusPeriods } from '@/api/affair/offcampus'
	import userInfoApi from '@/api/student/userInfo.js'
	import config from '@/config'
	import requireLogin from '@/mixins/requireLogin.js'

	export default {
		mixins: [requireLogin],
		data() {
			return {
				form: {
					xh: '', studentName: '', bjdm: '', className: '', xydm: '',
					academicYear: '', startDate: '', endDate: '',
					housingType: '', applyReason: '', address: '',
					propertyCert: '', relationCert: '', rentContract: '',
					transportType: '', transportProof: ''
				},
				// 外宿期限快捷项，取自校历
				periodOptions: [],
				periodPreset: 'full_year',
				reasonPhotos: [],
				housingPhotos: [],
				housingTypeOptions: [
					{ label: '自有住房', value: 'own_house' },
					{ label: '租房', value: 'rent_house' },
					{ label: '投靠亲属', value: 'relative' },
					{ label: '其他', value: 'other' }
				],
				transportOptions: [
					{ label: '步行', value: 'walk' },
					{ label: '公交车', value: 'bus' },
					{ label: '地铁', value: 'metro' },
					{ label: '电动车', value: 'electric_bike' },
					{ label: '摩托车', value: 'motorcycle' },
					{ label: '汽车', value: 'car' },
					{ label: '其他', value: 'other' }
				]
			}
		},
		onLoad() {
			this.calcAcademicYear()
			this.loadPeriods()
			this.loadStudentInfo()
		},
		methods: {
			/** 学年按 9 月切分：秋季学期起为 newYear-(newYear+1) */
			calcAcademicYear() {
				const now = new Date()
				const year = now.getFullYear()
				this.form.academicYear = now.getMonth() + 1 >= 9 ? year + '-' + (year + 1) : (year - 1) + '-' + year
			},
			/** 期限候选取自校历：整学年 + 该学年各学期 */
			loadPeriods() {
				return getOffcampusPeriods(this.form.academicYear).then(res => {
					const body = res.data || {}
					this.periodOptions = (body.data || []).map(p => ({
						code: p.code,
						short: p.code === 'full_year' ? '整学年' : String(p.label || '').replace(/^\d{4}-\d{4}学年/, ''),
						startDate: p.startDate,
						endDate: p.endDate
					}))
					if (this.periodPreset !== 'custom') this.pickPreset(this.periodPreset)
				}).catch(() => {
					this.periodOptions = []
				})
			},
			pickPreset(code) {
				const p = this.periodOptions.find(item => item.code === code)
				if (!p) return
				this.periodPreset = code
				this.form.startDate = p.startDate
				this.form.endDate = p.endDate
			},
			onStartDateChange(e) {
				this.form.startDate = e.detail.value
				this.periodPreset = 'custom'
			},
			onEndDateChange(e) {
				this.form.endDate = e.detail.value
				this.periodPreset = 'custom'
			},
			async loadStudentInfo() {
				try {
					const { data } = await userInfoApi.getMyStudentInfo()
					if (data.code === 200 && data.data) {
						const stu = data.data
						this.form.xh = stu.xh || ''
						this.form.studentName = stu.studentName || ''
						this.form.bjdm = stu.bjdm || ''
						this.form.className = stu.className || ''
						this.form.xydm = stu.xydm || ''
					}
				} catch (e) {
					uni.showToast({ title: '加载学生信息失败', icon: 'none' })
				}
			},
			onHousingTypeChange(e) {
				this.form.housingType = this.housingTypeOptions[e.detail.value].value
			},
			onTransportChange(e) {
				this.form.transportType = this.transportOptions[e.detail.value].value
			},
			housingTypeText(val) {
				const hit = this.housingTypeOptions.find(o => o.value === val)
				return hit ? hit.label : (val || '-')
			},
			transportText(val) {
				const m = { walk: '步行', bus: '公交车', metro: '地铁', electric_bike: '电动车', motorcycle: '摩托车', car: '汽车', other: '其他' }
				return m[val] || val
			},
			chooseImage(field) {
				uni.chooseImage({
					count: 1,
					sizeType: ['compressed'],
					sourceType: ['album', 'camera'],
					success: (res) => {
						this.uploadFile(res.tempFilePaths[0]).then(url => {
							this.form[field] = url
						}).catch(() => {
							uni.showToast({ title: '上传失败', icon: 'none' })
						})
					}
				})
			},
			chooseMultiImage(type) {
				const list = type === 'reason' ? this.reasonPhotos : this.housingPhotos
				if (list.length >= 5) return uni.showToast({ title: '最多5张', icon: 'none' })
				uni.chooseImage({
					count: 1,
					sizeType: ['compressed'],
					sourceType: ['album', 'camera'],
					success: (res) => {
						this.uploadFile(res.tempFilePaths[0]).then(url => {
							list.push(url)
						}).catch(() => {
							uni.showToast({ title: '上传失败', icon: 'none' })
						})
					}
				})
			},
			uploadFile(filePath) {
				return new Promise((resolve, reject) => {
					uni.uploadFile({
						url: config.baseURL + '/stumanage/attachment/upload/image',
						filePath: filePath,
						name: 'file',
						header: {
							'Authorization': 'Bearer ' + uni.getStorageSync('App-Token')
						},
						success: (res) => {
							try {
								const data = JSON.parse(res.data)
								if (data.code === 200) {
									const fileData = data.data || data
									resolve(fileData.url || '')
								} else {
									reject(new Error('上传失败'))
								}
							} catch (e) {
								reject(e)
							}
						},
						fail: reject
					})
				})
			},
			async submit() {
				if (!this.form.housingType) return uni.showToast({ title: '请选择外宿类型', icon: 'none' })
				if (!this.form.startDate || !this.form.endDate) return uni.showToast({ title: '请选择外宿期限', icon: 'none' })
				if (this.form.startDate > this.form.endDate) return uni.showToast({ title: '结束日期不能早于开始日期', icon: 'none' })
				if (!this.form.address) return uni.showToast({ title: '请输入外宿地址', icon: 'none' })
				if (!this.form.applyReason) return uni.showToast({ title: '请输入外宿理由', icon: 'none' })
				if (this.form.housingType === 'own_house' && !this.form.propertyCert) return uni.showToast({ title: '请上传房产证', icon: 'none' })
				if (this.form.housingType === 'own_house' && !this.form.relationCert) return uni.showToast({ title: '请上传关系证明', icon: 'none' })
				if (this.form.housingType === 'rent_house' && !this.form.rentContract) return uni.showToast({ title: '请上传租房合同', icon: 'none' })
				if (this.reasonPhotos.length < 3) return uni.showToast({ title: '理由佐证至少3张', icon: 'none' })
				if (this.housingPhotos.length < 3) return uni.showToast({ title: '环境照片至少3张', icon: 'none' })
				if (!this.form.transportType) return uni.showToast({ title: '请选择交通工具', icon: 'none' })

				const data = {
					...this.form,
					reasonPhotos: JSON.stringify(this.reasonPhotos),
					housingPhotos: JSON.stringify(this.housingPhotos)
				}

				try {
					const res = await submitOffcampus(data)
					if (res.data && res.data.code === 200) {
						uni.showToast({ title: '提交成功', icon: 'success' })
						setTimeout(() => uni.navigateBack(), 1500)
					}
				} catch (e) {
					uni.showToast({ title: '提交失败', icon: 'none' })
				}
			}
		}
	}
</script>

<style scoped lang="scss">
	.page-wrap {
		min-height: 100vh;
		background: #f5f6f8;
		padding-bottom: 120rpx;
	}
	.form-card {
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
	.form-item {
		margin-bottom: 24rpx;
	}
	.form-label {
		font-size: 26rpx;
		color: #666;
		margin-bottom: 12rpx;
		display: block;
	}
	.form-value {
		font-size: 28rpx;
		color: #333;
	}
	.required { color: #f56c6c; }
	.form-input, .form-textarea {
		background: #f5f5f5;
		padding: 16rpx 20rpx;
		border-radius: 8rpx;
		font-size: 28rpx;
		width: 100%;
	}
	.form-textarea { height: 160rpx; }
	.form-picker {
		background: #f5f5f5;
		padding: 16rpx 20rpx;
		border-radius: 8rpx;
		font-size: 28rpx;
		display: flex;
		justify-content: space-between;
	}
	.placeholder { color: #999; }
	.picker-arrow { font-size: 24rpx; color: #999; }
	.period-chips { display: flex; flex-wrap: wrap; gap: 12rpx; margin-bottom: 14rpx; }
	.period-chip {
		padding: 8rpx 22rpx;
		border-radius: 24rpx;
		background: #f0f2f5;
		color: #666;
		font-size: 24rpx;
		border: 2rpx solid transparent;
	}
	.period-chip.active { background: #eef1ff; color: #667eea; border-color: #667eea; }
	.period-range { display: flex; align-items: center; }
	.period-cell { flex: 1; }
	.period-sep { padding: 0 14rpx; font-size: 24rpx; color: #999; }
	.period-tip { display: block; margin-top: 10rpx; font-size: 22rpx; color: #999; line-height: 32rpx; }
	.upload-box {
		width: 200rpx;
		height: 200rpx;
		border-radius: 8rpx;
		overflow: hidden;
	}
	.upload-placeholder {
		width: 100%;
		height: 100%;
		background: #f5f5f5;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		border: 2rpx dashed #ddd;
		color: #999;
		font-size: 24rpx;
	}
	.upload-icon { font-size: 48rpx; color: #999; }
	.upload-preview { width: 100%; height: 100%; }
	.photo-grid {
		display: flex;
		flex-wrap: wrap;
		gap: 16rpx;
	}
	.photo-item {
		width: 160rpx;
		height: 160rpx;
		position: relative;
	}
	.photo-img {
		width: 100%;
		height: 100%;
		border-radius: 8rpx;
	}
	.photo-remove {
		position: absolute;
		top: -10rpx;
		right: -10rpx;
		width: 36rpx;
		height: 36rpx;
		background: #f56c6c;
		color: #fff;
		border-radius: 50%;
		text-align: center;
		line-height: 36rpx;
		font-size: 24rpx;
	}
	.photo-add {
		background: #f5f5f5;
		border: 2rpx dashed #ddd;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 8rpx;
	}
	.submit-area {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		padding: 20rpx 40rpx;
		background: #fff;
		box-shadow: 0 -2rpx 10rpx rgba(0,0,0,0.05);
	}
	.submit-btn {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		padding: 24rpx 0;
		border-radius: 40rpx;
		text-align: center;
		color: #fff;
		font-size: 30rpx;
		font-weight: 500;
	}
</style>
