import request from '@/utils/request'

export function getActiveSignSessions(scene) {
	return request({
		url: '/api/sign/active',
		method: 'get',
		params: { scene: scene || undefined }
	})
}

export function getSignSessionDetail(sessionId) {
	return request({
		url: '/api/sign/session/' + sessionId,
		method: 'get'
	})
}

export function signByCode(sessionId, code) {
	return request({
		url: '/api/sign/code',
		method: 'post',
		params: { sessionId, code }
	})
}

export function signByQr(sessionId, token) {
	return request({
		url: '/api/sign/qr',
		method: 'post',
		params: { sessionId, token }
	})
}

export function signByLocation(sessionId, latitude, longitude, deviceInfo) {
	return request({
		url: '/api/sign/location',
		method: 'post',
		params: { sessionId, latitude, longitude, deviceInfo }
	})
}

export function getMySignRecords(params) {
	return request({
		url: '/api/sign/my/records',
		method: 'get',
		params
	})
}

// ========== 活动动态二维码签到 ==========
export function getActivityCheckinTicket(sessionId, ticket) {
	return request({
		url: '/api/sign/activity/ticket',
		method: 'get',
		params: { sessionId, ticket }
	})
}

export function signActivityByQr(sessionId, ticket) {
	return request({
		url: '/api/sign/activity/qr',
		method: 'post',
		params: { sessionId, ticket }
	})
}

export function signActivityByCode(sessionId, code) {
	return request({
		url: '/api/sign/activity/code',
		method: 'post',
		params: { sessionId, code }
	})
}

export function submitActivityAppeal(activityId, reason, evidence) {
	return request({
		url: '/api/sign/activity/appeal',
		method: 'post',
		params: { activityId, reason, evidence }
	})
}
