import { isLogin } from "@/utils/auth";

/**
 * 登录拦截 mixin：所有页面 onLoad 时检查登录状态，未登录强制跳转到统一登录页
 */
export default {
	onLoad() {
		if (!isLogin()) {
			uni.reLaunch({
				url: '/pages/login/wxLogin'
			});
		}
	},
	onShow() {
		if (!isLogin()) {
			uni.reLaunch({
				url: '/pages/login/wxLogin'
			});
		}
	}
}
