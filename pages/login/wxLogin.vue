<template>
	<view class="login-bg">
		<image class="img-a" src="https://zhoukaiwen.com/img/loginImg/bg1.png"></image>
		<view class="t-login">
			<view class="t-b">学生登录</view>
			<view class="t-tip">绑定后下次将自动登录</view>

			<!-- #ifdef MP-WEIXIN -->
			<view class="login-box">
				<button v-if="showPhoneLogin" class="login-btn" open-type="getPhoneNumber" @getphonenumber="onGetPhoneNumber">微信一键登录</button>
				<button v-else class="login-btn loading" :loading="true" disabled>登录中...</button>
			</view>
			<!-- #endif -->

			<!-- #ifndef MP-WEIXIN -->
			<view class="login-box">
				<button class="login-btn" @click="goAccountLogin">账号密码登录</button>
			</view>
			<!-- #endif -->

			<view class="error-msg" v-if="errorMsg">
				<text>{{ errorMsg }}</text>
			</view>

			<view class="account-entry">
				<text @click="goAccountLogin">使用账号密码登录</text>
			</view>
		</view>
		<image class="img-b" src="https://zhoukaiwen.com/img/loginImg/bg2.png"></image>
	</view>
</template>

<script>
	import {
		studentSilentLogin,
		studentPhoneLogin
	} from "@/api/login"
	import {
		setToken,
		getToken
	} from "@/utils/auth";

	export default {
		data() {
			return {
				showPhoneLogin: false,
				errorMsg: ''
			}
		},
		onLoad() {
			// 已登录直接回首页
			if (getToken()) {
				uni.reLaunch({ url: '/pages/index/tab' });
				return;
			}
			// 先尝试 openid 静默登录
			this.trySilentLogin();
		},
		methods: {
			// 第一步：使用 openid 静默登录
			trySilentLogin() {
				this.showPhoneLogin = false;
				this.errorMsg = '';
				uni.login({
					provider: 'weixin',
					success: (res) => {
						studentSilentLogin(res.code).then(({ data }) => {
							// 后端返回结构：{ code, msg, data: { token, isStudent, studentName } }
							const token = data.data && data.data.token ? data.data.token : null;
							if (data.code === 200 && token) {
								// openid 已绑定，直接登录成功
								setToken(token);
								uni.showToast({ title: '登录成功', icon: 'success' });
								uni.reLaunch({ url: '/pages/index/tab' });
							} else if (data.code === 401 || data.code === 400) {
								// 未绑定或 openid 不存在，展示一键登录按钮
								this.errorMsg = data.msg || '当前微信未绑定学生账号，请使用一键登录绑定';
								this.showPhoneLogin = true;
							} else {
								this.errorMsg = data.msg || '登录失败';
								this.showPhoneLogin = true;
							}
						}).catch((err) => {
							console.error('静默登录失败', err);
							this.errorMsg = (err && err.msg) ? err.msg : '网络异常，请重试';
							this.showPhoneLogin = true;
						});
					},
					fail: () => {
						this.errorMsg = '微信登录失败，请检查小程序授权';
						this.showPhoneLogin = true;
					}
				});
			},

			// 第二步：openid 未绑定时，使用一键登录获取手机号并绑定
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
				uni.showLoading({ title: '登录中', mask: true });
				uni.login({
					provider: 'weixin',
					success: (loginRes) => {
						const loginCode = loginRes.code;
						studentPhoneLogin(phoneCode, loginCode).then(({ data }) => {
							uni.hideLoading();
							// 后端返回结构：{ code, msg, data: { token, isStudent, studentName } }
							const token = data.data && data.data.token ? data.data.token : null;
							if (data.code === 200 && token) {
								setToken(token);
								uni.showToast({ title: '登录成功', icon: 'success' });
								uni.reLaunch({ url: '/pages/index/tab' });
							} else {
								uni.showToast({ title: data.msg || '登录失败', icon: 'none' });
							}
						}).catch((err) => {
							uni.hideLoading();
							const msg = err && err.msg ? err.msg : '登录失败，请重试';
							uni.showToast({ title: msg, icon: 'none' });
						});
					},
					fail: () => {
						uni.hideLoading();
						uni.showToast({ title: '微信登录失败', icon: 'none' });
					}
				});
			},

			goAccountLogin() {
				uni.navigateTo({
					url: '/pages/login/accountLogin'
				});
			}
		}
	}
</script>

<style scoped>
	.login-bg {
		width: 100vw;
		height: 100vh;
		background: #fff;
		position: relative;
		overflow: hidden;
	}

	.img-a {
		width: 100%;
		height: 320rpx;
		position: absolute;
		top: 0;
		left: 0;
	}

	.img-b {
		width: 100%;
		height: 240rpx;
		position: absolute;
		bottom: 0;
		left: 0;
	}

	.t-login {
		position: relative;
		z-index: 2;
		padding: 360rpx 60rpx 0;
	}

	.t-b {
		font-size: 52rpx;
		font-weight: bold;
		color: #333;
		text-align: center;
		margin-bottom: 20rpx;
	}

	.t-tip {
		font-size: 28rpx;
		color: #999;
		text-align: center;
		margin-bottom: 80rpx;
	}

	.login-box {
		margin-bottom: 40rpx;
	}

	.login-btn {
		width: 100%;
		height: 90rpx;
		line-height: 90rpx;
		background: #07c160;
		color: #fff;
		font-size: 32rpx;
		border-radius: 45rpx;
		border: none;
	}

	.login-btn::after {
		border: none;
	}

	.login-btn.loading {
		background: #ccc;
	}

	.account-entry {
		text-align: center;
		font-size: 28rpx;
		color: #666;
		margin-top: 40rpx;
	}

	.error-msg {
		background: rgba(255, 107, 107, 0.15);
		color: #d93025;
		font-size: 26rpx;
		padding: 20rpx;
		border-radius: 10rpx;
		margin-top: 30rpx;
		text-align: center;
	}

	.account-entry text {
		color: #2b85e4;
		padding: 10rpx 20rpx;
	}
</style>
