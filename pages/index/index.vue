<template>
	<view class="home-container">
		<!-- 顶部欢迎区域 -->
		<view class="welcome-section">
			<view class="welcome-header">
				<view class="welcome-text">
					<text class="greeting">你好，{{ studentName || '同学' }} 👋</text>
					<text class="sub-text">开启今天的学习之旅</text>
				</view>
			</view>
			<view class="date-card">
				<text class="date-text">{{ currentDate }}</text>
			</view>
		</view>

		<!-- 功能列表 - 2行网格布局 -->
		<view class="function-section">
			<view class="section-header">
				<text class="section-title">快捷功能</text>
			</view>
			<view class="function-grid">
				<view class="function-item" @click="navigateTo('/pages/schedule/index')">
					<view class="function-icon schedule-icon">
						<u-icon name="calendar" size="48" color="#fff"></u-icon>
					</view>
					<text class="function-name">我的课表</text>
					<text class="function-desc">查看课程安排</text>
				</view>
				
				<view class="function-item" @click="navigateTo('/pages/leave/index')">
					<view class="function-icon leave-icon">
						<u-icon name="edit-pen" size="48" color="#fff"></u-icon>
					</view>
					<text class="function-name">我的请假</text>
					<text class="function-desc">在线提交申请</text>
				</view>
				
				<view class="function-item" @click="navigateTo('/pages/activity/index')">
					<view class="function-icon activity-icon">
						<u-icon name="star" size="48" color="#fff"></u-icon>
					</view>
					<text class="function-name">活动报名</text>
					<text class="function-desc">精彩活动不错过</text>
				</view>
				
				<view class="function-item" @click="navigateTo('/pages/attendance/index')">
					<view class="function-icon attendance-icon">
						<u-icon name="checkmark-circle" size="48" color="#fff"></u-icon>
					</view>
					<text class="function-name">出勤积分</text>
					<text class="function-desc">查看考勤记录</text>
				</view>
				
				<view class="function-item" @click="navigateTo('/pages/score/record')">
					<view class="function-icon score-icon">
						<u-icon name="pie-chart" size="48" color="#fff"></u-icon>
					</view>
					<text class="function-name">积分明细</text>
					<text class="function-desc">积分变动详情</text>
				</view>
				
				<view class="function-item" @click="navigateTo('/pages/offcampus/index')">
					<view class="function-icon offcampus-icon">
						<u-icon name="home" size="48" color="#fff"></u-icon>
					</view>
					<text class="function-name">外宿申请</text>
					<text class="function-desc">在线提交申请</text>
				</view>
				
				<view class="function-item" @click="navigateTo('/pages/sport/index')">
					<view class="function-icon sport-icon">
						<u-icon name="run" size="48" color="#fff"></u-icon>
					</view>
					<text class="function-name">运动健康</text>
					<text class="function-desc">步数打卡排名</text>
				</view>
				
				<view class="function-item" @click="navigateTo('/pages/certificate/index')">
					<view class="function-icon certificate-icon">
						<u-icon name="order" size="48" color="#fff"></u-icon>
					</view>
					<text class="function-name">我的证书</text>
					<text class="function-desc">查看荣誉证书</text>
				</view>
			</view>
		</view>

		<!-- 今日课表预览 -->
		<view class="today-schedule-preview" v-if="todayScheduleList.length > 0">
			<view class="section-header">
				<text class="section-title">今日课程 <text class="week-badge" v-if="currentWeek">第{{ currentWeek }}周</text></text>
				<view class="view-all" @click="navigateTo('/pages/schedule/index')">
					<text class="view-all-text">查看全部</text>
					<u-icon name="arrow-right" size="14" color="#667eea"></u-icon>
				</view>
			</view>
			<view class="schedule-list">
				<view 
					v-for="(schedule, index) in todayScheduleList.slice(0, 3)" 
					:key="index"
					class="schedule-item"
				>
					<view class="schedule-time">
						<text class="time-text">{{ getSectionTime(schedule.startSection) }}</text>
						<text class="section-text">{{ schedule.startSection }}-{{ schedule.endSection }}节</text>
					</view>
					<view class="schedule-content">
						<text class="course-name">{{ schedule.courseName || '未命名课程' }}</text>
						<text class="location-text">
							<u-icon name="map" size="12" color="#999"></u-icon>
							{{ schedule.classroom || '未安排教室' }}
						</text>
					</view>
				</view>
			</view>
		</view>

		<!-- 今日待办 -->
		<view class="today-todo-section" v-if="todayTodoList.length > 0">
			<view class="section-header">
				<text class="section-title">📝 今日待办</text>
				<text class="section-more" @click="navigateTo('/pages/todo/index')">全部 ({{ todayTodoList.length }})</text>
			</view>
			<view class="todo-list">
				<view class="todo-item" v-for="(item, index) in todayTodoList.slice(0, 5)" :key="index">
					<view :class="['todo-dot', 'dot-' + (item.urgency || 'normal')]"></view>
					<view class="todo-content">
						<text class="todo-text">{{ item.title }}</text>
						<text class="todo-type" v-if="item.todoType">{{ formatTodoType(item.todoType) }}</text>
					</view>
				</view>
			</view>
		</view>

		<!-- 校园墙内容 -->
		<view class="campus-wall">
			<view class="section-header">
				<text class="section-title">校园动态</text>
				<text class="section-more">查看全部</text>
			</view>
			
			<view v-if="categoryList!=null">
				<u-sticky bgColor="#fff">
					<u-tabs :list="categoryList" keyName="categoryName" @click="clickTabs"></u-tabs>
				</u-sticky>
			</view>

			<view class="wall-content">
				<u-loading-page :loading="loading"></u-loading-page>
				<view class="content-list">
					<view class="content-t">
						<scroll-list ref="contentObj" :option="option" @load="getContent" @refresh="refresh">
							<view class="content-box" v-for="(item, key) in contentObj" :key="key">
								<Content :contentObj="item" :loveContentIds="loveContentIds" @openPopup="openPopup">
								</Content>
							</view>
						</scroll-list>
					</view>
				</view>
			</view>
		</view>

		<!-- 拓展点击弹出层 -->
		<view>
			<ArrowDown :contentObj="popupData.contentObj" :show="popupData.show" :time="popupData.time"></ArrowDown>
		</view>
	</view>
</template>

<script>
	//api
	import touristApi from "@/api/tourist";
	import operateApi from "@/api/operate";
	import { getMySchedule, getCurrentInfo } from '@/api/activity/schedule'
	import { listMyTodo } from '@/api/affair/todo'
	import userInfoApi from '@/api/student/userInfo.js'

	import {
		isLogin
	} from "@/utils/auth";

	import {
		wxampLogin
	} from "@/utils/login.js"
	//引用组件
	import Content from "@/components/content/index";
	import ArrowDown from "@/components/content/ArrowDown";

	export default {
		components: {
			Content,
			ArrowDown
		},
		data() {
			return {
				// 当前日期
				currentDate: '',
				// 学生姓名
				studentName: '',
				// 当前周次
				currentWeek: null,
				// 今日课表预览
				todayScheduleList: [],
				// 今日待办
				todayTodoList: [],
				option: {
					page: 1,
					size: 5,
					auto: true,
					safeArea: true,
					offsetBottom: 150,
					loadingText: ''
				},
				//菜单分类
				categoryList: null,
				//墙内容
				contentObj: [],
				//点赞的墙列表
				loveContentIds: [],
				contentVo: {
					pageNum: 1,
					categoryId: null,
				},
				//是否加载
				loading: true,
				total: 0,
				//拓展弹出层
				popupData: {},
			};
		},

		//创建的时候自动调用
		onReady() {
			// 设置当前日期
			const now = new Date()
			const year = now.getFullYear()
			const month = String(now.getMonth() + 1).padStart(2, '0')
			const day = String(now.getDate()).padStart(2, '0')
			const weekDays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
			const weekDay = weekDays[now.getDay()]
			this.currentDate = `${year}年${month}月${day}日 ${weekDay}`
				
			if (isLogin()) {
				// #ifdef  MP-WEIXIN
				// wxampLogin();
				// #endif
				// 加载当前学期和周次
				this.loadCurrentInfo()
				// 加载今日课表预览
				this.loadTodaySchedule()
				// 加载学生信息
				this.loadStudentInfo()
				// 加载今日待办
				this.loadTodayTodo()
			}
		
			this.getAllCategorys();
			// this.getContent();
		},
		//创建后
		mounted() {
			// this.contentVo.categoryId = 0;
		},
		methods: {
			// 加载学生信息
			async loadStudentInfo() {
				try {
					const { data } = await userInfoApi.getMyStudentInfo()
					if (data.code === 200 && data.data) {
						this.studentName = data.data.studentName || data.data.xm || ''
					}
				} catch (error) {
					// 加载学生信息失败
				}
			},
			// 导航到指定页面
			navigateTo(url) {
				// tabBar 页面使用 switchTab，普通页面使用 navigateTo
				const tabBarPages = ['/pages/index/index', '/pages/me/me'];
				if (tabBarPages.includes(url)) {
					uni.switchTab({ url });
				} else {
					uni.navigateTo({ url });
				}
			},
			
			// 加载当前学期和周次信息
			async loadCurrentInfo() {
				try {
					const res = await getCurrentInfo()
					if (res.data && res.data.code === 200) {
						const info = res.data.data
						this.currentWeek = info.currentWeek || null
						this.currentSemesterId = info.semesterId || ''
						this.currentSemesterName = info.semesterName || ''
					}
				} catch (error) {
					// 静默处理
				}
			},
			// 加载今日课表预览
			async loadTodaySchedule() {
				try {
					const now = new Date()
					const weekday = now.getDay() === 0 ? 7 : now.getDay()
					
					// 先获取学期和周次信息
					let semester = ''
					let weekNumber = null
					try {
						const infoRes = await getCurrentInfo()
						if (infoRes.data && infoRes.data.code === 200) {
							const info = infoRes.data.data
							semester = info.semesterId || ''
							weekNumber = info.currentWeek || null
						}
					} catch (e) {
						// 静默处理
					}
					
					// 使用个人课表接口查询今日课程
					const res = await getMySchedule({ weekday, semester, weekNumber })
					if (res.data && res.data.code === 200) {
						this.todayScheduleList = res.data.data || []
					}
				} catch (error) {
					// 认证失败时静默处理
				}
			},
			// 加载今日待办
			async loadTodayTodo() {
				try {
					const res = await listMyTodo()
					if (res.data && res.data.code === 200) {
						const todos = res.data.data || []
						this.todayTodoList = todos.filter(t => 
							t.status === '0' && (t.urgency === 'today' || t.urgency === 'overdue' || t.urgency === 'tomorrow')
						)
					}
				} catch (error) {
					// 认证失败时静默处理
				}
			},
			// 格式化待办类型
			formatTodoType(type) {
				const map = {
					schedule: '日程', meeting: '会议', class_meeting: '班会',
					leave: '请假', talk_disciplinary: '违纪谈话', talk_daily: '日常谈心',
					classcheck_talk: '查课谈话', classcheck_confirm: '抽查确认'
				}
				return map[type] || type || '待办'
			},
			
			// 根据节次获取时间
			getSectionTime(startSection) {
				const timeMap = {
					1: '08:00',
					2: '08:50',
					3: '10:00',
					4: '10:50',
					5: '14:00',
					6: '14:50',
					7: '16:00',
					8: '16:50',
					9: '19:00',
					10: '19:50'
				}
				return timeMap[startSection] || '08:00'
			},
				
			clickTabs(item) {
				this.contentVo.categoryId = item.categoryId;
				this.refresh();
			},
			//获取全部分类
			getAllCategorys() {
				touristApi
					.getCategoryList()
					.then((response) => {
						this.categoryList = [];
						const categories = response.data.data
						if (Array.isArray(categories)) {
							for (let item of categories) {
								if (item.parentId != "0" || item.type == "Y") {
									this.categoryList.push(item);
								}
							}
						}
					})
					.catch();
			},
			//获取所有内容(加载数据)
			getContent(paging) {
				this.contentVo.pageNum = paging.page;

				touristApi
					.getContent(this.contentVo)
					.then(({
						data
					}) => {
						for (var i of data.rows) {
							this.contentObj.push(i)
						};
						this.total = parseInt(data.total);
						this.loveContentIds = data.loveContentIds;
						this.loading = false;

						this.$refs.contentObj.loadSuccess({
							list: this.contentObj,
							total: this.total
						});
					})
					.catch(({
						...error
					}) => {
						this.loading = false;
						this.$refs.contentObj.loadFail()
					});

			},
			//下拉刷新数据
			refresh(paging) {
				this.contentVo.pageNum = 1;

				touristApi
					.getContent(this.contentVo)
					.then(({
						data
					}) => {
						this.contentObj = data.rows;
						this.total = parseInt(data.total);
						this.loveContentIds = data.loveContentIds;

						this.$refs.contentObj.refreshSuccess({
							list: this.contentObj,
							total: this.total
						});
					})
					.catch(({
						...error
					}) => {
						this.$refs.contentObj.loadFail()
					});

			},
			//打开拓展弹出层
			openPopup(data) {
				this.popupData = data;
			}

		},
	};
</script>

<style scoped>
.home-container {
	min-height: 100vh;
	background: #f5f6f7;
}

.welcome-section {
	background: linear-gradient(135deg, #2979ff, #1a5cd8);
	padding: 120rpx 40rpx 100rpx;
	position: relative;
	overflow: hidden;
}

.welcome-section::before {
	content: '';
	position: absolute;
	top: -50%;
	right: -20%;
	width: 400rpx;
	height: 400rpx;
	background: rgba(255, 255, 255, 0.1);
	border-radius: 50%;
}

.welcome-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	position: relative;
	z-index: 1;
}

.greeting {
	font-size: 48rpx;
	font-weight: bold;
	color: #fff;
	display: block;
	margin-bottom: 12rpx;
}

.sub-text {
	font-size: 24rpx;
	color: rgba(255, 255, 255, 0.9);
	display: block;
}

.date-card {
	margin-top: 30rpx;
	background: rgba(255, 255, 255, 0.2);
	backdrop-filter: blur(10rpx);
	
	padding: 20rpx 30rpx;
	display: inline-block;
	position: relative;
	z-index: 1;
}

.date-text {
	font-size: 26rpx;
	color: #fff;
	font-weight: 500;
}

.function-section {
	background: #fff;
	margin: 0 24rpx 20rpx;
	border-radius: 20rpx;
	padding: 30rpx;
	
}

.section-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 20rpx;
}

.section-title {
	font-size: 30rpx;
	font-weight: bold;
	color: #333;
}

.section-more {
	font-size: 24rpx;
	color: #999;
}

.function-grid {
	display: grid;
	grid-template-columns: repeat(4, 1fr);
	gap: 20rpx;
}

.function-item {
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 16rpx 0;
	
	transition: all 0.3s ease;
}

.function-item:active {
	
	transform: scale(0.95);
}

.function-icon {
	width: 96rpx;
	height: 96rpx;
	border-radius: 20rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	box-shadow: 0 6rpx 16rpx rgba(0, 0, 0, 0.15);
	margin-bottom: 12rpx;
}

.schedule-icon {
	background: linear-gradient(135deg, #2979ff 0%, #5ba3ff 100%);
}

.leave-icon {
	background: linear-gradient(135deg, #f3a044 0%, #ffc870 100%);
}

.activity-icon {
	background: linear-gradient(135deg, #18bc37 0%, #4cd964 100%);
}

.attendance-icon {
	background: linear-gradient(135deg, #e43d33 0%, #ff6b6b 100%);
}

.score-icon {
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.sport-icon {
	background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.offcampus-icon {
	background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.certificate-icon {
	background: linear-gradient(135deg, #ffd700 0%, #ffaa00 100%);
}

.function-name {
	font-size: 24rpx;
	color: #333;
	
	text-align: center;
	
}

.function-desc {
	display: none;
	font-size: 22rpx;
	color: #999;
	text-align: center;
}

.today-schedule-preview {
	background: #fff;
	margin: 0 30rpx 30rpx;
	border-radius: 20rpx;
	padding: 30rpx;
	
}

.view-all {
	display: flex;
	align-items: center;
	gap: 4rpx;
}

.view-all-text {
	font-size: 24rpx;
	color: #667eea;
}

.schedule-list {
	display: flex;
	flex-direction: column;
	gap: 24rpx;
}

.schedule-item {
	display: flex;
	gap: 24rpx;
	padding: 24rpx;
	background: linear-gradient(135deg, #f5f7fa 0%, #fff 100%);
	
	border: 2rpx solid #e5e7eb;
}

.schedule-time {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	min-width: 96rpx;
	padding: 16rpx;
	background: linear-gradient(135deg, #2979ff 0%, #5ba3ff 100%);
	border-radius: 12rpx;
}

.time-text {
	font-size: 26rpx;
	color: #fff;
	font-weight: bold;
	margin-bottom: 4rpx;
}

.section-text {
	font-size: 20rpx;
	color: rgba(255, 255, 255, 0.9);
}

.schedule-content {
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: 12rpx;
}

.course-name {
	font-size: 24rpx;
	color: #333;
	font-weight: bold;
}

.location-text {
	display: flex;
	align-items: center;
	gap: 6rpx;
	font-size: 24rpx;
	color: #666;
}

/* 周次角标 */
.week-badge {
	font-size: 22rpx;
	color: #667eea;
	background: rgba(102, 126, 234, 0.1);
	padding: 4rpx 12rpx;
	border-radius: 10rpx;
	margin-left: 12rpx;
	font-weight: normal;
}

/* 今日待办 */
.today-todo-section {
	background: #fff;
	margin: 0 30rpx 30rpx;
	border-radius: 20rpx;
	padding: 30rpx;
}

.todo-list {
	display: flex;
	flex-direction: column;
	gap: 20rpx;
}

.todo-item {
	display: flex;
	align-items: center;
	gap: 16rpx;
	padding: 16rpx 20rpx;
	background: linear-gradient(135deg, #f5f7fa 0%, #fff 100%);
	border-radius: 12rpx;
	border: 1rpx solid #eef0f3;
}

.todo-dot {
	width: 14rpx;
	height: 14rpx;
	border-radius: 50%;
	flex-shrink: 0;
}

.dot-today { background: #e43d33; }
.dot-overdue { background: #ff4d4f; }
.dot-tomorrow { background: #f3a044; }
.dot-normal { background: #2979ff; }

.todo-content {
	flex: 1;
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12rpx;
}

.todo-text {
	font-size: 26rpx;
	color: #333;
	flex: 1;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.todo-type {
	font-size: 20rpx;
	color: #667eea;
	background: rgba(102, 126, 234, 0.08);
	padding: 4rpx 12rpx;
	border-radius: 8rpx;
	flex-shrink: 0;
}

.campus-wall {
	background: #fff;
	margin: 0 30rpx 30rpx;
	border-radius: 20rpx;
	overflow: hidden;
	
}

.wall-content {
	padding: 16rpx 0;
}

.content-list {
	width: 100%;
}

.content-box {
	margin: 0 0 25rpx 0;
	padding: 30rpx;
	background-color: #fff;
	box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
	
	border: 1rpx solid #f0f0f0;
}

.tag-group {
	text-align: center;
}

.clickable {
	margin-top: 10rpx;
	cursor: pointer;
}

.content-t {
	width: 100%;
}
</style>