import request from '@/utils/request'

//学生端微信一键登录（先建游客账再升级）
export function studentPhoneLogin(phoneCode, loginCode) {
	return request({
		url: '/studentPhoneLogin',
		header: {
			isToken: false,
			isLoginApi: true
		},
		method: 'POST',
		data: {
			phoneCode: phoneCode,
			loginCode: loginCode
		}
	})
}

// 学生端静默登录：仅凭 loginCode 做 openid 匹配，已绑定则直接返回 token
export function studentSilentLogin(loginCode) {
	return request({
		url: '/studentSilentLogin',
		header: {
			isToken: false,
			isLoginApi: true
		},
		method: 'POST',
		data: {
			loginCode: loginCode
		}
	})
}

//设置code
export const setWxampCode = (uuid, code) => {
	return request({
		url: '/wxLogin',
		header: {
			isToken: false
		},
		method: 'POST',
		data: {
			code: code
		}

	})
}
//小程序登录
export const wxampLoginApi = (code) => {
	return request({
		url: '/wxLogin',
		header: {
			isToken: false
		},
		method: 'POST',
		data: {
			code: code
		}
	})
}

// 登录方法
export function login(userInfo) {
	return request({
		url: '/login',
		header: {
			isToken: false
		},
		method: 'post',
		data: userInfo
	})
}

// 注册方法
export function register(data) {
	return request({
		url: '/register',
		header: {
			isToken: false
		},
		method: 'post',
		data: data
	})
}

//绑定邮箱验证
export function bindMail(data) {
	return request({
		url: '/campus/auth/bindMail',
		method: 'post',
		data: data
	})
}

//绑定邮箱验证
export function emailValidate(uuid) {
	return request({
		url: '/campus/email-validate',
		method: 'get',
		params: {
			uuid
		}
	})
}


//校验用户名称是否唯一
export function checkUserNameUnique(userName) {
	return request({
		url: '/campus/auth/userNameUnique',
		header: {
			isToken: false
		},
		method: 'get',
		params: {
			userName
		}
	})
}

//校验用户名称是否唯一
export function checkEmailUnique(email) {
	return request({
		url: '/campus/auth/emailUnique',
		header: {
			isToken: false
		},
		method: 'get',
		params: {
			email
		}
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
		header: {
			isToken: false
		},
		method: 'get',
		timeout: 20000
	})
}

//小程序绑定账号
export function wxampBind(loginBody) {
	return request({
		url: '/wxBind',
		header: {
			isToken: false
		},
		method: 'POST',
		data: {
			code: loginBody.code,
			username: loginBody.username,
			password: loginBody.password
		}
	})
}
//小程序注册账号
export function wxampRegister(loginBody) {
	return request({
		url: '/campus/auth/wxampRegister',
		header: {
			isToken: false
		},
		method: 'post',
		data: loginBody
	})
}
