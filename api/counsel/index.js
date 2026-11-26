import request from '@/utils/request'

// 可预约的服务项目
export function getCounselServices() {
	return request({
		url: '/api/counsel/services',
		method: 'get'
	})
}

// 未来可约时段
export function getCounselSlots(query) {
	return request({
		url: '/api/counsel/slots',
		method: 'get',
		params: query
	})
}

// 提交预约
export function createCounselAppointment(data) {
	return request({
		url: '/api/counsel/appointments',
		method: 'post',
		data: data
	})
}

// 我的预约
export function getMyCounselAppointments(query) {
	return request({
		url: '/api/counsel/appointments/my',
		method: 'get',
		params: query
	})
}

// 预约详情
export function getCounselAppointment(id) {
	return request({
		url: '/api/counsel/appointments/' + id,
		method: 'get'
	})
}

// 取消预约
export function cancelCounselAppointment(id, reason) {
	return request({
		url: '/api/counsel/appointments/' + id + '/cancel',
		method: 'post',
		data: { reason: reason || '' }
	})
}

// 协同摘要授权状态
export function getCounselCollabConsent(id) {
	return request({
		url: '/api/counsel/appointments/' + id + '/collab-consent',
		method: 'get'
	})
}

// 授权或撤回辅导员查看协同摘要
export function updateCounselCollabConsent(id, granted) {
	return request({
		url: '/api/counsel/appointments/' + id + '/collab-consent',
		method: 'post',
		data: { granted: !!granted }
	})
}

// 我的预约消息
export function getCounselNotifications(limit) {
	return request({
		url: '/api/counsel/notifications',
		method: 'get',
		params: { limit: limit || 20 }
	})
}

// 未读消息数
export function getCounselUnreadCount() {
	return request({
		url: '/api/counsel/notifications/unread-count',
		method: 'get'
	})
}

// 标记单条已读
export function markCounselNotificationRead(id) {
	return request({
		url: '/api/counsel/notifications/' + id + '/read',
		method: 'put'
	})
}

// 全部标记已读
export function markAllCounselNotificationsRead() {
	return request({
		url: '/api/counsel/notifications/read-all',
		method: 'put'
	})
}
