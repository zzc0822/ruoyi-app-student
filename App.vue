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
						if (data.code === 200 && data.token) {
							setToken(data.token);
							// 静默登录成功，通知各页面刷新登录状态，避免登录 UI 闪现
							uni.$emit('app:silentLoginSuccess', { token: data.token });
						}
						// code=401 表示未绑定，不做任何处理，等用户手动点击一键登录
					}).catch(() => {
						// 静默登录失败，不弹错，让用户手动登录
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
