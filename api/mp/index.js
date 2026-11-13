import config from '@/config'
import { getToken } from '@/utils/auth'

function request(options) {
	return new Promise((resolve, reject) => {
		uni.request({
			url: config.baseURL + options.url,
			method: options.method || 'GET',
			data: options.data || {},
			header: Object.assign({
				'Content-Type': 'application/json'
			}, options.auth === false ? {} : { Authorization: 'Bearer ' + getToken() }),
			success: (res) => {
				const body = res.data || {}
				if (body.code === 200) {
					resolve(body)
				} else {
					reject(body)
				}
			},
			fail: reject
		})
	})
}

export function getMpConfig(appId) {
	return request({ url: '/api/mp/public/config/' + encodeURIComponent(appId), auth: false })
}

export function getCollegeSummary() {
	return request({ url: '/api/mp/data/summary' })
}

export function getCollegeDetail(type, limit) {
	return request({ url: '/api/mp/data/detail', data: { type, limit: limit || 20 } })
}

export function getMpAuthorizeUrl(appId, redirectUri) {
	return request({
		url: '/api/auth/wxMpAuthorizeUrl',
		data: { appId, redirectUri, state: 'mp' },
		auth: false
	})
}

export function wxMpLogin(code, appId) {
	return request({
		url: '/api/auth/wxMpLogin',
		method: 'POST',
		data: { code, appId },
		auth: false
	})
}
