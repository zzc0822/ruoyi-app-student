import request from '@/utils/request'

export default {
    //获取用户信息
    getUserInfo() {
        return request({
            url: `/getInfo`,
            method: `get`
        })
    },
    //判断有没有绑定邮箱
    haveMail() {
        return request({
            url: "/campus/haveMail",
            method: `get`
        })
    },


    // 查询用户个人信息
    getUserProfile() {
        return request({
            url: '/system/user/profile',
            method: 'get'
        })
    },

    // 用户密码重置
    updateUserPwd(oldPassword, newPassword) {
        const data = {
            oldPassword,
            newPassword
        }
        return request({
            url: '/system/user/profile/updatePwd',
            method: 'put',
            params: data
        })
    },

    // 用户头像上传
    uploadAvatar(data) {
        return request({
            url: '/system/user/profile/avatar',
            method: 'post',
            data: data
        })
    },


    // 修改用户个人信息
    updateUserProfile(data) {
        return request({
            url: '/system/user/profile',
            method: 'put',
            data: data
        })
    },

    // 获取当前登录学生的详细信息
    getMyStudentInfo() {
        return request({
            url: '/api/stuinfo/myInfo',
            method: 'get'
        })
    },

    // 获取当前登录学生的统计数据
    getMyStats() {
        return request({
            url: '/api/stuinfo/myStats',
            method: 'get'
        })
    },

    // 随机获取一条网络思政金句
    getRandomQuote() {
        return request({
            url: '/api/work-stats/workquote/random',
            method: 'get'
        })
    },

    // 提交信息变更申请
    submitInfoChange(data) {
        return request({
            url: '/api/stuinfo/submitChange',
            method: 'post',
            data: data
        })
    },

    // 更新学生本人联系电话（同步记录历史电话）
    updatePhone(phone) {
        return request({
            url: '/api/stuinfo/updatePhone',
            method: 'post',
            data: { phone }
        })
    },

    // 查询我的变更申请
    getMyChangeRequests(params) {
        return request({
            url: '/api/stuinfo/myChangeRequests',
            method: 'get',
            params: params
        })
    },

    // 解绑微信
    unbindWx() {
        return request({
            url: '/api/user/unbind',
            method: 'post'
        })
    },

    // 获取我的银行卡列表
    getMyBankCards() {
        return request({
            url: '/api/stuinfo/myInfo/bankCard/list',
            method: 'get'
        })
    },

    // 新增我的银行卡
    addMyBankCard(data) {
        return request({
            url: '/api/stuinfo/myInfo/bankCard',
            method: 'post',
            data: data
        })
    },

    // 修改我的银行卡
    updateMyBankCard(data) {
        return request({
            url: '/api/stuinfo/myInfo/bankCard',
            method: 'put',
            data: data
        })
    },

    // 删除我的银行卡
    deleteMyBankCard(id) {
        return request({
            url: '/api/stuinfo/myInfo/bankCard/' + id,
            method: 'delete'
        })
    },

    // 设置默认银行卡
    setDefaultBankCard(id) {
        return request({
            url: '/api/stuinfo/myInfo/bankCard/setDefault/' + id,
            method: 'put'
        })
    },

}