<style lang="scss">
	/* 注意要写在第一行，同时给style标签加入lang="scss"属性 */
	@import "@/uni_modules/uview-ui/index.scss";
	@import "@/static/style/wooui.css";
</style>
<script>
	import { getToken, setToken } from '@/utils/auth';
	import { studentSilentLogin } from '@/api/login';

	export default {
		onLaunch: function() {
			// 已登录则跳过静默登录
			if (getToken()) return;
			// #ifdef MP-WEIXIN
			// 未登录：尝试静默登录（openid已绑定则直接返回 token，无需手机号授权）
			uni.login({
				provider: 'weixin',
				success: (res) => {
					studentSilentLogin(res.code).then(({ data }) => {
						// 后端返回结构：{ code, msg, data: { token, isStudent, studentName } }
						const token = data.data && data.data.token ? data.data.token : null;
						if (data.code === 200 && token) {
							setToken(token);
							// 静默登录成功，直接回到首页
							uni.reLaunch({
								url: '/pages/index/tab',
								fail: (err) => {
									console.error('App.vue reLaunch失败', err);
								}
							});
							// 同时通知各页面刷新登录状态
							uni.$emit('app:silentLoginSuccess', { token: token });
						} else {
							// openid 未绑定或登录失败，统一跳转到一键登录页
							uni.reLaunch({ url: '/pages/login/wxLogin' });
						}
					}).catch(() => {
						// 静默登录失败，跳转到登录页由用户手动处理
						uni.reLaunch({ url: '/pages/login/wxLogin' });
					});
				}
			});
			// #endif
		},
		onShow: function() {},
		onHide: function() {}
	}
</script>

<style>
	/*每个页面公共css */
</style>
