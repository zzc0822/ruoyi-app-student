import request from '@/utils/request'

// 学生端微信一键登录（先建游客账再升级）
export function studentPhoneLogin(phoneCode, loginCode) {
	return request({
		url: '/studentPhoneLogin',
		header: { isToken: false, isLoginApi: true },
		method: 'POST',
		data: { phoneCode, loginCode }
	})
}

// 学生端静默登录：仅凭 loginCode 做 openid 匹配
export function studentSilentLogin(loginCode) {
	return request({
		url: '/studentSilentLogin',
		header: { isToken: false, isLoginApi: true },
		method: 'POST',
		data: { loginCode }
	})
}

// 设置code
export const setWxampCode = (uuid, code) => {
	return request({
		url: '/wxLogin',
		header: { isToken: false },
		method: 'POST',
		data: { code }
	})
}

// 小程序登录
export const wxampLoginApi = (code) => {
	return request({
		url: '/wxLogin',
		header: { isToken: false },
		method: 'POST',
		data: { code }
	})
}

// 登录方法
export function login(userInfo) {
	return request({
		url: '/login',
		header: { isToken: false },
		method: 'post',
		data: userInfo
	})
}

// 退出方法
export function logout() {
	return request({
		url: '/logout',
		method: 'post'
	})
}

// 获取验证码
export function getCodeImg() {
	return request({
		url: '/captchaImage',
		header: { isToken: false },
		method: 'get',
		timeout: 20000
	})
}
