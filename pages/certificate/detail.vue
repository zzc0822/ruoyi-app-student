<template>
	<view class="page-container" v-if="cert">
		<!-- 证书类型卡片 -->
		<view :class="['type-card', 'type-bg-' + cert.certType]">
			<text class="type-badge">{{ formatType(cert.certType) }}</text>
			<text class="type-name">{{ cert.certName }}</text>
		</view>

		<!-- 证书信息 -->
		<view class="card">
			<view class="card-title">证书信息</view>
			<view class="info-row">
				<text class="info-label">学号</text>
				<text class="info-value">{{ cert.xh }}</text>
			</view>
			<view class="info-row" v-if="cert.studentName">
				<text class="info-label">姓名</text>
				<text class="info-value">{{ cert.studentName }}</text>
			</view>
			<view class="info-row" v-if="cert.collegeName">
				<text class="info-label">学院</text>
				<text class="info-value">{{ cert.collegeName }}</text>
			</view>
			<view class="info-row">
				<text class="info-label">证书类型</text>
				<text class="info-value">{{ formatType(cert.certType) }}</text>
			</view>
			<view class="info-row">
				<text class="info-label">证书名称</text>
				<text class="info-value">{{ cert.certName }}</text>
			</view>
			<view class="info-row">
				<text class="info-label">生成时间</text>
				<text class="info-value">{{ cert.generateTime }}</text>
			</view>
			<view class="info-row">
				<text class="info-label">证书状态</text>
				<text :class="['info-value', cert.pdfPath ? 'text-green' : 'text-gray']">
					{{ cert.pdfPath ? '已生成' : '生成中' }}
				</text>
			</view>
		</view>

		<!-- 业务信息 -->
		<view class="card" v-if="parsedBizInfo">
			<view class="card-title">业务信息</view>
			<view class="info-row" v-for="(val, key) in parsedBizInfo" :key="key">
				<text class="info-label">{{ key }}</text>
				<text class="info-value">{{ val }}</text>
			</view>
		</view>

		<!-- PDF预览/下载 -->
		<view class="card" v-if="cert.pdfPath">
			<view class="card-title">证书文件</view>
			<view class="pdf-section">
				<view class="pdf-preview-btn" @click="previewPdf">
					<text class="pdf-icon">📄</text>
					<text class="pdf-text">预览证书PDF</text>
					<text class="pdf-arrow">▶</text>
				</view>
				<view class="pdf-download-btn" @click="downloadPdf">
					<text>下载证书</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	import { getCertificateDetail } from '@/api/affair/certificate'
	import config from '@/config'
	import requireLogin from '@/mixins/requireLogin.js'

	const TYPE_MAP = { activity: '活动证书', volunteer: '志愿证明', award: '荣誉证书' }

	export default {
		mixins: [requireLogin],
		data() {
			return {
				certId: null,
				cert: null
			}
		},
		computed: {
			parsedBizInfo() {
				if (!this.cert || !this.cert.bizInfo) return null
				try {
					return JSON.parse(this.cert.bizInfo)
				} catch (e) {
					return null
				}
			}
		},
		onLoad(options) {
			this.certId = Number(options.id)
			this.loadDetail()
		},
		methods: {
			loadDetail() {
				getCertificateDetail(this.certId).then(res => {
					if (res.data && res.data.code === 200) {
						this.cert = res.data.data
					}
				}).catch(() => {
					uni.showToast({ title: '加载失败', icon: 'none' })
				})
			},
			formatType(val) {
				return TYPE_MAP[val] || val
			},
			previewPdf() {
				if (!this.cert.pdfPath) return
				const url = this.getPdfUrl()
				// #ifdef MP-WEIXIN
				this.downloadAndOpen(url)
				// #endif
				// #ifdef H5
				window.open(url)
				// #endif
			},
			downloadPdf() {
				if (!this.cert.pdfPath) return
				const url = this.getPdfUrl()
				uni.showLoading({ title: '下载中...' })
				uni.downloadFile({
					url: url,
					success: (res) => {
						if (res.statusCode === 200) {
							uni.saveFile({
								tempFilePath: res.tempFilePath,
								success: (saveRes) => {
									uni.openDocument({
										filePath: saveRes.savedFilePath,
										showMenu: true,
										success: () => {},
										fail: () => {
											uni.showToast({ title: '打开文件失败', icon: 'none' })
										}
									})
								}
							})
						}
					},
					fail: () => {
						uni.showToast({ title: '下载失败', icon: 'none' })
					},
					complete: () => {
						uni.hideLoading()
					}
				})
			},
			getPdfUrl() {
				let path = this.cert.pdfPath
				if (path && !path.startsWith('http')) {
					path = config.baseURL.replace('/prod-api', '') + path
				}
				return path
			},
			downloadAndOpen(url) {
				uni.showLoading({ title: '加载中...' })
				uni.downloadFile({
					url: url,
					success: (res) => {
						if (res.statusCode === 200) {
							uni.openDocument({
								filePath: res.tempFilePath,
								showMenu: true,
								fail: () => {
									uni.showToast({ title: '打开文件失败', icon: 'none' })
								}
							})
						}
					},
					fail: () => {
						uni.showToast({ title: '下载失败', icon: 'none' })
					},
					complete: () => {
						uni.hideLoading()
					}
				})
			}
		}
	}
</script>

<style scoped lang="scss">
	.page-container {
		min-height: 100vh;
		background: #f5f6f8;
		padding-bottom: 30rpx;
	}

	.type-card {
		padding: 40rpx 30rpx;
		color: #fff;
	}
	.type-bg-activity { background: linear-gradient(135deg, #43a047, #66bb6a); }
	.type-bg-volunteer { background: linear-gradient(135deg, #1e88e5, #42a5f5); }
	.type-bg-award { background: linear-gradient(135deg, #f9a825, #fdd835); }
	.type-badge {
		font-size: 24rpx;
		background: rgba(255,255,255,0.3);
		padding: 6rpx 20rpx;
		border-radius: 20rpx;
		display: inline-block;
		margin-bottom: 12rpx;
	}
	.type-name {
		font-size: 36rpx;
		font-weight: 700;
		display: block;
	}

	.card {
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
	.info-row {
		display: flex;
		padding: 12rpx 0;
		border-bottom: 1rpx solid #f5f5f5;
		font-size: 28rpx;
	}
	.info-row:last-child { border-bottom: none; }
	.info-label { color: #999; width: 160rpx; flex-shrink: 0; }
	.info-value { flex: 1; color: #333; }
	.text-green { color: #43a047; font-weight: 600; }
	.text-gray { color: #999; }

	/* PDF */
	.pdf-section { padding: 8rpx 0; }
	.pdf-preview-btn {
		display: flex;
		align-items: center;
		padding: 20rpx;
		background: #f5f7fa;
		border-radius: 8rpx;
		margin-bottom: 16rpx;
	}
	.pdf-icon { font-size: 36rpx; margin-right: 16rpx; }
	.pdf-text { flex: 1; font-size: 28rpx; color: #333; }
	.pdf-arrow { font-size: 24rpx; color: #999; }
	.pdf-download-btn {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		padding: 20rpx 0;
		border-radius: 40rpx;
		text-align: center;
		color: #fff;
		font-size: 28rpx;
		font-weight: 500;
	}
</style>
