<template>
	<view>
		<view v-if=" nickName!='' ">
			<!-- 顶部个人信息区 -->
			<view class="header">
				<view class="kong"></view>
				<!-- 网络思政金句 -->
				<view class="quote-bar" v-if="quoteText">
					<text class="quote-label">网络思政</text>
					<text class="quote-text">{{quoteText}}</text>
				</view>
				<!-- 头像和信息行 -->
				<view class="profile-row">
					<!-- 左侧证件照 -->
					<view class="photo-box" @click="changePhoto">
						<image class="student-photo" :src="studentPhotoUrl" mode="aspectFill"></image>
						<view class="photo-change-tip">更换</view>
					</view>
					<!-- 右侧信息 -->
					<view class="profile-info">
						<view class="profile-name">{{nickName}}</view>
						<view class="profile-detail" v-if="studentInfo">
							<text class="detail-item">{{studentInfo.xymc}}</text>
							<text class="detail-item">{{studentInfo.bjjc || studentInfo.bjmc}}</text>
							<text class="detail-item">学号：{{studentInfo.xh}}</text>
						</view>
						<view class="profile-detail" v-else>
							<text class="detail-item">游客身份</text>
						</view>
					</view>
					<!-- 设置按钮 -->
					<view class="set-btn" @click="goToSetting">
						<image style="height: 22px; width: 22px;" src="../../static/icon/set-up.svg"></image>
					</view>
				</view>
			</view>

			<!-- 统计卡片区 -->
			<view class="stats-card" v-if="studentInfo">
				<view class="stats-title">在校统计</view>
				<view class="stats-grid">
					<view class="stat-item">
						<text class="stat-num">{{statsData.violationCount || 0}}</text>
						<text class="stat-label">课堂违纪</text>
					</view>
					<view class="stat-item">
						<text class="stat-num">{{statsData.lateCount || 0}}</text>
						<text class="stat-label">迟到</text>
					</view>
					<view class="stat-item">
						<text class="stat-num">{{statsData.truantCount || 0}}</text>
						<text class="stat-label">旷课</text>
					</view>
					<view class="stat-item">
						<text class="stat-num">{{statsData.talkCount || 0}}</text>
						<text class="stat-label">谈话次数</text>
					</view>
					<view class="stat-item" @click="goAttendance">
						<text class="stat-num score-num">{{statsData.scoreTotal != null ? statsData.scoreTotal : 100}}</text>
						<text class="stat-label">二课积分</text>
					</view>
				</view>
			</view>

			<!-- 功能快捷入口 -->
			<view class="quick-btns" v-if="studentInfo">
				<view class="quick-btn" @click="goLeave">
					<text class="quick-btn-icon">📄</text>
					<text class="quick-btn-label">我的请假</text>
				</view>
				<view class="quick-btn" @click="goAttendance">
					<text class="quick-btn-icon">📊</text>
					<text class="quick-btn-label">出勤与积分</text>
				</view>
				<view class="quick-btn" @click="goActivity">
					<text class="quick-btn-icon">🎯</text>
					<text class="quick-btn-label">活动报名</text>
				</view>
				<view class="quick-btn" @click="goMyActivity">
					<text class="quick-btn-icon">📋</text>
					<text class="quick-btn-label">我的活动</text>
				</view>
			</view>

			<!-- 功能 Tab 页 -->
			<view class="func-tabs">
				<view
					v-for="(tab, idx) in funcTabs"
					:key="idx"
					:class="['func-tab-item', activeTab === idx ? 'func-tab-active' : '']"
					@click="activeTab = idx">
					{{tab.label}}
				</view>
			</view>

			<!-- Tab 0: 我的信息 -->
			<view v-if="activeTab === 0">

			<!-- 信息分组卡片 -->
			<!-- 1. 基本信息 -->
			<view class="info-card">
				<view class="card-header" @click="toggleCard('basic')">
					<text class="card-title">基本信息</text>
					<view class="card-header-right">
						<text class="edit-btn" @click.stop="openEdit('basic')">编辑</text>
						<text class="collapse-arrow">{{cardExpanded.basic ? '▲' : '▼'}}</text>
					</view>
				</view>
				<view class="card-expand-content" v-if="cardExpanded.basic">
					<view class="info-row" v-if="studentInfo">
						<text class="info-label">姓名</text>
						<text class="info-value">{{studentInfo.xm || '--'}}</text>
					</view>
					<view class="info-row" v-if="studentInfo">
						<text class="info-label">性别</text>
						<text class="info-value">{{studentInfo.xb || '--'}}</text>
					</view>
					<view class="info-row" v-if="studentInfo">
						<text class="info-label">身份证号</text>
						<text class="info-value">{{maskIdCard(studentInfo.sfzh)}}</text>
					</view>
					<view class="info-row" v-if="studentInfo">
						<text class="info-label">手机号</text>
						<text class="info-value">{{studentInfo.phone || '--'}}</text>
					</view>
				</view>
			</view>

			<!-- 2. 家庭联系方式 -->
			<view class="info-card">
				<view class="card-header" @click="toggleCard('family')">
					<text class="card-title">家庭联系方式</text>
					<view class="card-header-right">
						<text class="edit-btn" @click.stop="openEdit('family')">编辑</text>
						<text class="collapse-arrow">{{cardExpanded.family ? '▲' : '▼'}}</text>
					</view>
				</view>
				<view class="card-expand-content" v-if="cardExpanded.family">
					<view class="info-row" v-if="studentInfo">
						<text class="info-label">家庭联系人</text>
						<text class="info-value">{{studentInfo.jtlxr || '--'}}</text>
					</view>
					<view class="info-row" v-if="studentInfo">
						<text class="info-label">家庭电话</text>
						<text class="info-value">{{studentInfo.jtdh || '--'}}</text>
					</view>
					<view class="info-row" v-if="studentInfo">
						<text class="info-label">家庭地址</text>
						<text class="info-value">{{studentInfo.jtdz || '--'}}</text>
					</view>
				</view>
			</view>

			<!-- 3. 校内基本信息 -->
			<view class="info-card">
				<view class="card-header" @click="toggleCard('school')">
					<text class="card-title">校内基本信息</text>
					<view class="card-header-right">
						<text class="edit-btn" @click.stop="openEdit('school')">编辑</text>
						<text class="collapse-arrow">{{cardExpanded.school ? '▲' : '▼'}}</text>
					</view>
				</view>
				<view class="card-expand-content" v-if="cardExpanded.school">
					<view class="info-row" v-if="studentInfo">
						<text class="info-label">学院</text>
						<text class="info-value">{{studentInfo.xymc || '--'}}</text>
					</view>
					<view class="info-row" v-if="studentInfo">
						<text class="info-label">班级</text>
						<text class="info-value">{{studentInfo.bjjc || studentInfo.bjmc || '--'}}</text>
					</view>
					<view class="info-row" v-if="studentInfo">
						<text class="info-label">学号</text>
						<text class="info-value">{{studentInfo.xh || '--'}}</text>
					</view>
					<view class="info-row" v-if="studentInfo">
						<text class="info-label">宿舍号</text>
						<text class="info-value">{{studentInfo.ssh || '--'}}</text>
					</view>
				</view>
			</view>

			<!-- 4. 银行账号（多卡） -->
			<view class="info-card">
				<view class="card-header" @click="toggleCard('bank')">
					<text class="card-title">银行账号</text>
					<view class="card-header-right">
						<text class="edit-btn" @click.stop="openAddBankCard">添加</text>
						<text class="collapse-arrow">{{cardExpanded.bank ? '▲' : '▼'}}</text>
					</view>
				</view>
				<view class="card-expand-content" v-if="cardExpanded.bank">
					<view v-if="bankCards.length === 0" class="info-row">
						<text class="info-value" style="color:#999">暂无银行卡，点击添加</text>
					</view>
					<view v-for="(card, idx) in bankCards" :key="card.id" class="bank-card-item">
						<view class="bank-card-main">
							<view class="bank-card-row">
								<text class="bank-card-no">{{maskBankCard(card.cardNo)}}</text>
								<text v-if="card.isDefault === 1" class="bank-card-default-tag">默认</text>
							</view>
							<view class="bank-card-row sub">
								<text class="bank-card-meta">{{card.bankName || ''}}</text>
								<text v-if="card.cardRemark" class="bank-card-remark">{{card.cardRemark}}</text>
							</view>
						</view>
						<view class="bank-card-actions">
							<text class="bank-action-btn" @click.stop="openEditBankCard(card)">编辑</text>
							<text v-if="card.isDefault !== 1" class="bank-action-btn" @click.stop="setDefaultCard(card.id)">设默认</text>
							<text class="bank-action-btn del" @click.stop="deleteBankCard(card.id)">删除</text>
						</view>
					</view>
				</view>
			</view>

			<!-- 5. 个人信息 -->
			<view class="info-card">
				<view class="card-header" @click="toggleCard('height')">
					<text class="card-title">个人信息</text>
					<view class="card-header-right">
						<text class="edit-btn" @click.stop="openEdit('height')">编辑</text>
						<text class="collapse-arrow">{{cardExpanded.height ? '▲' : '▼'}}</text>
					</view>
				</view>
				<view class="card-expand-content" v-if="cardExpanded.height">
					<view class="info-row" v-if="studentInfo">
						<text class="info-label">身高(cm)</text>
						<text class="info-value">{{studentInfo.sg || '--'}}</text>
					</view>
				</view>
			</view>

			</view><!-- end Tab 0 -->

			<!-- Tab 1: 我的申请 -->
			<view v-if="activeTab === 1">
				<view class="tab-content-wrap">
					<view class="change-inline" v-if="changeRequests.length > 0">
						<view class="change-item" v-for="(item, idx) in changeRequests" :key="idx">
							<view class="change-info">
								<text class="change-field">{{item.fieldLabel}}</text>
								<text class="change-val">{{item.oldValue || '空'}} → {{item.newValue}}</text>
							</view>
							<view :class="['change-status', 'status-' + item.approvalStatus]">
								{{statusText(item.approvalStatus)}}
							</view>
						</view>
					</view>
					<view class="change-empty" v-else>
						<text>暂无变更申请</text>
					</view>
				</view>
			</view><!-- end Tab 1 -->

			<!-- 编辑弹窗 -->
			<u-popup :show="editShow" mode="bottom" round="16" @close="editShow=false" :closeable="true">
				<view class="edit-popup">
					<view class="edit-title">{{editTitle}}</view>
					<u-form :model="editForm" ref="editFormRef" labelWidth="100">
						<view v-for="(field, idx) in editFields" :key="idx">
							<u-form-item :label="field.label" :prop="field.name">
								<u-input v-model="editForm[field.name]" :placeholder="field.placeholder || ('请输入' + field.label)" border="surround"></u-input>
							</u-form-item>
						</view>
						<u-form-item label="变更原因">
							<u-input v-model="editForm.changeReason" placeholder="请输入变更原因" border="surround"></u-input>
						</u-form-item>
					</u-form>
					<view class="edit-actions">
						<u-button type="primary" :loading="submitting" @click="submitEdit">提交申请</u-button>
					</view>
				</view>
			</u-popup>

			<!-- 变更申请列表弹窗 -->
			<u-popup :show="changeShow" mode="bottom" round="16" @close="changeShow=false" :closeable="true">
				<view class="change-popup">
					<view class="edit-title">我的变更申请</view>
					<view class="change-list" v-if="changeRequests.length > 0">
						<view class="change-item" v-for="(item, idx) in changeRequests" :key="idx">
							<view class="change-info">
								<text class="change-field">{{item.fieldLabel}}</text>
								<text class="change-val">{{item.oldValue || '空'}} → {{item.newValue}}</text>
							</view>
							<view :class="['change-status', 'status-' + item.approvalStatus]">
								{{statusText(item.approvalStatus)}}
							</view>
						</view>
					</view>
					<view class="change-empty" v-else>
						<text>暂无变更申请</text>
					</view>
				</view>
			</u-popup>

			<!-- 银行卡新增/编辑弹窗 -->
			<u-popup :show="bankCardEditShow" mode="bottom" round="16" @close="bankCardEditShow=false" :closeable="true">
				<view class="edit-popup">
					<view class="edit-title">{{bankCardEditIsNew ? '添加银行卡' : '编辑银行卡'}}</view>
					<u-form :model="bankCardEditForm" labelWidth="100">
						<u-form-item label="银行卡号" required>
							<u-input v-model="bankCardEditForm.cardNo" placeholder="请输入16-19位银行卡号" border="surround" type="number"></u-input>
						</u-form-item>
						<u-form-item label="开户行">
							<u-input v-model="bankCardEditForm.bankName" placeholder="如：中国工商银行" border="surround"></u-input>
						</u-form-item>
						<u-form-item label="卡片备注">
							<u-input v-model="bankCardEditForm.cardRemark" placeholder="如：社保卡、奖学金卡" border="surround"></u-input>
						</u-form-item>
					</u-form>
					<view class="edit-actions">
						<u-button type="primary" :loading="submitting" @click="submitBankCard">保存</u-button>
					</view>
				</view>
			</u-popup>

		</view>

		<view v-if="!isLogin">
			<!-- 未登录时不显示登录UI，直接跳转到统一登录页 -->
		</view>
	</view>
</template>

<script>
	import userInfoApi from "@/api/userInfo.js"
	import config from '@/config';
	import {
		studentPhoneLogin
	} from "@/api/login"
	import {
		isLogin,
		setToken,
		setUserId
	} from "@/utils/auth";
	import { handleCampusUrl } from "@/utils/campus";

	// 编辑分组配置
	const GROUP_CONFIG = {
		basic: {
			title: '编辑基本信息',
			fields: [
				{ name: 'phone', label: '手机号' }
			]
		},
		family: {
			title: '编辑家庭联系方式',
			fields: [
				{ name: 'jtlxr', label: '家庭联系人' },
				{ name: 'jtdh', label: '家庭电话' },
				{ name: 'jtdz', label: '家庭地址' }
			]
		},
		school: {
			title: '编辑校内信息',
			fields: [
				{ name: 'ssh', label: '宿舍号' }
			]
		},
		bank: {
			// bank 不再走审批流，保留配置不应用
			title: '编辑银行账号',
			fields: []
		},
		height: {
			title: '编辑个人信息',
			fields: [
				{ name: 'sg', label: '身高(cm)' }
			]
		}
	};

	export default {
		computed: {
			studentPhotoUrl() {
				if (this.studentInfo && this.studentInfo.photo) {
					return handleCampusUrl(this.studentInfo.photo);
				}
				return handleCampusUrl(this.user.avatar || '');
			}
		},
		data() {
			return {
				isLogin: false,
				user: {},
				nickName: "",
				studentInfo: null,
				statsData: {},
				quoteText: '',
				pendingCount: 0,
				// Tab
				activeTab: 0,
				funcTabs: [
					{ label: '我的信息' },
					{ label: '我的申请' },
				],
				// 卡片折叠状态（默认全部折叠）
				cardExpanded: {
					basic: false,
					family: false,
					school: false,
					bank: false,
					height: false,
				},
				// 编辑弹窗
				editShow: false,
				editTitle: '',
				editGroup: '',
				editFields: [],
				editForm: {},
				submitting: false,
				// 变更申请弹窗
				changeShow: false,
				changeRequests: [],
				// 银行卡列表
				bankCards: [],
				// 银行卡编辑弹窗
				bankCardEditShow: false,
				bankCardEditIsNew: true,
				bankCardEditForm: { id: null, cardNo: '', bankName: '', cardRemark: '' },
			}
		},
		created() {
			if (isLogin()) {
				this.isLogin = true;
				this.getUserInfo();
				this.getRandomQuote();
			}
			// 监听 App.vue 静默登录成功事件，自动刷新用户状态
			uni.$on('app:silentLoginSuccess', this.onSilentLoginSuccess);
		},
		onUnload() {
			uni.$off('app:silentLoginSuccess', this.onSilentLoginSuccess);
		},
		watch: {
			activeTab(val) {
				if (val === 1 && this.isLogin) {
					this.loadChangeRequests();
				}
			}
		},
		onShow() {
			// 未登录时直接跳转到统一登录页
			if (!isLogin()) {
				uni.navigateTo({
					url: '/pages/login/wxLogin'
				});
				return;
			}
			// 如果未登录但 token 已存在（App.vue 静默登录写入），自动初始化登录状态
			if (!this.isLogin && isLogin()) {
				this.isLogin = true;
				this.getUserInfo();
				this.getRandomQuote();
				return;
			}
			if (this.isLogin && this.studentInfo) {
				this.getMyStudentInfo();
			}
		},
		methods: {
			onSilentLoginSuccess() {
				// App.vue 静默登录成功后触发：如果当前还是未登录状态，自动刷新为已登录
				if (!this.isLogin && isLogin()) {
					this.isLogin = true;
					this.getUserInfo();
					this.getRandomQuote();
				}
			},
			onGetPhoneNumber(e) {
				if (e.detail.errMsg !== 'getPhoneNumber:ok') {
					uni.showToast({ title: '需要授权手机号才能登录', icon: 'none' });
					return;
				}
				const phoneCode = e.detail.code;
				if (!phoneCode) {
					uni.showToast({ title: '获取手机号失败，请重试', icon: 'none' });
					return;
				}
				uni.showLoading({ title: '登录中' });
				uni.login({
					provider: 'weixin',
					success: (loginRes) => {
						const loginCode = loginRes.code;
						studentPhoneLogin(phoneCode, loginCode).then(({
							data
						}) => {
							uni.hideLoading();
							// 后端返回结构：{ code, msg, data: { token, isStudent, studentName } }
							const token = data.data && data.data.token ? data.data.token : null;
							if (token) {
								setToken(token);
								this.isLogin = true;
								this.getUserInfo();
								this.getRandomQuote();
								const innerData = data.data || {};
								if (innerData.isStudent) {
									uni.showToast({ title: '欢迎, ' + innerData.studentName, icon: 'none' });
								} else {
									uni.showToast({ title: '登录成功，游客身份', icon: 'none' });
								}
							} else {
								uni.showToast({ title: data.msg || '登录失败', icon: 'none' });
							}
						}).catch((err) => {
							uni.hideLoading();
						});
					},
					fail: () => {
						uni.hideLoading();
						uni.showToast({ title: '微信登录失败', icon: 'none' });
					}
				});
			},

			loginHandle() {
				if (!isLogin()) {
					uni.navigateTo({
						url: '/pages/login/wxLogin'
					});
				} else {
					this.isLogin = true;
				}
				if (isLogin()) {
					this.getUserInfo();
				}
			},
			getUserInfo() {
				userInfoApi.getUserInfo().then(({ data }) => {
					this.user = data.user;
					this.nickName = data.user.nickName;
					setUserId(data.user.userId);
					if (data.user.userType === '01') {
						this.getMyStudentInfo();
					}
				});
			},
			getMyStudentInfo() {
				userInfoApi.getMyStudentInfo().then(({ data }) => {
					if (data.code === 200) {
						this.studentInfo = data.data;
						this.getMyStats();
						this.loadPendingCount();
						this.loadBankCards();
					}
				});
			},
			getMyStats() {
				userInfoApi.getMyStats().then(({ data }) => {
					if (data.code === 200 && data.data) {
						this.statsData = data.data.statistics || data.data;
					}
				});
			},
			getRandomQuote() {
				userInfoApi.getRandomQuote().then(({ data }) => {
					if (data.code === 200 && data.data) {
						this.quoteText = data.data.text || data.data.quoteText || '';
					}
				}).catch(() => {
					this.quoteText = '用心做教育,用爱育未来';
				});
			},
			// 加载待审批数量
			loadPendingCount() {
				userInfoApi.getMyChangeRequests({ approvalStatus: 'pending' }).then(({ data }) => {
					if (data.code === 200 && data.data) {
						this.pendingCount = data.data.length;
					}
				});
			},
			// 数据脱敏 - 身份证号
			maskIdCard(val) {
				if (!val) return '--';
				if (val.length > 8) {
					return val.substring(0, 4) + '**********' + val.substring(val.length - 4);
				}
				return val;
			},
			// 数据脱敏 - 银行卡号
			maskBankCard(val) {
				if (!val) return '--';
				if (val.length > 8) {
					return val.substring(0, 4) + ' **** **** ' + val.substring(val.length - 4);
				}
				return val;
			},
			// 跳转设置页
			goToSetting() {
				uni.navigateTo({ url: '/pages/me/setting' });
			},
			// 更换证件照
			changePhoto() {
				uni.chooseImage({
					count: 1,
					sizeType: ['compressed'],
					sourceType: ['album', 'camera'],
					success: (res) => {
						const tempPath = res.tempFilePaths[0];
						uni.showLoading({ title: '上传中' });
						uni.uploadFile({
							url: config.baseURL + '/api/stuinfo/uploadPhoto',
							filePath: tempPath,
							name: 'file',
							header: {
								'Authorization': 'Bearer ' + uni.getStorageSync('App-Token')
							},
							success: (uploadRes) => {
								const data = JSON.parse(uploadRes.data);
								if (data.code === 200) {
									uni.showToast({ title: '照片更新成功', icon: 'success' });
									this.getMyStudentInfo();
								} else {
									uni.showToast({ title: data.msg || '上传失败', icon: 'none' });
								}
							},
							fail: () => {
								uni.showToast({ title: '上传失败', icon: 'none' });
							},
							complete: () => {
								uni.hideLoading();
							}
						});
					}
				});
			},
			// 打开编辑弹窗
			openEdit(group) {
				const config = GROUP_CONFIG[group];
				if (!config) return;
				this.editGroup = group;
				this.editTitle = config.title;
				this.editFields = config.fields;
				// 初始化表单数据
				const form = { changeReason: '' };
				config.fields.forEach(f => {
					form[f.name] = this.studentInfo[f.name] || '';
				});
				this.editForm = form;
				this.editShow = true;
			},
			// 提交编辑
			submitEdit() {
				const config = GROUP_CONFIG[this.editGroup];
				if (!config) return;
				const changes = [];
				config.fields.forEach(f => {
					const oldVal = this.studentInfo[f.name] != null ? String(this.studentInfo[f.name]) : '';
					const newVal = this.editForm[f.name] != null ? String(this.editForm[f.name]) : '';
					if (oldVal !== newVal) {
						changes.push({
							fieldName: f.name,
							fieldLabel: f.label,
							oldValue: oldVal,
							newValue: newVal
						});
					}
				});
				if (changes.length === 0) {
					uni.showToast({ title: '未修改任何内容', icon: 'none' });
					return;
				}
				this.submitting = true;
				userInfoApi.submitInfoChange({
					changeType: this.editGroup,
					changes: changes,
					changeReason: this.editForm.changeReason || ''
				}).then(({ data }) => {
					this.submitting = false;
					if (data.code === 200) {
						uni.showToast({ title: '申请已提交，等待审批', icon: 'success' });
						this.editShow = false;
						this.loadPendingCount();
					} else {
						uni.showToast({ title: data.msg || '提交失败', icon: 'none' });
					}
				}).catch(() => {
					this.submitting = false;
					uni.showToast({ title: '提交失败', icon: 'none' });
				});
			},
			// 加载变更申请列表
			loadChangeRequests() {
				userInfoApi.getMyChangeRequests({}).then(({ data }) => {
					if (data.code === 200) {
						this.changeRequests = data.data || [];
						this.pendingCount = this.changeRequests.filter(r => r.approvalStatus === 'pending').length;
					}
				}).catch(() => {});
			},
			// 查看变更申请（切换tab）
			showChangeRequests() {
				this.activeTab = 1;
				this.loadChangeRequests();
			},
			statusText(status) {
				const map = { pending: '待审批', approved: '已通过', rejected: '已拒绝' };
				return map[status] || status;
			},
			// 切换卡片折叠
			toggleCard(key) {
				this.cardExpanded[key] = !this.cardExpanded[key];
			},
			// ===== 银行卡方法 =====
			loadBankCards() {
				userInfoApi.getMyBankCards().then(({ data }) => {
					if (data.code === 200) {
						this.bankCards = data.data || [];
					}
				}).catch(() => {});
			},
			openAddBankCard() {
				this.bankCardEditIsNew = true;
				this.bankCardEditForm = { id: null, cardNo: '', bankName: '', cardRemark: '' };
				this.bankCardEditShow = true;
			},
			openEditBankCard(card) {
				this.bankCardEditIsNew = false;
				this.bankCardEditForm = { id: card.id, cardNo: card.cardNo, bankName: card.bankName || '', cardRemark: card.cardRemark || '' };
				this.bankCardEditShow = true;
			},
			submitBankCard() {
				const form = this.bankCardEditForm;
				if (!form.cardNo || !/^\d{16,19}$/.test(form.cardNo)) {
					uni.showToast({ title: '银行卡号须为16-19位数字', icon: 'none' });
					return;
				}
				this.submitting = true;
				const api = this.bankCardEditIsNew
					? userInfoApi.addMyBankCard({ cardNo: form.cardNo, bankName: form.bankName, cardRemark: form.cardRemark })
					: userInfoApi.updateMyBankCard({ id: form.id, cardNo: form.cardNo, bankName: form.bankName, cardRemark: form.cardRemark });
				api.then(({ data }) => {
					this.submitting = false;
					if (data.code === 200) {
						uni.showToast({ title: '保存成功', icon: 'success' });
						this.bankCardEditShow = false;
						this.loadBankCards();
					} else {
						uni.showToast({ title: data.msg || '保存失败', icon: 'none' });
					}
				}).catch(() => {
					this.submitting = false;
					uni.showToast({ title: '操作失败', icon: 'none' });
				});
			},
			setDefaultCard(id) {
				uni.showModal({
					title: '确认',
					content: '设为默认银行卡？',
					success: (res) => {
						if (res.confirm) {
							userInfoApi.setDefaultBankCard(id).then(({ data }) => {
								if (data.code === 200) {
									uni.showToast({ title: '已设为默认卡', icon: 'success' });
									this.loadBankCards();
									this.getMyStudentInfo();
								} else {
									uni.showToast({ title: data.msg || '操作失败', icon: 'none' });
								}
							}).catch(() => {});
						}
					}
				});
			},
			deleteBankCard(id) {
				uni.showModal({
					title: '确认删除',
					content: '确定删除该银行卡？',
					success: (res) => {
						if (res.confirm) {
							userInfoApi.deleteMyBankCard(id).then(({ data }) => {
								if (data.code === 200) {
									uni.showToast({ title: '删除成功', icon: 'success' });
									this.loadBankCards();
									this.getMyStudentInfo();
								} else {
									uni.showToast({ title: data.msg || '删除失败', icon: 'none' });
								}
							}).catch(() => {});
						}
					}
				});
			},
			goLeave() {
				uni.navigateTo({ url: '/pages/leave/index' });
			},
			goAttendance() {
				uni.navigateTo({ url: '/pages/attendance/index' });
			},
			goActivity() {
				uni.navigateTo({ url: '/pages/activity/index' });
			},
			goMyActivity() {
				uni.navigateTo({ url: '/pages/activity/my' });
			},
		}
	}
</script>

<style>
	.header {
		background: url("/static/images//background.png") no-repeat;
		background-size: cover;
		padding: 0 20px 20px 20px;
	}

	.kong {
		height: 5px;
	}

	/* 网络思政金句栏 */
	.quote-bar {
		display: flex;
		align-items: flex-start;
		background: rgba(255, 255, 255, 0.2);
		border-radius: 8px;
		padding: 8px 12px;
		margin-bottom: 12px;
	}

	.quote-label {
		font-size: 12px;
		color: rgba(255, 255, 255, 0.95);
		background: rgba(255, 255, 255, 0.3);
		border-radius: 4px;
		padding: 2px 6px;
		margin-right: 8px;
		margin-top: 2px;
		flex-shrink: 0;
	}

	.quote-text {
		font-size: 13px;
		color: rgba(255, 255, 255, 0.95);
		line-height: 1.5;
		flex: 1;
		font-style: italic;
	}

	/* 个人信息行 */
	.profile-row {
		display: flex;
		align-items: center;
	}

	/* 左侧证件照 */
	.photo-box {
		width: 70px;
		height: 98px;
		flex-shrink: 0;
		border-radius: 6px;
		overflow: hidden;
		border: 2px solid rgba(255, 255, 255, 0.85);
		box-shadow: 0 3px 10px rgba(0, 0, 0, 0.25);
		position: relative;
	}

	.student-photo {
		width: 100%;
		height: 100%;
	}

	.photo-change-tip {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		background: rgba(0, 0, 0, 0.5);
		color: white;
		font-size: 10px;
		text-align: center;
		padding: 2px 0;
	}

	/* 右侧信息 */
	.profile-info {
		flex: 1;
		margin-left: 15px;
		overflow: hidden;
	}

	.profile-name {
		font-size: 20px;
		font-weight: bold;
		color: white;
		margin-bottom: 6px;
	}

	.profile-detail {
		display: flex;
		flex-wrap: wrap;
		gap: 4px 10px;
	}

	.detail-item {
		font-size: 13px;
		color: rgba(255, 255, 255, 0.9);
		white-space: nowrap;
	}

	/* 设置按钮 */
	.set-btn {
		flex-shrink: 0;
		padding: 8px;
	}

	/* 统计卡片区 */
	.stats-card {
		background: white;
		border-radius: 12px;
		margin: -10px 15px 15px;
		padding: 15px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
	}

	.stats-title {
		font-size: 15px;
		font-weight: bold;
		color: #333;
		margin-bottom: 12px;
	}

	.stats-grid {
		display: flex;
		justify-content: space-around;
	}

	.stat-item {
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.stat-num {
		font-size: 22px;
		font-weight: bold;
		color: #333;
	}

	.stat-label {
		font-size: 12px;
		color: #999;
		margin-top: 4px;
	}

	/* 积分数字醒目色 */
	.score-num {
		color: #4a7cf6;
	}

	/* 功能快捷入口 */
	.quick-btns {
		display: flex;
		gap: 20rpx;
		margin: 0 15px 15px;
	}

	.quick-btn {
		flex: 1;
		background: #fff;
		border-radius: 12px;
		padding: 20rpx 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		box-shadow: 0 2px 8px rgba(0,0,0,0.06);
	}

	.quick-btn-icon {
		font-size: 32rpx;
		margin-bottom: 8rpx;
	}

	.quick-btn-label {
		font-size: 24rpx;
		color: #444;
	}

	/* 变更申请入口 */
	.change-entry {
		display: flex;
		justify-content: space-between;
		align-items: center;
		background: white;
		margin: 0 15px 15px;
		padding: 14px 16px;
		border-radius: 12px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
	}

	.change-entry-title {
		font-size: 15px;
		font-weight: bold;
		color: #333;
	}

	.change-entry-right {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.pending-badge {
		background: #f56c6c;
		color: white;
		font-size: 11px;
		min-width: 18px;
		height: 18px;
		line-height: 18px;
		text-align: center;
		border-radius: 9px;
		padding: 0 5px;
	}

	.arrow {
		color: #ccc;
		font-size: 16px;
	}

	/* 信息卡片 */
	.info-card {
		background: white;
		border-radius: 12px;
		margin: 0 15px 15px;
		padding: 15px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
	}

	/* 信息卡片标题行 */
	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		border-bottom: 1px solid #f0f0f0;
		padding-bottom: 10px;
		cursor: pointer;
	}

	.card-header-right {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.collapse-arrow {
		font-size: 11px;
		color: #bbb;
	}

	/* 功能 Tab */
	.func-tabs {
		display: flex;
		background: white;
		margin: 0 15px 12px;
		border-radius: 10px;
		overflow: hidden;
		box-shadow: 0 2px 8px rgba(0,0,0,0.06);
	}

	.func-tab-item {
		flex: 1;
		text-align: center;
		padding: 12px 0;
		font-size: 14px;
		color: #999;
		border-bottom: 2px solid transparent;
	}

	.func-tab-active {
		color: #2979ff;
		font-weight: bold;
		border-bottom: 2px solid #2979ff;
	}

	.tab-content-wrap {
		background: white;
		border-radius: 12px;
		margin: 0 15px 15px;
		padding: 15px;
		box-shadow: 0 2px 8px rgba(0,0,0,0.06);
		min-height: 120px;
	}

	.change-inline {
		padding: 0;
	}

	.card-expand-content {
		padding-top: 8px;
	}

	.remark-highlight {
		color: #e6a23c;
		font-size: 13px;
	}

	/* 银行卡列表样式 */
	.bank-card-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 10px 0;
		border-bottom: 1px solid #f0f0f0;
	}

	.bank-card-main {
		flex: 1;
	}

	.bank-card-row {
		display: flex;
		align-items: center;
		margin-bottom: 2px;
	}

	.bank-card-row.sub {
		margin-top: 2px;
	}

	.bank-card-no {
		font-size: 15px;
		font-weight: bold;
		color: #333;
		letter-spacing: 1px;
	}

	.bank-card-default-tag {
		font-size: 11px;
		color: #fff;
		background: #2979ff;
		border-radius: 4px;
		padding: 1px 6px;
		margin-left: 8px;
	}

	.bank-card-meta {
		font-size: 12px;
		color: #999;
	}

	.bank-card-remark {
		font-size: 12px;
		color: #e6a23c;
		margin-left: 8px;
	}

	.bank-card-actions {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.bank-action-btn {
		font-size: 12px;
		color: #2979ff;
		padding: 0 4px;
	}

	.bank-action-btn.del {
		color: #f56c6c;
	}

	.card-title {
		font-size: 15px;
		font-weight: bold;
		color: #333;
	}

	.edit-btn {
		font-size: 13px;
		color: #2979ff;
	}

	.info-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 8px 0;
		border-bottom: 1px solid #f8f8f8;
		margin-top: 0;
	}

	.info-row:last-child {
		border-bottom: none;
	}

	.info-label {
		font-size: 14px;
		color: #666;
		flex-shrink: 0;
	}

	.info-value {
		font-size: 14px;
		color: #333;
		text-align: right;
		word-break: break-all;
		margin-left: 15px;
	}

	/* 编辑弹窗 */
	.edit-popup {
		padding: 20px;
		min-height: 300px;
	}

	.edit-title {
		font-size: 17px;
		font-weight: bold;
		color: #333;
		text-align: center;
		margin-bottom: 20px;
	}

	.edit-actions {
		margin-top: 20px;
		padding: 0 20px;
	}

	/* 变更申请弹窗 */
	.change-popup {
		padding: 20px;
		min-height: 250px;
		max-height: 60vh;
		overflow-y: auto;
	}

	.change-list {
		padding: 0 5px;
	}

	.change-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 12px 0;
		border-bottom: 1px solid #f0f0f0;
	}

	.change-info {
		flex: 1;
	}

	.change-field {
		font-size: 14px;
		color: #333;
		font-weight: 500;
		display: block;
		margin-bottom: 4px;
	}

	.change-val {
		font-size: 12px;
		color: #999;
	}

	.change-status {
		font-size: 12px;
		padding: 3px 10px;
		border-radius: 12px;
		flex-shrink: 0;
		margin-left: 10px;
	}

	.status-pending {
		background: #fdf6ec;
		color: #e6a23c;
	}

	.status-approved {
		background: #f0f9eb;
		color: #67c23a;
	}

	.status-rejected {
		background: #fef0f0;
		color: #f56c6c;
	}

	.change-empty {
		text-align: center;
		padding: 40px 0;
		color: #999;
		font-size: 14px;
	}

	.login-container {
		width: 60%;
		margin: 45vh auto;
	}

	.login-btn {
		background: linear-gradient(to right, #ff8f77, #fe519f);
		color: #fff;
		border: none;
		border-radius: 50rpx;
		height: 90rpx;
		line-height: 90rpx;
		font-size: 28rpx;
	}
</style>
