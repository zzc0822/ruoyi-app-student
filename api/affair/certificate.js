import request from '@/utils/request'

/**
 * 学生证书API（学生端小程序）
 */

// 获取我的证书列表
export function getMyCertificates(certType) {
  return request({
    url: '/api/certificate/my',
    method: 'get',
    params: certType ? { certType } : {}
  })
}

// 证书详情
export function getCertificateDetail(id) {
  return request({
    url: '/api/certificate/' + id,
    method: 'get'
  })
}
