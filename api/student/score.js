import request from '@/utils/request.js'

export function getScoreRecords(params) {
	return request({
		url: '/api/score/records',
		method: 'GET',
		data: params
	})
}

export function getScoreSummary() {
	return request({
		url: '/api/score/summary',
		method: 'GET'
	})
}
