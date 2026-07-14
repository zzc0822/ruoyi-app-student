import request from '@/utils/request'

// 绑定邮箱验证
export function bindMail(data) {
	return request({
		url: '/campus/auth/bindMail',
		method: 'post',
		data: data
	})
}

// 邮箱验证
export function emailValidate(uuid) {
	return request({
		url: '/campus/email-validate',
		method: 'get',
		params: { uuid }
	})
}

// 校验用户名称是否唯一
export function checkUserNameUnique(userName) {
	return request({
		url: '/campus/auth/userNameUnique',
		header: { isToken: false },
		method: 'get',
		params: { userName }
	})
}

// 校验邮箱是否唯一
export function checkEmailUnique(email) {
	return request({
		url: '/campus/auth/emailUnique',
		header: { isToken: false },
		method: 'get',
		params: { email }
	})
}

// 小程序绑定账号
export function wxampBind(loginBody) {
	return request({
		url: '/wxBind',
		header: { isToken: false },
		method: 'POST',
		data: {
			code: loginBody.code,
			username: loginBody.username,
			password: loginBody.password
		}
	})
}

// 小程序注册账号
export function wxampRegister(loginBody) {
	return request({
		url: '/campus/auth/wxampRegister',
		header: { isToken: false },
		method: 'post',
		data: loginBody
	})
}

// 注册方法
export function register(data) {
	return request({
		url: '/register',
		header: { isToken: false },
		method: 'post',
		data: data
	})
}
