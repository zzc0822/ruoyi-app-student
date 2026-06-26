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

// 添加请求拦截器
instance.interceptors.request.use(
	config => {
		// 在发送请求前做些什么
		const isToken = config.header['isToken'] === false
		if (getToken() && !isToken) {
			config.header['Authorization'] = 'Bearer ' + getToken()
		}
		return config
	},
	error => {
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
		// 登录类接口（isLoginApi）不拦截 401，由调用方自行处理
		const isLoginApi = response.config && response.config.header && response.config.header['isLoginApi'] === true;
		if (code == 401 && !isLoginApi) {
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
		// 对响应错误做些什么
		uni.showToast({
			icon: 'error',
			title: '后端接口响应异常'
		})
		// console.log('响应错误后', error)
		return Promise.reject(error)
	}
)

export default instance
