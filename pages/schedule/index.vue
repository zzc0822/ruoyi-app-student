<template>
  <view class="schedule-container">
    <!-- 顶部信息 -->
    <view class="header-card">
      <view class="header-top">
        <view class="semester-badge">
          <text class="semester-text">{{ currentSemester }}</text>
        </view>
        <view class="week-badge">
          <text class="week-text">第 {{ currentWeek }} 周</text>
        </view>
      </view>
    </view>

    <!-- 课表表格 -->
    <view class="table-wrapper">
      <view v-if="loading" class="loading-state">
        <text>加载中...</text>
      </view>

      <view v-else class="table-scroll">
        <!-- 表头：节次 + 周一到周日 -->
        <view class="table-row table-header">
          <view class="table-cell cell-section">节次</view>
          <view 
            v-for="(day, index) in weekDays" 
            :key="index"
            class="table-cell cell-day"
            :class="{ today: isToday(index + 1) }"
          >
            <text class="day-name">{{ day }}</text>
            <text class="day-date">{{ getWeekdayDate(index + 1) }}</text>
          </view>
        </view>

        <!-- 每一节的课程 -->
        <view 
          v-for="section in sectionList" 
          :key="section.id"
          class="table-row table-body"
        >
          <view class="table-cell cell-section">
            <text class="section-num">{{ section.label }}</text>
            <text class="section-time">{{ section.time }}</text>
          </view>
          <view 
            v-for="(day, dayIndex) in weekDays" 
            :key="dayIndex"
            class="table-cell cell-course"
            :class="{ today: isToday(dayIndex + 1) }"
            @click="onCourseClick(getCourse(dayIndex + 1, section.start, section.end))"
          >
            <view 
              v-if="getCourse(dayIndex + 1, section.start, section.end)"
              class="course-block"
              :style="{ backgroundColor: getCourseColor(getCourse(dayIndex + 1, section.start, section.end).courseName) }"
            >
              <text class="course-name">{{ getCourse(dayIndex + 1, section.start, section.end).courseName }}</text>
              <text class="course-teacher">{{ getCourse(dayIndex + 1, section.start, section.end).teacherName }}</text>
              <text class="course-room">{{ getCourse(dayIndex + 1, section.start, section.end).classroom }}</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 课程详情弹窗 -->
    <view v-if="selectedCourse" class="course-popup" @click="selectedCourse = null">
      <view class="popup-content" @click.stop>
        <view class="popup-header" :style="{ backgroundColor: getCourseColor(selectedCourse.courseName) }">
          <text class="popup-title">{{ selectedCourse.courseName }}</text>
        </view>
        <view class="popup-body">
          <view class="popup-row">
            <text class="popup-label">教师</text>
            <text class="popup-value">{{ selectedCourse.teacherName }}</text>
          </view>
          <view class="popup-row">
            <text class="popup-label">教室</text>
            <text class="popup-value">{{ selectedCourse.classroom || '未安排' }}</text>
          </view>
          <view class="popup-row">
            <text class="popup-label">时间</text>
            <text class="popup-value">第{{ selectedCourse.startSection }}-{{ selectedCourse.endSection }}节</text>
          </view>
          <view class="popup-row">
            <text class="popup-label">星期</text>
            <text class="popup-value">{{ weekDays[selectedCourse.weekday - 1] }}</text>
          </view>
          <view v-if="selectedCourse.weekRange" class="popup-row">
            <text class="popup-label">周次</text>
            <text class="popup-value">{{ selectedCourse.weekRange }}</text>
          </view>
        </view>
        <view class="popup-close" @click="selectedCourse = null">
          <text>关闭</text>
        </view>
      </view>
    </view>

    <!-- 底部操作 -->
    <view class="bottom-actions">
      <view class="action-btn" @click="showSemester = true">
        <text>{{ currentSemester }}</text>
      </view>
      <view class="action-btn" @click="showWeek = true">
        <text>第{{ currentWeek }}周</text>
      </view>
    </view>

    <!-- 选择器 -->
    <u-picker
      :show="showSemester"
      :columns="semesterColumns"
      @confirm="onSemesterConfirm"
      @cancel="showSemester = false"
    ></u-picker>
    <u-picker
      :show="showWeek"
      :columns="weekColumns"
      @confirm="onWeekConfirm"
      @cancel="showWeek = false"
    ></u-picker>

    <!-- 今日待办浮层 -->
    <view class="todo-float" v-if="todayTodoList.length > 0" @click="goTodoPage">
      <view class="todo-float-header">
        <text class="todo-float-title">📝 今日待办</text>
        <text class="todo-float-count">{{ todayTodoList.length }}项</text>
      </view>
      <view class="todo-float-list">
        <view class="todo-float-item" v-for="(item, index) in todayTodoList.slice(0, 3)" :key="index">
          <view :class="['todo-float-dot', 'dot-' + (item.urgency || 'normal')]"></view>
          <text class="todo-float-text">{{ item.title }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { getMySchedule, getCurrentInfo } from '@/api/activity/schedule'
import { listMyTodo } from '@/api/affair/todo'

export default {
  data() {
    return {
      weekDays: ['一', '二', '三', '四', '五', '六', '日'],
      currentSemester: '',
      currentSemesterId: '',
      currentWeek: 1,
      allSchedules: [],
      loading: true,
      selectedCourse: null,

      showSemester: false,
      showWeek: false,
      semesterColumns: [[]],
      weekColumns: [[]],

      // 今日待办
      todayTodoList: [],

      sectionList: [
        { id: 1, label: '1-2', start: 1, end: 2, time: '08:00' },
        { id: 2, label: '3-4', start: 3, end: 4, time: '10:00' },
        { id: 3, label: '5-6', start: 5, end: 6, time: '14:00' },
        { id: 4, label: '7-8', start: 7, end: 8, time: '16:00' },
        { id: 5, label: '9-10', start: 9, end: 10, time: '19:00' }
      ],

      courseColors: [
        '#5B8FF9', '#5AD8A6', '#F6BD16', '#E86452',
        '#6DC8EC', '#945FB9', '#FF9845', '#1E9493',
        '#FF99C3', '#54B9BC'
      ],
      colorMap: {},

      semesterList: [
        '2025-2026学年第二学期'
      ]
    }
  },

  async onLoad() {
    // 从后端获取当前学期和周次（基于校历计算）
    await this.loadCurrentInfo()
    // 加载课表
    this.loadSchedule()
    // 加载今日待办
    this.loadTodayTodo()
  },

  methods: {
    // 加载当前学期和周次信息
    async loadCurrentInfo() {
      try {
        const res = await getCurrentInfo()
        if (res.data && res.data.code === 200) {
          const info = res.data.data
          this.currentSemesterId = info.semesterId || ''
          this.currentSemester = info.semesterName || this.semesterList[0]
          this.currentWeek = info.currentWeek || 1
        } else {
          // 回退默认值
          this.currentSemester = this.semesterList[0]
          this.currentWeek = 1
        }
      } catch (error) {
        // 获取学期信息失败
        this.currentSemester = this.semesterList[0]
        this.currentWeek = 1
      }
      // 更新选择器选项
      this.semesterColumns = [this.semesterList]
      const weeks = Array.from({ length: 20 }, (_, i) => `第${i + 1}周`)
      this.weekColumns = [weeks]
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
        // 认证失败时静默处理，不打印错误
      }
    },

    // 跳转到待办页面
    goTodoPage() {
      uni.navigateTo({ url: '/pages/todo/index' })
    },
    getWeekdayDate(weekday) {
      const now = new Date()
      const currentDay = now.getDay()
      const diff = weekday - (currentDay === 0 ? 7 : currentDay)
      const targetDate = new Date(now.getTime() + diff * 24 * 60 * 60 * 1000)
      return `${targetDate.getMonth() + 1}/${targetDate.getDate()}`
    },

    isToday(weekday) {
      const now = new Date()
      const currentDay = now.getDay()
      const todayWeekday = currentDay === 0 ? 7 : currentDay
      return weekday === todayWeekday
    },

    getCourse(weekday, startSection, endSection) {
      return this.allSchedules.find(s => {
        return s.weekday == weekday &&
               s.startSection <= endSection &&
               s.endSection >= startSection
      })
    },

    getCourseColor(courseName) {
      if (!courseName) return this.courseColors[0]
      if (!this.colorMap[courseName]) {
        const idx = Object.keys(this.colorMap).length % this.courseColors.length
        this.colorMap[courseName] = this.courseColors[idx]
      }
      return this.colorMap[courseName]
    },

    onCourseClick(course) {
      if (course) this.selectedCourse = course
    },

    async loadSchedule() {
      this.loading = true
      try {
        const res = await getMySchedule({
          semester: this.currentSemesterId || this.currentSemester,
          weekNumber: this.currentWeek
        })

        if (res.data && res.data.code === 200) {
          this.allSchedules = res.data.data || []
        } else if (res.data && res.data.code === 401) {
          // 认证失败，不显示错误，拦截器会处理跳转登录
        } else {
          uni.showToast({ title: res.msg || '加载失败', icon: 'none' })
        }
      } catch (error) {
        // 认证失败时静默处理
      } finally {
        this.loading = false
      }
    },

    onSemesterConfirm(e) {
      this.currentSemester = e.value[0]
      this.showSemester = false
      this.loadSchedule()
    },

    onWeekConfirm(e) {
      const weekText = e.value[0]
      this.currentWeek = parseInt(weekText.replace('第', '').replace('周', ''))
      this.showWeek = false
      this.loadSchedule()
    }
  }
}
</script>

<style scoped>
.schedule-container {
  min-height: 100vh;
  background: #f5f7fa;
  padding-bottom: 120rpx;
}

.header-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 30rpx;
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.semester-badge, .week-badge {
  background: rgba(255, 255, 255, 0.2);
  padding: 10rpx 24rpx;
  border-radius: 20rpx;
}

.semester-text, .week-text {
  font-size: 26rpx;
  color: #fff;
  font-weight: 500;
}

.table-wrapper {
  padding: 20rpx;
}

.loading-state {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 100rpx 0;
  color: #999;
}

.table-scroll {
  background: #fff;
  border-radius: 16rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
}

.table-row {
  display: flex;
  border-bottom: 1rpx solid #eef0f3;
}

.table-row:last-child {
  border-bottom: none;
}

.table-cell {
  flex: 1;
  border-right: 1rpx solid #eef0f3;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 12rpx 4rpx;
  min-height: 100rpx;
}

.table-cell:last-child {
  border-right: none;
}

/* 表头 */
.table-header {
  background: #f8f9fb;
  position: sticky;
  top: 0;
  z-index: 10;
}

.table-header .table-cell {
  min-height: 70rpx;
  padding: 16rpx 4rpx;
}

.cell-section {
  flex: 0 0 100rpx !important;
  width: 100rpx;
}

.cell-day {
  min-width: 0;
}

.day-name {
  font-size: 24rpx;
  color: #333;
  font-weight: bold;
}

.day-date {
  font-size: 20rpx;
  color: #999;
  margin-top: 4rpx;
}

.table-header .today {
  background: rgba(102, 126, 234, 0.1);
}

.table-header .today .day-name {
  color: #667eea;
}

/* 节次列 */
.section-num {
  font-size: 24rpx;
  color: #333;
  font-weight: bold;
}

.section-time {
  font-size: 18rpx;
  color: #aaa;
  margin-top: 4rpx;
}

/* 课程格 */
.cell-course {
  min-width: 0;
  padding: 4rpx;
}

.cell-course.today {
  background: rgba(102, 126, 234, 0.03);
}

.course-block {
  width: 100%;
  height: 100%;
  min-height: 88rpx;
  border-radius: 8rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 8rpx 4rpx;
  overflow: hidden;
}

.course-name {
  font-size: 20rpx;
  color: #fff;
  font-weight: bold;
  text-align: center;
  word-break: break-all;
  line-height: 1.3;
}

.course-teacher {
  font-size: 18rpx;
  color: rgba(255, 255, 255, 0.85);
  margin-top: 4rpx;
}

.course-room {
  font-size: 16rpx;
  color: rgba(255, 255, 255, 0.7);
  margin-top: 2rpx;
}

/* 弹窗 */
.course-popup {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.popup-content {
  width: 580rpx;
  background: #fff;
  border-radius: 24rpx;
  overflow: hidden;
}

.popup-header {
  padding: 40rpx 30rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.popup-title {
  font-size: 34rpx;
  color: #fff;
  font-weight: bold;
}

.popup-body {
  padding: 30rpx;
}

.popup-row {
  display: flex;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.popup-row:last-child {
  border-bottom: none;
}

.popup-label {
  width: 120rpx;
  font-size: 28rpx;
  color: #999;
}

.popup-value {
  flex: 1;
  font-size: 28rpx;
  color: #333;
}

.popup-close {
  padding: 30rpx;
  text-align: center;
  border-top: 1rpx solid #f0f0f0;
  font-size: 30rpx;
  color: #667eea;
}

/* 底部操作 */
.bottom-actions {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  background: #fff;
  border-top: 1rpx solid #eee;
  z-index: 100;
}

.action-btn {
  flex: 1;
  padding: 24rpx;
  text-align: center;
  font-size: 26rpx;
  color: #667eea;
  font-weight: 500;
}

.action-btn:active {
  background: #f5f7fa;
}

/* 今日待办浮层 */
.todo-float {
  position: fixed;
  bottom: 120rpx;
  right: 24rpx;
  background: #fff;
  border-radius: 20rpx;
  padding: 24rpx;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.12);
  width: 400rpx;
  z-index: 50;
}

.todo-float-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}

.todo-float-title {
  font-size: 26rpx;
  font-weight: bold;
  color: #333;
}

.todo-float-count {
  font-size: 22rpx;
  color: #667eea;
  background: rgba(102, 126, 234, 0.1);
  padding: 4rpx 12rpx;
  border-radius: 10rpx;
}

.todo-float-list {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.todo-float-item {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.todo-float-dot {
  width: 12rpx;
  height: 12rpx;
  border-radius: 50%;
  flex-shrink: 0;
}

.dot-today { background: #e43d33; }
.dot-overdue { background: #ff4d4f; }
.dot-tomorrow { background: #f3a044; }
.dot-normal { background: #2979ff; }

.todo-float-text {
  font-size: 24rpx;
  color: #555;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
