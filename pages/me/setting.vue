<template>
	<view class="setting-page">
		<view class="setting-title">系统设置</view>

		<!-- 修改密码 -->
		<view class="setting-card" @click="showPwdPopup">
			<view class="setting-row">
				<text class="setting-label">修改密码</text>
				<text class="arrow">></text>
			</view>
		</view>

		<!-- 解绑微信 -->
		<view class="setting-card" @click="handleUnbind">
			<view class="setting-row">
				<text class="setting-label">解绑微信</text>
				<text class="arrow">></text>
			</view>
		</view>

		<!-- 退出登录 -->
		<view class="logout-btn" @click="handleLogout">
			<text>退出登录</text>
		</view>

		<!-- 修改密码弹窗 -->
		<u-popup :show="pwdShow" mode="center" round="12" @close="pwdShow=false" :closeable="true">
			<view class="pwd-popup">
				<view class="pwd-title">修改密码</view>
				<u-form :model="pwdForm" ref="pwdFormRef" labelWidth="80">
					<u-form-item label="旧密码" prop="oldPassword">
						<u-input v-model="pwdForm.oldPassword" placeholder="请输入旧密码" type="password" border="surround"></u-input>
					</u-form-item>
					<u-form-item label="新密码" prop="newPassword">
						<u-input v-model="pwdForm.newPassword" placeholder="请输入新密码" type="password" border="surround"></u-input>
					</u-form-item>
					<u-form-item label="确认密码" prop="confirmPassword">
						<u-input v-model="pwdForm.confirmPassword" placeholder="请再次输入新密码" type="password" border="surround"></u-input>
					</u-form-item>
				</u-form>
				<view class="pwd-actions">
					<u-button type="primary" :loading="submitting" @click="submitPwd">确认修改</u-button>
				</view>
			</view>
		</u-popup>
	</view>
</template>

<script>
	import userInfoApi from "@/api/userInfo.js"
	import { removeToken } from "@/utils/auth";
	import requireLogin from '@/mixins/requireLogin.js';

	export default {
		mixins: [requireLogin],
		data() {
			return {
				pwdShow: false,
				pwdForm: {
					oldPassword: '',
					newPassword: '',
					confirmPassword: ''
				},
				submitting: false
			}
		},
		methods: {
			showPwdPopup() {
				this.pwdForm = { oldPassword: '', newPassword: '', confirmPassword: '' };
				this.pwdShow = true;
			},
			submitPwd() {
				if (!this.pwdForm.oldPassword || !this.pwdForm.newPassword) {
					uni.showToast({ title: '请填写完整', icon: 'none' });
					return;
				}
				if (this.pwdForm.newPassword !== this.pwdForm.confirmPassword) {
					uni.showToast({ title: '两次密码不一致', icon: 'none' });
					return;
				}
				if (this.pwdForm.newPassword.length < 6) {
					uni.showToast({ title: '新密码至少6位', icon: 'none' });
					return;
				}
				this.submitting = true;
				userInfoApi.updateUserPwd(this.pwdForm.oldPassword, this.pwdForm.newPassword).then(({ data }) => {
					this.submitting = false;
					if (data.code === 200) {
						uni.showToast({ title: '密码修改成功', icon: 'success' });
						this.pwdShow = false;
					} else {
						uni.showToast({ title: data.msg || '修改失败', icon: 'none' });
					}
				}).catch(() => {
					this.submitting = false;
					uni.showToast({ title: '修改失败', icon: 'none' });
				});
			},
			handleUnbind() {
				uni.showModal({
					title: '提示',
					content: '确定要解绑微信吗？解绑后需重新绑定才能使用微信登录。',
					success: (res) => {
						if (res.confirm) {
							// 一点击解绑立即清理本地登录态，避免后端延迟或失败导致状态残留
							removeToken();
							uni.reLaunch({ url: '/pages/login/wxLogin' });
							// 异步通知后端解绑，失败仅记录不影响前端状态
							userInfoApi.unbindWx().then(({ data }) => {
								if (data.code !== 200) {
									console.warn('[解绑微信] 后端解绑失败：', data.msg);
								}
							}).catch((err) => {
								console.error('[解绑微信] 后端解绑异常：', err);
							});
						}
					}
				});
			},
			handleLogout() {
				uni.showModal({
					title: '提示',
					content: '确定要退出登录吗？',
					success: (res) => {
						if (res.confirm) {
							removeToken();
							uni.reLaunch({ url: '/pages/login/wxLogin' });
						}
					}
				});
			}
		}
	}
</script>

<style>
	.setting-page {
		min-height: 100vh;
		background: #f5f6f8;
		padding: 20px 15px;
	}

	.setting-title {
		font-size: 22px;
		font-weight: bold;
		color: #333;
		margin-bottom: 25px;
	}

	.setting-card {
		background: white;
		border-radius: 12px;
		margin-bottom: 12px;
		padding: 0 16px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
	}

	.setting-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 16px 0;
	}

	.setting-label {
		font-size: 15px;
		color: #333;
	}

	.arrow {
		color: #ccc;
		font-size: 16px;
	}

	.logout-btn {
		background: white;
		border-radius: 12px;
		margin-top: 40px;
		padding: 16px;
		text-align: center;
		color: #f56c6c;
		font-size: 16px;
		font-weight: 500;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
	}

	/* 密码弹窗 */
	.pwd-popup {
		width: 320px;
		padding: 20px;
	}

	.pwd-title {
		font-size: 17px;
		font-weight: bold;
		color: #333;
		text-align: center;
		margin-bottom: 20px;
	}

	.pwd-actions {
		margin-top: 20px;
	}
</style>
