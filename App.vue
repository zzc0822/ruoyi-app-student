<style lang="scss">
	/* 注意要写在第一行，同时给style标签加入lang="scss"属性 */
	@import "@/uni_modules/uview-ui/index.scss";
	@import "@/static/style/wooui.css";
</style>
<script>
	import { getToken } from '@/utils/auth';

	export default {
		onLaunch: function() {
			// 未登录时跳转到统一登录页，登录逻辑全部由 wxLogin.vue 处理
			// #ifdef MP-WEIXIN
			if (!getToken()) {
				uni.reLaunch({ url: '/pages/login/wxLogin' });
			}
			// #endif
		},
		onShow: function() {},
		onHide: function() {}
	}
</script>

<style>
	/*每个页面公共css */
</style>
