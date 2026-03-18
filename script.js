// ==================== Firebase 配置 ====================
const firebaseConfig = {
    apiKey: "AIzaSyAv4cVMOGAUHa1km02eLL0VfG8UHCdzELo",
    authDomain: "love-app-12345.firebaseapp.com",
    databaseURL: "https://love-app-12345-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "love-app-12345",
    storageBucket: "love-app-12345.firebasestorage.app",
    messagingSenderId: "769508228824",
    appId: "1:769508228824:web:48e4502e8b6d7ad7e761ad",
    measurementId: "G-S9CXQD2ZGH"
};

// 初始化 Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// ==================== 全局变量 ====================
let currentUser = null;
let currentDate = new Date();
let statsChart = null;
const TOGETHER_DATE = new Date('2023-06-21');
const EXAM_DATE = new Date('2026-12-20');

// ==================== 用户信息更新 ====================
function updateUserProfile() {
    const userName = currentUser === 'huanghuang' ? '璠璠' : '渲渲';
    const userEmoji = currentUser === 'huanghuang' ? '😸' : '😽';
    
    document.getElementById('userNameDisplay').textContent = userName;
    document.getElementById('userAvatarDisplay').textContent = userEmoji;
    document.getElementById('greetingName').textContent = userName;
    document.getElementById('currentUser').textContent = userName;
}

// ==================== 初始化应用 ====================
document.addEventListener('DOMContentLoaded', function() {
    console.log('应用初始化中...');
    
    // 检查是否已选择用户
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = savedUser;
        showMainApp();
    } else {
        showLoginModal();
    }
    
    // 绑定事件监听器
    bindEventListeners();
    
    // 更新用户信息
    updateUserProfile();
});

// ==================== 事件绑定 ====================
function bindEventListeners() {
    // 身份选择按钮
    const identityBtns = document.querySelectorAll('.identity-btn');
    identityBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const user = this.getAttribute('data-user');
            selectUser(user);
        });
    });
    
    // 导航链接
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const page = this.getAttribute('data-page');
            navigateToPage(page);
        });
    });
    
    // 汉堡菜单
    const hamburger = document.getElementById('hamburger');
    if (hamburger) {
        hamburger.addEventListener('click', function() {
            const navMenu = document.getElementById('navMenu');
            this.classList.toggle('active');
            navMenu.classList.toggle('active');
        });
    }
    
    // 切换用户按钮
    const switchUserBtn = document.getElementById('switchUserBtn');
    if (switchUserBtn) {
        switchUserBtn.addEventListener('click', logout);
    }
    
    // 首页"我想你了"按钮
    const missYouBtn = document.getElementById('missYouBtn');
    if (missYouBtn) {
        missYouBtn.addEventListener('click', recordMissYou);
    }
    
    // 日历导航
    document.getElementById('prevMonth')?.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
    });
    
    document.getElementById('nextMonth')?.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
    });
    
    // 我想你日历导航
    document.getElementById('missPrevMonth')?.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderMissCalendar();
    });
    
    document.getElementById('missNextMonth')?.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderMissCalendar();
    });
}

// ==================== 用户管理 ====================
function selectUser(user) {
    currentUser = user;
    localStorage.setItem('currentUser', user);
    showMainApp();
    updateUserProfile();
}

function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    // 清空活跃打卡
    if (window.activeCheckIns) {
        Object.values(window.activeCheckIns).forEach(checkIn => {
            clearInterval(checkIn.intervalId);
        });
        window.activeCheckIns = {};
    }
    location.reload();
}

function showLoginModal() {
    document.getElementById('loginModal').classList.remove('hidden');
    document.getElementById('mainApp').classList.add('hidden');
}

function showMainApp() {
    document.getElementById('loginModal').classList.add('hidden');
    document.getElementById('mainApp').classList.remove('hidden');
    updateUserProfile();
    loadAllPages();
    const displayName = currentUser === 'huanghuang' ? '璠璠' : '渲渲';
    document.getElementById('currentUser').textContent = displayName;
    document.getElementById('greetingName').textContent = displayName;
    
    // 初始化首页
    updateCountdowns();
    updateWeeklyStats();
    navigateToPage('home');
}

// ==================== 页面导航 ====================
function navigateToPage(pageName) {
    // 隐藏所有页面
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // 显示选中的页面
    const page = document.getElementById(pageName);
    if (page) {
        page.classList.add('active');
    }
    
    // 更新导航链接
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('data-page') === pageName) {
            link.classList.add('active');
        }
    });
    
    // 页面特定初始化
    switch(pageName) {
        case 'home':
            updateCountdowns();
            updateWeeklyStats();
            break;
        case 'calendar':
            renderCalendar();
            loadDailyRecords();
            loadDailyMessages();
            break;
        case 'room':
            loadCheckInProjects();
            loadCheckInTimeline();
            break;
        case 'messages':
            loadMessages();
            break;
        case 'wishlist':
            loadWishlist();
            break;
        case 'miss':
            renderMissCalendar();
            loadMissStats();
            break;
        case 'settings':
            loadSettings();
            break;
    }
}

// ==================== 倒计时功能 ====================
function updateCountdowns() {
    // 计算在一起的天数
    const now = new Date();
    const togetherDays = Math.floor((now - TOGETHER_DATE) / (1000 * 60 * 60 * 24));
    document.getElementById('togetherDays').textContent = togetherDays;
    
    // 计算距离考研的天数
    const examDays = Math.ceil((EXAM_DATE - now) / (1000 * 60 * 60 * 24));
    document.getElementById('examDays').textContent = Math.max(0, examDays);
}

// ==================== 周统计 ====================
function updateWeeklyStats() {
    db.ref('statistics').once('value', snapshot => {
        const data = snapshot.val() || {};
        
        let checkIns = 0;
        let missYous = 0;
        let wishes = 0;
        
        // 计算本周数据
        const now = new Date();
        const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
        
        if (data.checkIns) {
            Object.values(data.checkIns).forEach(item => {
                const itemDate = new Date(item.date);
                if (itemDate >= weekStart) checkIns++;
            });
        }
        
        if (data.missYous) {
            Object.values(data.missYous).forEach(item => {
                const itemDate = new Date(item.date);
                if (itemDate >= weekStart) missYous++;
            });
        }
        
        if (data.wishes) {
            Object.values(data.wishes).forEach(item => {
                if (!item.completed) wishes++;
            });
        }
        
        document.getElementById('weekCheckIns').textContent = checkIns;
        document.getElementById('weekMiss').textContent = missYous;
        document.getElementById('weekWishes').textContent = wishes;
    });
}

// ==================== 我想你功能 ====================
function recordMissYou() {
    const now = new Date();
    const timestamp = now.toISOString();
    
    db.ref('statistics/missYous').push({
        user: currentUser,
        date: timestamp,
        timestamp: now.getTime()
    }).then(() => {
        showNotification('已记录你的想念💕');
        updateWeeklyStats();
    }).catch(error => {
        console.error('记录失败:', error);
        showNotification('记录失败，请重试');
    });
}

// ==================== 日历功能 ====================
function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // 更新月份显示
    const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', 
                        '7月', '8月', '9月', '10月', '11月', '12月'];
    document.getElementById('monthYear').textContent = `${year}年${monthNames[month]}`;
    
    // 清空日历
    const calendarGrid = document.getElementById('calendarGrid');
    calendarGrid.innerHTML = '';
    
    // 添加星期标题
    const dayNames = ['日', '一', '二', '三', '四', '五', '六'];
    dayNames.forEach(day => {
        const dayHeader = document.createElement('div');
        dayHeader.className = 'calendar-cell';
        dayHeader.textContent = day;
        dayHeader.style.fontWeight = 'bold';
        dayHeader.style.backgroundColor = 'transparent';
        calendarGrid.appendChild(dayHeader);
    });
    
    // 获取月份的第一天和最后一天
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    // 生成日历
    let currentCell = new Date(startDate);
    for (let i = 0; i < 42; i++) {
        const cell = document.createElement('div');
        cell.className = 'calendar-cell';
        
        if (currentCell.getMonth() !== month) {
            cell.classList.add('empty');
        } else {
            cell.textContent = currentCell.getDate();
            cell.addEventListener('click', () => selectDate(currentCell));
        }
        
        calendarGrid.appendChild(cell);
        currentCell.setDate(currentCell.getDate() + 1);
    }
}

function selectDate(date) {
    // 加载该日期的记录和留言
    loadDailyRecords(date);
    loadDailyMessages(date);
}

function loadDailyRecords(date = new Date()) {
    const dateStr = date.toISOString().split('T')[0];
    const recordsList = document.getElementById('dailyRecords');
    recordsList.innerHTML = '';
    
    db.ref('records').orderByChild('date').once('value', snapshot => {
        const records = snapshot.val() || {};
        let found = false;
        
        Object.entries(records).forEach(([key, record]) => {
            if (record.date.startsWith(dateStr)) {
                found = true;
                const item = document.createElement('div');
                item.className = 'record-item';
                item.innerHTML = `
                    <div class="record-header">
                        <span class="record-user">${record.user === 'huanghuang' ? '璠璠' : '渲渲'}</span>
                        <span class="record-time">${new Date(record.date).toLocaleTimeString('zh-CN')}</span>
                    </div>
                    <div class="record-content">${record.content}</div>
                    ${record.image ? `<img src="${record.image}" class="record-image">` : ''}
                `;
                recordsList.appendChild(item);
            }
        });
        
        if (!found) {
            recordsList.innerHTML = '<div class="empty-state">暂无记录</div>';
        }
    });
}

function loadDailyMessages(date = new Date()) {
    const dateStr = date.toISOString().split('T')[0];
    const messagesList = document.getElementById('dailyMessages');
    messagesList.innerHTML = '';
    
    db.ref('messages').orderByChild('date').once('value', snapshot => {
        const messages = snapshot.val() || {};
        let found = false;
        
        Object.entries(messages).forEach(([key, message]) => {
            if (message.date.startsWith(dateStr)) {
                found = true;
                const item = document.createElement('div');
                item.className = 'message-item';
                item.innerHTML = `
                    <div class="message-header">
                        <span class="message-user">${message.user === 'huanghuang' ? '璠璠' : '渲渲'}</span>
                        <span class="message-time">${new Date(message.date).toLocaleTimeString('zh-CN')}</span>
                    </div>
                    <div class="message-content">${message.content}</div>
                    ${message.image ? `<img src="${message.image}" class="message-image">` : ''}
                `;
                messagesList.appendChild(item);
            }
        });
        
        if (!found) {
            messagesList.innerHTML = '<div class="empty-state">暂无留言</div>';
        }
    });
}

function showAddRecordModal() {
    document.getElementById('recordModal').classList.remove('hidden');
}

function showAddMessageModal() {
    document.getElementById('messageModal').classList.remove('hidden');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.add('hidden');
}

function saveRecord() {
    const text = document.getElementById('recordText').value;
    if (!text.trim()) {
        showNotification('请输入记录内容');
        return;
    }
    
    const now = new Date();
    db.ref('records').push({
        user: currentUser,
        content: text,
        date: now.toISOString(),
        image: null
    }).then(() => {
        showNotification('记录已保存');
        document.getElementById('recordText').value = '';
        closeModal('recordModal');
        loadDailyRecords();
    });
}

function saveMessage() {
    const text = document.getElementById('modalMessageText').value;
    if (!text.trim()) {
        showNotification('请输入留言内容');
        return;
    }
    
    const now = new Date();
    db.ref('messages').push({
        user: currentUser,
        content: text,
        date: now.toISOString(),
        image: null
    }).then(() => {
        showNotification('留言已发送');
        document.getElementById('modalMessageText').value = '';
        closeModal('messageModal');
        loadDailyMessages();
    });
}

// ==================== 打卡功能 ====================
function addCheckInProject() {
    const input = document.getElementById('projectInput');
    const projectName = input.value.trim();
    
    if (!projectName) {
        showNotification('请输入项目名称');
        return;
    }
    
    db.ref('checkInProjects').push({
        name: projectName,
        creator: currentUser,
        createdAt: new Date().toISOString()
    }).then(() => {
        showNotification('项目已添加');
        input.value = '';
        loadCheckInProjects();
    });
}

function loadCheckInProjects() {
    const grid = document.getElementById('checkInProjects');
    grid.innerHTML = '';
    
    db.ref('checkInProjects').once('value', snapshot => {
        const projects = snapshot.val() || {};
        
        if (Object.keys(projects).length === 0) {
            grid.innerHTML = '<div class="empty-state" style="grid-column: 1/-1;">还没有打卡项目，快来添加一个吧！</div>';
            return;
        }
        
        Object.entries(projects).forEach(([key, project]) => {
            const card = document.createElement('div');
            card.className = 'project-card';
            const isChecking = window.activeCheckIns && window.activeCheckIns[key];
            const btnText = isChecking ? `⏱️ ${Math.floor((new Date().getTime() - window.activeCheckIns[key].startTime) / 1000)}s` : '✓ 打卡';
            
            card.innerHTML = `
                <div class="project-name">${project.name}</div>
                <div class="project-creator">由 ${project.creator === 'huanghuang' ? '璠璠' : '渲渲'} 创建</div>
                <div class="project-buttons">
                    <button class="btn-primary ${isChecking ? 'checking-in' : ''}" data-project-id="${key}" onclick="checkIn('${key}')">${btnText}</button>
                    <button class="btn-danger" onclick="deleteProject('${key}')">删除</button>
                </div>
            `;
            grid.appendChild(card);
        });
    });
}

function checkIn(projectId) {
    db.ref('checkInProjects').child(projectId).once('value', snapshot => {
        const project = snapshot.val();
        const now = new Date();
        
        // 检查是否已有进行中的打卡
        const existingCheckIn = window.activeCheckIns && window.activeCheckIns[projectId];
        if (existingCheckIn) {
            endCheckIn(projectId);
            return;
        }
        
        // 初始化活跃打卡对象
        if (!window.activeCheckIns) {
            window.activeCheckIns = {};
        }
        
        const checkInId = Math.random().toString(36).substr(2, 9);
        const startTime = now.getTime();
        
        window.activeCheckIns[projectId] = {
            id: checkInId,
            startTime: startTime,
            projectName: project.name,
            intervalId: null
        };
        
        // 更新UI显示计时器
        updateCheckInUI(projectId, project.name);
        
        // 启动计时器
        const intervalId = setInterval(() => {
            if (window.activeCheckIns[projectId]) {
                updateCheckInUI(projectId, project.name);
            }
        }, 1000);
        
        window.activeCheckIns[projectId].intervalId = intervalId;
        showNotification(`开始打卡 ${project.name}`);
    });
}

function updateCheckInUI(projectId, projectName) {
    const checkIn = window.activeCheckIns[projectId];
    if (!checkIn) return;
    
    const elapsed = Math.floor((new Date().getTime() - checkIn.startTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    const btn = document.querySelector(`[data-project-id="${projectId}"]`);
    if (btn) {
        btn.textContent = `⏱️ ${timeStr}`;
        btn.classList.add('checking-in');
    }
}

function endCheckIn(projectId) {
    const checkIn = window.activeCheckIns[projectId];
    if (!checkIn) return;
    
    clearInterval(checkIn.intervalId);
    const elapsed = Math.floor((new Date().getTime() - checkIn.startTime) / 1000);
    
    db.ref('checkInRecords').push({
        projectId: projectId,
        projectName: checkIn.projectName,
        user: currentUser,
        timestamp: new Date().toISOString(),
        duration: elapsed,
        note: ''
    }).then(() => {
        delete window.activeCheckIns[projectId];
        showNotification(`打卡完成 ${checkIn.projectName}，耗时 ${Math.floor(elapsed/60)}分${elapsed%60}秒`);
        loadCheckInProjects();
        loadCheckInTimeline();
    });
}

function deleteProject(projectId) {
    if (confirm('确定要删除这个项目吗？')) {
        db.ref('checkInProjects').child(projectId).remove().then(() => {
            showNotification('项目已删除');
            loadCheckInProjects();
        });
    }
}

function loadCheckInTimeline() {
    const timeline = document.getElementById('checkInTimeline');
    timeline.innerHTML = '';
    
    const today = new Date().toISOString().split('T')[0];
    
    db.ref('checkInRecords').orderByChild('timestamp').limitToLast(50).once('value', snapshot => {
        const records = snapshot.val() || {};
        const todayRecords = [];
        
        Object.entries(records).forEach(([key, record]) => {
            if (record.timestamp.startsWith(today)) {
                todayRecords.push(record);
            }
        });
        
        if (todayRecords.length === 0) {
            timeline.innerHTML = '<div class="empty-state">今天还没有打卡记录</div>';
            return;
        }
        
        todayRecords.reverse().forEach(record => {
            const item = document.createElement('div');
            item.className = 'timeline-item';
            const time = new Date(record.timestamp).toLocaleTimeString('zh-CN');
            item.innerHTML = `
                <div class="timeline-header">
                    <span class="timeline-user">${record.user === 'huanghuang' ? '璠璠' : '渲渲'}</span>
                    <span class="timeline-project">${record.projectName}</span>
                </div>
                <div class="timeline-time">${time}</div>
                ${record.note ? `<div class="timeline-note">${record.note}</div>` : ''}
            `;
            timeline.appendChild(item);
        });
    });
}

function updateChart() {
    const timeRange = document.getElementById('timeRange').value;
    const chartType = document.getElementById('chartType').value;
    
    // 获取数据
    db.ref('checkInRecords').once('value', snapshot => {
        const records = snapshot.val() || {};
        const data = processChartData(records, timeRange);
        
        const ctx = document.getElementById('statsChart');
        if (!ctx) return;
        
        if (statsChart) {
            statsChart.destroy();
        }
        
        const config = {
            type: chartType,
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'top'
                    }
                },
                layout: {
                    padding: 10
                }
            }
        };
        
        statsChart = new Chart(ctx, config);
    });
}

function processChartData(records, timeRange) {
    const now = new Date();
    let startDate = new Date();
    
    if (timeRange === 'week') {
        startDate.setDate(now.getDate() - 7);
    } else if (timeRange === 'month') {
        startDate.setMonth(now.getMonth() - 1);
    } else if (timeRange === 'quarter') {
        startDate.setMonth(now.getMonth() - 3);
    }
    
    const projectCounts = {};
    Object.values(records).forEach(record => {
        const recordDate = new Date(record.timestamp);
        if (recordDate >= startDate) {
            projectCounts[record.projectName] = (projectCounts[record.projectName] || 0) + 1;
        }
    });
    
    return {
        labels: Object.keys(projectCounts),
        datasets: [{
            label: '打卡次数',
            data: Object.values(projectCounts),
            backgroundColor: [
                '#5DADE2',
                '#FF69B4',
                '#FFD700',
                '#98D8C8',
                '#F7DC6F'
            ]
        }]
    };
}

// ==================== 留言墙功能 ====================
function sendMessage() {
    const text = document.getElementById('messageText').value;
    if (!text.trim()) {
        showNotification('请输入留言内容');
        return;
    }
    
    const now = new Date();
    db.ref('wallMessages').push({
        user: currentUser,
        content: text,
        timestamp: now.toISOString(),
        replies: {}
    }).then(() => {
        showNotification('留言已发送');
        document.getElementById('messageText').value = '';
        loadMessages();
    });
}

function loadMessages() {
    const wall = document.getElementById('messagesWall');
    wall.innerHTML = '';
    
    db.ref('wallMessages').orderByChild('timestamp').once('value', snapshot => {
        const messages = snapshot.val() || {};
        
        if (Object.keys(messages).length === 0) {
            wall.innerHTML = '<div class="empty-state">还没有留言，快来发送第一条吧！</div>';
            return;
        }
              Object.entries(messages).reverse().forEach(([key, message]) => {
            const card = document.createElement('div');
            card.className = 'message-card';
            const time = new Date(message.timestamp).toLocaleString('zh-CN');
            
            card.innerHTML = `
                <div class="message-header">
                    <span class="message-user">${message.user === 'huanghuang' ? '璠璠' : '渲渲'}</span>
                    <span class="message-time">${time}</span>
                </div>
                <div class="message-content">${message.content}</div>
                <div class="message-actions">
                    <button class="btn-secondary" onclick="showReplyModal('${key}')">回复</button>
                </div>
            `;
            
            // 添加回复显示
            if (message.replies && Object.keys(message.replies).length > 0) {
                const repliesDiv = document.createElement('div');
                repliesDiv.className = 'message-replies';
                
                Object.entries(message.replies).forEach(([replyKey, reply]) => {
                    const replyTime = new Date(reply.timestamp).toLocaleString('zh-CN');
                    const replyItem = document.createElement('div');
                    replyItem.className = 'reply-item';
                    replyItem.innerHTML = `
                        <div class="reply-header">
                            <span class="reply-user">└─ ${reply.user === 'huanghuang' ? '璠璠' : '渲渲'}</span>
                            <span class="reply-time">${replyTime}</span>
                        </div>
                        <div class="reply-content">${reply.content}</div>
                    `;
                    repliesDiv.appendChild(replyItem);
                });
                
                card.appendChild(repliesDiv);
            }
            
            wall.appendChild(card);
        if(message.replies && Object.keys(message.replies).length > 0) {
                const repliesDiv = document.createElement('div');
                repliesDiv.className = 'message-replies';
                
                Object.entries(message.replies).forEach(([replyKey, reply]) => {
                    const replyTime = new Date(reply.timestamp).toLocaleString('zh-CN');
                    const replyItem = document.createElement('div');
                    replyItem.className = 'reply-item';
                    replyItem.innerHTML = `
                        <div class="reply-header">
                            <span class="reply-user">└─ ${reply.user === 'huanghuang' ? '璠璠' : '渲渲'}</span>
                            <span class="reply-time">${replyTime}</span>
                        </div>
                        <div class="reply-content">${reply.content}</div>
                    `;
                    repliesDiv.appendChild(replyItem);
                });
                
                card.appendChild(repliesDiv);
            }
            
            wall.appendChild(card);
        });
    });
}

function showReplyModal(messageId) {
    // 存储当前消息ID
    window.currentMessageId = messageId;
    document.getElementById('replyModal').classList.remove('hidden');
}

function saveReply() {
    const text = document.getElementById('replyText').value;
    if (!text.trim()) {
        showNotification('请输入回复内容');
        return;
    }
    
    const messageId = window.currentMessageId;
    const now = new Date();
    
    db.ref(`wallMessages/${messageId}/replies`).push({
        user: currentUser,
        content: text,
        timestamp: now.toISOString()
    }).then(() => {
        showNotification('回复已发送');
        document.getElementById('replyText').value = '';
        closeModal('replyModal');
        loadMessages();
    });
}

// ==================== 心愿清单功能 ====================
function addWish() {
    const input = document.getElementById('wishInput');
    const wish = input.value.trim();
    
    if (!wish) {
        showNotification('请输入心愿');
        return;
    }
    
    db.ref('wishes').push({
        content: wish,
        creator: currentUser,
        completed: false,
        createdAt: new Date().toISOString()
    }).then(() => {
        showNotification('心愿已添加');
        input.value = '';
        loadWishlist();
    });
}

function loadWishlist() {
    const items = document.getElementById('wishlistItems');
    items.innerHTML = '';
    
    db.ref('wishes').once('value', snapshot => {
        const wishes = snapshot.val() || {};
        
        if (Object.keys(wishes).length === 0) {
            items.innerHTML = '<div class="empty-state">还没有心愿，快来添加吧！</div>';
            return;
        }
        
        Object.entries(wishes).forEach(([key, wish]) => {
            const item = document.createElement('div');
            item.className = 'wish-item';
            item.innerHTML = `
                <div class="wish-content">
                    <input type="checkbox" class="wish-checkbox" ${wish.completed ? 'checked' : ''} 
                           onchange="toggleWish('${key}', this.checked)">
                    <span class="wish-text ${wish.completed ? 'completed' : ''}">${wish.content}</span>
                </div>
                <span class="wish-creator">由 ${wish.creator === 'huanghuang' ? '璠璠' : '渲渲'} 添加</span>
            `;
            items.appendChild(item);
        });
    });
}

function toggleWish(wishId, completed) {
    db.ref(`wishes/${wishId}/completed`).set(completed).then(() => {
        loadWishlist();
    });
}

// ==================== 我想你功能 ====================
function renderMissCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // 更新月份显示
    const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', 
                        '7月', '8月', '9月', '10月', '11月', '12月'];
    document.getElementById('missMonthYear').textContent = `${year}年${monthNames[month]}`;
    
    // 清空日历
    const calendarGrid = document.getElementById('missCalendarGrid');
    calendarGrid.innerHTML = '';
    
    // 添加星期标题
    const dayNames = ['日', '一', '二', '三', '四', '五', '六'];
    dayNames.forEach(day => {
        const dayHeader = document.createElement('div');
        dayHeader.className = 'calendar-cell';
        dayHeader.textContent = day;
        dayHeader.style.fontWeight = 'bold';
        dayHeader.style.backgroundColor = 'transparent';
        calendarGrid.appendChild(dayHeader);
    });
    
    // 获取月份的第一天和最后一天
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    // 获取想念数据
    db.ref('statistics/missYous').once('value', snapshot => {
        const missYous = snapshot.val() || {};
        const missCount = {};
        
        Object.values(missYous).forEach(item => {
            const date = new Date(item.date).toISOString().split('T')[0];
            missCount[date] = (missCount[date] || 0) + 1;
        });
        
        // 生成日历
        let currentCell = new Date(startDate);
        for (let i = 0; i < 42; i++) {
            const cell = document.createElement('div');
            cell.className = 'calendar-cell';
            
            if (currentCell.getMonth() !== month) {
                cell.classList.add('empty');
            } else {
                const dateStr = currentCell.toISOString().split('T')[0];
                const count = missCount[dateStr] || 0;
                
                cell.innerHTML = `
                    <span class="calendar-day">${currentCell.getDate()}</span>
                    ${count > 0 ? `<span class="miss-count">${count}</span>` : ''}
                `;
                
                if (count > 0) {
                    cell.classList.add('high-miss');
                }
            }
            
            calendarGrid.appendChild(cell);
            currentCell.setDate(currentCell.getDate() + 1);
        }
    });
}

function loadMissStats() {
    db.ref('statistics/missYous').once('value', snapshot => {
        const missYous = snapshot.val() || {};
        const total = Object.keys(missYous).length;
        
        let lastTime = '-';
        if (total > 0) {
            const lastMiss = Object.values(missYous).sort((a, b) => 
                new Date(b.date) - new Date(a.date)
            )[0];
            lastTime = new Date(lastMiss.date).toLocaleString('zh-CN');
        }
        
        document.getElementById('missStatsTotal').textContent = total;
        document.getElementById('lastMissTime').textContent = lastTime;
    });
}

// ==================== 设置功能 ====================
function loadSettings() {
    // 加载已保存的设置
    const togetherDate = localStorage.getItem('togetherDate') || '2023-06-21';
    const examDate = localStorage.getItem('examDate') || '2026-12-20';
    
    document.getElementById('togetherDate').value = togetherDate;
    document.getElementById('examDate').value = examDate;
}

function updateAvatar(user) {
    const inputId = user === 'huanghuang' ? 'huanghuangAvatarUrl' : 'xuanxuanAvatarUrl';
    const url = document.getElementById(inputId).value;
    
    if (!url.trim()) {
        showNotification('请输入有效的 URL');
        return;
    }
    
    db.ref(`avatars/${user}`).set(url).then(() => {
        showNotification('头像已更新');
    });
}

function exportData() {
    db.ref().once('value', snapshot => {
        const data = snapshot.val();
        const dataStr = JSON.stringify(data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `love-app-backup-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        showNotification('数据已导出');
    });
}

function importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = function(e) {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = function(event) {
            try {
                const data = JSON.parse(event.target.result);
                db.ref().set(data).then(() => {
                    showNotification('数据已导入');
                    location.reload();
                });
            } catch (error) {
                showNotification('文件格式错误');
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

function clearAllData() {
    if (confirm('确定要清空所有数据吗？此操作不可撤销！')) {
        db.ref().remove().then(() => {
            showNotification('所有数据已清空');
            location.reload();
        });
    }
}

// ==================== 工具函数 ====================
function showNotification(message) {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.classList.remove('hidden');
    
    setTimeout(() => {
        notification.classList.add('hidden');
    }, 3000);
}

// 初始化应用
console.log('脚本加载完成');
