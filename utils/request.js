import ajax from '@/uni_modules/u-ajax'
import {
	getToken,
	removeToken
} from '@/utils/auth'

import {
	toast
} from '@/utils/common'
import config from '@/config'

const baseUrl = config.baseURL
// 创建请求实例
const instance = ajax.create({
	// 默认配置
	baseURL: baseUrl,

})

// 登录接口标记：登录API调用时设为true，响应拦截器据此跳过401拦截
let _isLoginApiRequest = false;

// 添加请求拦截器
instance.interceptors.request.use(
	config => {
		// 在发送请求前做些什么
		const isToken = config.header['isToken'] === false
		if (getToken() && !isToken) {
			config.header['Authorization'] = 'Bearer ' + getToken()
		}
		// 标记登录类请求，响应拦截器不拦截其401
		_isLoginApiRequest = config.header['isLoginApi'] === true
		return config
	},
	error => {
		_isLoginApiRequest = false
		uni.showToast({
			icon: 'error',
			title: '后端接口请求异常'
		})
		return Promise.reject(error)
	}
)

// 添加响应拦截器
instance.interceptors.response.use(
	//响应成功后
	response => {
		const code = response.data.code || 200;
		const msg = response.data.msg
		const wasLoginApi = _isLoginApiRequest
		_isLoginApiRequest = false
		// 登录类接口的响应全部直接返回，由调用方自行处理（不拦截401/40004/其他错误码）
		if (wasLoginApi) {
			return response
		}
		if (code == 401) {
			const hadToken = getToken();
			removeToken();
			// 统一跳转到登录页，确保所有页面都需要登录
			uni.reLaunch({
				url: '/pages/login/wxLogin'
			});
			if (hadToken) {
				toast('登录状态已过期，请重新登录');
			}
			return Promise.reject(msg || "未登录")
		} else if (code == 500) {
			toast(msg)
			return Promise.reject(msg)
		} else if (code == 40004) {
			// 教师账号拦截：用showModal，确保用户能看清
			uni.showModal({
				title: '提示',
				content: msg || '该手机号已注册为教师账号',
				showCancel: false,
				confirmText: '我知道了'
			});
			return Promise.reject(msg)
		} else if (code !== 200) {
			toast(msg)
			return Promise.reject(msg)
		}
		return response
	},
	error => {
		_isLoginApiRequest = false
		// 对响应错误做些什么
		uni.showToast({
			icon: 'error',
			title: '后端接口响应异常'
		})
		return Promise.reject(error)
	}
)

export default instance
