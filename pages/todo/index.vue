<template>
  <view class="page-container">
    <!-- 筛选栏 -->
    <view class="filter-bar">
      <view 
        :class="['filter-item', currentFilter === 'all' ? 'active' : '']" 
        @click="currentFilter = 'all'"
      >
        <text>全部</text>
      </view>
      <view 
        :class="['filter-item', currentFilter === 'pending' ? 'active' : '']" 
        @click="currentFilter = 'pending'"
      >
        <text>未完成</text>
      </view>
      <view 
        :class="['filter-item', currentFilter === 'done' ? 'active' : '']" 
        @click="currentFilter = 'done'"
      >
        <text>已完成</text>
      </view>
    </view>

    <!-- 待办列表 -->
    <view class="todo-list" v-if="filteredTodos.length > 0">
      <view class="todo-item" v-for="(item, index) in filteredTodos" :key="index">
        <view class="todo-left">
          <view 
            :class="['todo-check', item.status === '1' ? 'checked' : '']"
            @click="toggleComplete(item)"
          >
            <u-icon v-if="item.status === '1'" name="checkmark" size="24" color="#fff"></u-icon>
          </view>
          <view class="todo-info">
            <text :class="['todo-title', item.status === '1' ? 'done' : '']">{{ item.title }}</text>
            <view class="todo-meta">
              <text class="todo-type-tag" v-if="item.todoType">{{ formatTodoType(item.todoType) }}</text>
              <text class="todo-time" v-if="item.deadline">{{ formatDeadline(item.deadline) }}</text>
            </view>
            <text class="todo-desc" v-if="item.description">{{ item.description }}</text>
          </view>
        </view>
        <view :class="['todo-urgency', 'urgency-' + (item.urgency || 'normal')]">
          <text>{{ formatUrgency(item.urgency) }}</text>
        </view>
      </view>
    </view>

    <!-- 空状态 -->
    <view class="empty-state" v-else>
      <text class="empty-icon">📋</text>
      <text class="empty-text">暂无待办事项</text>
      <text class="empty-tip">继续保持，今天没有待办任务</text>
    </view>
  </view>
</template>

<script>
import { listMyTodo, markRead } from '@/api/affair/todo'

export default {
  data() {
    return {
      todoList: [],
      currentFilter: 'all'
    }
  },
  computed: {
    filteredTodos() {
      if (this.currentFilter === 'pending') {
        return this.todoList.filter(t => t.status === '0')
      }
      if (this.currentFilter === 'done') {
        return this.todoList.filter(t => t.status === '1')
      }
      return this.todoList
    }
  },
  onShow() {
    this.loadTodos()
  },
  methods: {
    async loadTodos() {
      try {
        const res = await listMyTodo()
        if (res.data && res.data.code === 200) {
          this.todoList = res.data.data || []
        }
      } catch (error) {
        // 加载待办失败
      }
    },
    async toggleComplete(item) {
      if (item.status === '1') return
      try {
        // 标记已读即视为完成
        await markRead(item.id)
        item.status = '1'
        uni.showToast({ title: '已完成', icon: 'success' })
      } catch (error) {
        uni.showToast({ title: '操作失败', icon: 'none' })
      }
    },
    formatTodoType(type) {
      const map = {
        schedule: '日程', meeting: '会议', class_meeting: '班会',
        leave: '请假', talk_disciplinary: '违纪谈话', talk_daily: '日常谈心',
        classcheck_talk: '查课谈话', classcheck_confirm: '抽查确认'
      }
      return map[type] || type || '待办'
    },
    formatUrgency(val) {
      const map = { overdue: '已逾期', today: '今日', tomorrow: '明日', normal: '常规' }
      return map[val] || '常规'
    },
    formatDeadline(deadline) {
      if (!deadline) return ''
      const d = new Date(deadline)
      return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
    }
  }
}
</script>

<style scoped>
.page-container {
  min-height: 100vh;
  background: #f5f6f7;
  padding: 20rpx;
}

.filter-bar {
  display: flex;
  gap: 20rpx;
  margin-bottom: 24rpx;
  background: #fff;
  padding: 20rpx 30rpx;
  border-radius: 16rpx;
}

.filter-item {
  padding: 12rpx 28rpx;
  border-radius: 24rpx;
  font-size: 26rpx;
  color: #666;
  background: #f5f5f5;
}

.filter-item.active {
  background: #667eea;
  color: #fff;
}

.todo-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.todo-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  padding: 28rpx;
  border-radius: 16rpx;
}

.todo-left {
  display: flex;
  align-items: flex-start;
  gap: 20rpx;
  flex: 1;
}

.todo-check {
  width: 44rpx;
  height: 44rpx;
  border-radius: 50%;
  border: 3rpx solid #ddd;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 4rpx;
}

.todo-check.checked {
  background: #667eea;
  border-color: #667eea;
}

.todo-info {
  flex: 1;
}

.todo-title {
  font-size: 28rpx;
  color: #333;
  font-weight: 500;
  display: block;
  margin-bottom: 8rpx;
}

.todo-title.done {
  color: #999;
  text-decoration: line-through;
}

.todo-meta {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 8rpx;
}

.todo-type-tag {
  font-size: 20rpx;
  color: #667eea;
  background: rgba(102, 126, 234, 0.08);
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
}

.todo-time {
  font-size: 22rpx;
  color: #999;
}

.todo-desc {
  font-size: 24rpx;
  color: #888;
  display: block;
}

.todo-urgency {
  padding: 6rpx 16rpx;
  border-radius: 12rpx;
  font-size: 20rpx;
  flex-shrink: 0;
}

.urgency-today { background: #fff0f0; color: #e43d33; }
.urgency-overdue { background: #fff0f0; color: #ff4d4f; }
.urgency-tomorrow { background: #fff8e6; color: #f3a044; }
.urgency-normal { background: #f0f5ff; color: #2979ff; }

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 120rpx 0;
}

.empty-icon {
  font-size: 80rpx;
  margin-bottom: 24rpx;
}

.empty-text {
  font-size: 30rpx;
  color: #666;
  margin-bottom: 12rpx;
}

.empty-tip {
  font-size: 24rpx;
  color: #999;
}
</style>
