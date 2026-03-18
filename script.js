// Firebase 配置
const firebaseConfig = {
    apiKey: "AIzaSyAv4cVMOGAUHa1km02eLL0VfG8UHCdzELo",
    authDomain: "love-app-12345.firebaseapp.com",
    databaseURL: "https://love-app-12345-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "love-app-12345",
    storageBucket: "love-app-12345.firebasestorage.app",
    messagingSenderId: "769508228824",
    appId: "1:769508228824:web:cebfea9f5ab96ea4e761ad"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let currentUser = null;
let selectedDate = new Date();
let missCalendarDate = new Date();
let chart = null;

document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = savedUser;
        showMainApp();
        loadAllData();
    } else {
        showLoginModal();
    }
    bindEvents();
}

function bindEvents() {
    document.querySelectorAll('.identity-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            selectIdentity(this.dataset.user);
        });
    });

    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            switchPage(this.dataset.page);
        });
    });

    const hamburger = document.getElementById('hamburger');
    if (hamburger) {
        hamburger.addEventListener('click', function() {
            const menu = document.getElementById('navMenu');
            menu.classList.toggle('active');
        });
    }

    if (document.getElementById('switchUserBtn')) {
        document.getElementById('switchUserBtn').addEventListener('click', switchUser);
    }
    if (document.getElementById('missYouBtn')) {
        document.getElementById('missYouBtn').addEventListener('click', recordMissYou);
    }
    if (document.getElementById('prevMonth')) {
        document.getElementById('prevMonth').addEventListener('click', () => changeMonth(-1));
    }
    if (document.getElementById('nextMonth')) {
        document.getElementById('nextMonth').addEventListener('click', () => changeMonth(1));
    }
    if (document.getElementById('missPrevMonth')) {
        document.getElementById('missPrevMonth').addEventListener('click', () => changeMissMonth(-1));
    }
    if (document.getElementById('missNextMonth')) {
        document.getElementById('missNextMonth').addEventListener('click', () => changeMissMonth(1));
    }

    if (document.getElementById('togetherDate')) {
        document.getElementById('togetherDate').addEventListener('change', function() {
            localStorage.setItem('togetherDate', this.value);
            updateCountdowns();
        });
    }

    if (document.getElementById('examDate')) {
        document.getElementById('examDate').addEventListener('change', function() {
            localStorage.setItem('examDate', this.value);
            updateCountdowns();
        });
    }

    const togetherDate = localStorage.getItem('togetherDate') || '2023-06-21';
    const examDate = localStorage.getItem('examDate') || '2026-12-20';
    if (document.getElementById('togetherDate')) {
        document.getElementById('togetherDate').value = togetherDate;
    }
    if (document.getElementById('examDate')) {
        document.getElementById('examDate').value = examDate;
    }
}

function showLoginModal() {
    document.getElementById('loginModal').classList.add('show');
    document.getElementById('mainApp').classList.add('hidden');
}

function showMainApp() {
    document.getElementById('loginModal').classList.remove('show');
    document.getElementById('mainApp').classList.remove('hidden');
    updateCurrentUserDisplay();
}

function selectIdentity(user) {
    currentUser = user;
    localStorage.setItem('currentUser', user);
    showMainApp();
    loadAllData();
}

function switchUser() {
    const newUser = currentUser === 'huanghuang' ? 'xuanxuan' : 'huanghuang';
    selectIdentity(newUser);
}

function updateCurrentUserDisplay() {
    const userName = currentUser === 'huanghuang' ? '璠璠' : '渲渲';
    if (document.getElementById('currentUser')) {
        document.getElementById('currentUser').textContent = userName;
    }
    if (document.getElementById('greetingName')) {
        document.getElementById('greetingName').textContent = userName;
    }
}

function switchPage(pageName) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });

    document.getElementById(pageName).classList.add('active');

    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.dataset.page === pageName) {
            link.classList.add('active');
        }
    });

    const menu = document.getElementById('navMenu');
    if (menu) {
        menu.classList.remove('active');
    }

    if (pageName === 'calendar') {
        renderCalendar();
    } else if (pageName === 'room') {
        renderCheckInProjects();
        renderCheckInTimeline();
        updateChart();
    } else if (pageName === 'miss') {
        renderMissCalendar();
        updateMissStats();
    } else if (pageName === 'messages') {
        renderMessagesWall();
        markAllMessagesAsRead();
    }
}

function updateCountdowns() {
    const togetherDate = localStorage.getItem('togetherDate') || '2023-06-21';
    const examDate = localStorage.getItem('examDate') || '2026-12-20';

    const together = calculateDaysDifference(new Date(togetherDate), new Date());
    const exam = calculateDaysDifference(new Date(), new Date(examDate));

    if (document.getElementById('togetherDays')) {
        document.getElementById('togetherDays').textContent = together;
    }
    if (document.getElementById('examDays')) {
        document.getElementById('examDays').textContent = Math.max(0, exam);
    }
}

function calculateDaysDifference(date1, date2) {
    const diffTime = Math.abs(date2 - date1);
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

function recordMissYou() {
    const today = new Date().toISOString().split('T')[0];
    const key = `miss_${currentUser}_${today}`;
    
    let missData = JSON.parse(localStorage.getItem('missData') || '{}');
    if (!missData[key]) {
        missData[key] = [];
    }
    
    missData[key].push(new Date().toLocaleTimeString());
    localStorage.setItem('missData', JSON.stringify(missData));

    db.ref(`miss/${currentUser}`).push({
        date: today,
        time: new Date().toLocaleTimeString(),
        timestamp: new Date().getTime()
    });

    updateMissStats();
    showNotification('❤️ 已记录您的想念');
}

function updateMissStats() {
    const today = new Date().toISOString().split('T')[0];
    const key = `miss_${currentUser}_${today}`;
    
    let missData = JSON.parse(localStorage.getItem('missData') || '{}');
    const todayCount = missData[key] ? missData[key].length : 0;

    let totalCount = 0;
    Object.keys(missData).forEach(k => {
        if (k.startsWith('miss_')) {
            totalCount += missData[k].length;
        }
    });

    if (document.getElementById('todayMissCount')) {
        document.getElementById('todayMissCount').textContent = todayCount;
    }
    if (document.getElementById('totalMissCount')) {
        document.getElementById('totalMissCount').textContent = totalCount;
    }
    if (document.getElementById('missStatsTotal')) {
        document.getElementById('missStatsTotal').textContent = totalCount;
    }

    let lastTime = '从未';
    if (missData[key] && missData[key].length > 0) {
        lastTime = missData[key][missData[key].length - 1];
    }
    if (document.getElementById('missStatsLast')) {
        document.getElementById('missStatsLast').textContent = lastTime;
    }

    updateWeeklyStats();
}

function updateWeeklyStats() {
    const today = new Date();
    const weekStart = new Date(today.setDate(today.getDate() - today.getDay()));
    
    let missData = JSON.parse(localStorage.getItem('missData') || '{}');
    let weekMissCount = 0;

    Object.keys(missData).forEach(key => {
        if (key.startsWith('miss_')) {
            const dateStr = key.split('_')[2];
            const date = new Date(dateStr);
            if (date >= weekStart) {
                weekMissCount += missData[key].length;
            }
        }
    });

    let checkInData = JSON.parse(localStorage.getItem('checkInData') || '{}');
    let checkInCount = 0;
    Object.keys(checkInData).forEach(key => {
        const dateStr = key.split('_')[1];
        const date = new Date(dateStr);
        if (date >= weekStart) {
            checkInCount++;
        }
    });

    let wishData = JSON.parse(localStorage.getItem('wishData') || '[]');

    if (document.getElementById('weekCheckIns')) {
        document.getElementById('weekCheckIns').textContent = checkInCount;
    }
    if (document.getElementById('weekMiss')) {
        document.getElementById('weekMiss').textContent = weekMissCount;
    }
    if (document.getElementById('weekWishes')) {
        document.getElementById('weekWishes').textContent = wishData.length;
    }
}

function renderCalendar() {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();

    if (document.getElementById('monthYear')) {
        document.getElementById('monthYear').textContent = `${year}年${month + 1}月`;
    }

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    let html = '';

    const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
    weekDays.forEach(day => {
        html += `<div class="calendar-day-header">${day}</div>`;
    });

    for (let i = 0; i < startingDayOfWeek; i++) {
        html += '<div class="calendar-day"></div>';
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dateStr = date.toISOString().split('T')[0];
        const isToday = dateStr === new Date().toISOString().split('T')[0];

        html += `<div class="calendar-day ${isToday ? 'today' : ''}" onclick="selectDate('${dateStr}')">${day}</div>`;
    }

    if (document.getElementById('calendarGrid')) {
        document.getElementById('calendarGrid').innerHTML = html;
    }
    loadDailyData();
}

function changeMonth(offset) {
    selectedDate.setMonth(selectedDate.getMonth() + offset);
    renderCalendar();
}

function selectDate(dateStr) {
    selectedDate = new Date(dateStr);
    renderCalendar();
}

function loadDailyData() {
    const dateStr = selectedDate.toISOString().split('T')[0];

    let recordsData = JSON.parse(localStorage.getItem('recordsData') || '{}');
    let dailyRecords = recordsData[dateStr] || [];

    let recordsHtml = '';
    dailyRecords.forEach(record => {
        recordsHtml += `
            <div class="record-item">
                <strong>${record.user === 'huanghuang' ? '璠璠' : '渲渲'}</strong>
                <p>${record.text}</p>
                ${record.image ? `<img src="${record.image}" class="record-image">` : ''}
                <div class="record-meta">${record.time}</div>
            </div>
        `;
    });

    if (document.getElementById('dailyRecords')) {
        document.getElementById('dailyRecords').innerHTML = recordsHtml || '<p>暂无记录</p>';
    }

    let messagesData = JSON.parse(localStorage.getItem('messagesData') || '{}');
    let dailyMessages = messagesData[dateStr] || [];

    let messagesHtml = '';
    dailyMessages.forEach((msg, index) => {
        let repliesHtml = '';
        if (msg.replies && msg.replies.length > 0) {
            msg.replies.forEach(reply => {
                repliesHtml += `
                    <div class="reply-item">
                        <div class="reply-header">
                            <span class="reply-author">${reply.user === 'huanghuang' ? '璠璠' : '渲渲'}</span>
                            <span class="reply-time">${reply.time}</span>
                        </div>
                        <div class="reply-text">${reply.text}</div>
                    </div>
                `;
            });
        }

        messagesHtml += `
            <div class="message-item">
                <strong>${msg.user === 'huanghuang' ? '璠璠' : '渲渲'}</strong>
                <p>${msg.text}</p>
                ${msg.image ? `<img src="${msg.image}" class="message-image">` : ''}
                <div class="message-meta">${msg.time}</div>
                <button class="reply-button" onclick="openReplyModal(${index}, '${dateStr}')">回复</button>
                ${repliesHtml ? `<div class="message-replies">${repliesHtml}</div>` : ''}
            </div>
        `;
    });

    if (document.getElementById('dailyMessages')) {
        document.getElementById('dailyMessages').innerHTML = messagesHtml || '<p>暂无留言</p>';
    }
}

function addCheckInProject() {
    const projectName = document.getElementById('projectInput').value.trim();
    if (!projectName) {
        showNotification('请输入项目名称');
        return;
    }

    let projectsData = JSON.parse(localStorage.getItem('checkInProjects') || '[]');
    projectsData.push({
        id: Date.now(),
        name: projectName,
        createdBy: currentUser,
        createdAt: new Date().toLocaleString()
    });

    localStorage.setItem('checkInProjects', JSON.stringify(projectsData));
    document.getElementById('projectInput').value = '';
    renderCheckInProjects();
    showNotification('✅ 项目已创建');
}

function renderCheckInProjects() {
    let projectsData = JSON.parse(localStorage.getItem('checkInProjects') || '[]');
    let html = '';

    projectsData.forEach(project => {
        const today = new Date().toISOString().split('T')[0];
        const checkInKey = `checkin_${project.id}_${today}`;
        let checkInData = JSON.parse(localStorage.getItem('checkInData') || '{}');
        const todayCheckIn = checkInData[checkInKey];

        const isActive = todayCheckIn && !todayCheckIn.endTime;
        const status = isActive ? '🟢 打卡中' : '⚪ 未开始';
        const timeDisplay = todayCheckIn ? `${todayCheckIn.startTime}${todayCheckIn.endTime ? '~' + todayCheckIn.endTime : ''}` : '';

        html += `
            <div class="checkin-card">
                <div class="checkin-title">${project.name}</div>
                <div class="checkin-status">${status}</div>
                ${timeDisplay ? `<div class="checkin-time">${timeDisplay}</div>` : ''}
                <div class="checkin-buttons">
                    ${!isActive ? `<button class="btn-start" onclick="startCheckIn(${project.id})">开始打卡</button>` : ''}
                    ${isActive ? `<button class="btn-end" onclick="endCheckIn(${project.id})">结束打卡</button>` : ''}
                </div>
            </div>
        `;
    });

    if (document.getElementById('checkInProjects')) {
        document.getElementById('checkInProjects').innerHTML = html || '<p>暂无项目</p>';
    }
}

function startCheckIn(projectId) {
    const today = new Date().toISOString().split('T')[0];
    const checkInKey = `checkin_${projectId}_${today}`;
    const startTime = new Date().toLocaleTimeString();

    let checkInData = JSON.parse(localStorage.getItem('checkInData') || '{}');
    checkInData[checkInKey] = {
        projectId: projectId,
        date: today,
        startTime: startTime,
        endTime: null,
        user: currentUser
    };

    localStorage.setItem('checkInData', JSON.stringify(checkInData));

    db.ref(`checkIn/${currentUser}/${today}/${projectId}`).set({
        startTime: startTime,
        endTime: null,
        timestamp: new Date().getTime()
    });

    renderCheckInProjects();
    showNotification('✅ 打卡开始');
}

function endCheckIn(projectId) {
    const today = new Date().toISOString().split('T')[0];
    const checkInKey = `checkin_${projectId}_${today}`;
    const endTime = new Date().toLocaleTimeString();

    let checkInData = JSON.parse(localStorage.getItem('checkInData') || '{}');
    if (checkInData[checkInKey]) {
        checkInData[checkInKey].endTime = endTime;
    }

    localStorage.setItem('checkInData', JSON.stringify(checkInData));

    db.ref(`checkIn/${currentUser}/${today}/${projectId}`).update({
        endTime: endTime
    });

    renderCheckInProjects();
    renderCheckInTimeline();
    showNotification('✅ 打卡结束');
}

function renderCheckInTimeline() {
    const today = new Date().toISOString().split('T')[0];
    let checkInData = JSON.parse(localStorage.getItem('checkInData') || '{}');
    let projectsData = JSON.parse(localStorage.getItem('checkInProjects') || '[]');

    let timeGroups = {};
    Object.keys(checkInData).forEach(key => {
        const data = checkInData[key];
        if (data.date === today) {
            const timeKey = data.startTime;
            if (!timeGroups[timeKey]) {
                timeGroups[timeKey] = [];
            }
            timeGroups[timeKey].push(data);
        }
    });

    let html = '';
    Object.keys(timeGroups).sort().forEach((timeKey, index) => {
        const items = timeGroups[timeKey];
        let itemsHtml = '';

        items.forEach(item => {
            const project = projectsData.find(p => p.id === item.projectId);
            const userName = item.user === 'huanghuang' ? '璠璠' : '渲渲';
            itemsHtml += `
                <div style="margin-bottom: 0.5rem;">
                    <strong>${project ? project.name : '未知项目'}</strong> - ${userName}
                    ${item.endTime ? `<span>${item.startTime} ~ ${item.endTime}</span>` : `<span>${item.startTime} ~ 进行中</span>`}
                </div>
            `;
        });

        html += `
            <div class="timeline-item">
                <div class="timeline-marker">${index + 1}</div>
                <div class="timeline-content">
                    <h4>时间段 ${timeKey}</h4>
                    ${itemsHtml}
                </div>
            </div>
        `;
    });

    if (document.getElementById('checkInTimeline')) {
        document.getElementById('checkInTimeline').innerHTML = html || '<p>今天还没有打卡记录</p>';
    }
}

function updateChart() {
    const timeRange = document.getElementById('timeRange') ? document.getElementById('timeRange').value : 'week';
    const chartType = document.getElementById('chartType') ? document.getElementById('chartType').value : 'pie';

    let projectsData = JSON.parse(localStorage.getItem('checkInProjects') || '[]');
    let checkInData = JSON.parse(localStorage.getItem('checkInData') || '{}');

    let projectStats = {};
    projectsData.forEach(project => {
        projectStats[project.name] = 0;
    });

    const today = new Date();
    let startDate = new Date();

    if (timeRange === 'week') {
        startDate.setDate(today.getDate() - today.getDay());
    } else if (timeRange === 'month') {
        startDate.setDate(1);
    } else if (timeRange === 'quarter') {
        const quarter = Math.floor(today.getMonth() / 3);
        startDate.setMonth(quarter * 3);
        startDate.setDate(1);
    }

    Object.keys(checkInData).forEach(key => {
        const data = checkInData[key];
        const date = new Date(data.date);
        if (date >= startDate) {
            const project = projectsData.find(p => p.id === data.projectId);
            if (project) {
                projectStats[project.name]++;
            }
        }
    });

    const ctx = document.getElementById('statsChart');
    if (!ctx) return;

    if (chart) {
        chart.destroy();
    }

    const labels = Object.keys(projectStats);
    const data = Object.values(projectStats);

    if (chartType === 'pie') {
        chart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: ['#5DADE2', '#AED6F1', '#D2EAF4', '#A6D3E6', '#FCEAB8', '#F5E3D7']
                }]
            },
            options: {responsive: true, maintainAspectRatio: true}
        });
    } else {
        chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: '打卡次数',
                    data: data,
                    borderColor: '#5DADE2',
                    backgroundColor: 'rgba(93, 173, 226, 0.1)',
                    tension: 0.4
                }]
            },
            options: {responsive: true, maintainAspectRatio: true, scales: {y: {beginAtZero: true}}}
        });
    }
}

function sendMessage() {
    const text = document.getElementById('messageText').value.trim();
    if (!text) {
        showNotification('请输入留言内容');
        return;
    }

    const today = new Date().toISOString().split('T')[0];
    let messagesData = JSON.parse(localStorage.getItem('messagesData') || '{}');
    if (!messagesData[today]) {
        messagesData[today] = [];
    }

    messagesData[today].push({
        user: currentUser,
        text: text,
        time: new Date().toLocaleString(),
        image: null,
        replies: [],
        unread: currentUser !== 'huanghuang'
    });

    localStorage.setItem('messagesData', JSON.stringify(messagesData));

    db.ref(`messages/${today}`).push({
        user: currentUser,
        text: text,
        time: new Date().toLocaleString(),
        timestamp: new Date().getTime()
    });

    document.getElementById('messageText').value = '';
    renderMessagesWall();
    showNotification('✅ 留言已发送');
}

function renderMessagesWall() {
    let messagesData = JSON.parse(localStorage.getItem('messagesData') || '{}');
    let html = '';

    const allMessages = [];
    Object.keys(messagesData).forEach(date => {
        messagesData[date].forEach((msg, index) => {
            allMessages.push({...msg, dateIndex: date, msgIndex: index});
        });
    });

    allMessages.reverse().forEach((msg, index) => {
        let repliesHtml = '';
        if (msg.replies && msg.replies.length > 0) {
            msg.replies.forEach(reply => {
                repliesHtml += `
                    <div class="reply-item">
                        <div class="reply-header">
                            <span class="reply-author">${reply.user === 'huanghuang' ? '璠璠' : '渲渲'}</span>
                            <span class="reply-time">${reply.time}</span>
                        </div>
                        <div class="reply-text">${reply.text}</div>
                    </div>
                `;
            });
        }

        html += `
            <div class="wall-message ${msg.unread ? 'unread' : ''}">
                <div class="wall-message-header">
                    <span class="wall-message-author">${msg.user === 'huanghuang' ? '璠璠' : '渲渲'}</span>
                    <span class="wall-message-time">${msg.time}</span>
                </div>
                <div class="wall-message-text">${msg.text}</div>
                ${msg.image ? `<img src="${msg.image}" class="wall-message-image">` : ''}
                <button class="reply-button" onclick="openReplyModalWall(${index})">回复</button>
                ${repliesHtml ? `<div class="message-replies">${repliesHtml}</div>` : ''}
            </div>
        `;
    });

    if (document.getElementById('messagesWall')) {
        document.getElementById('messagesWall').innerHTML = html || '<p>暂无留言</p>';
    }
}

function markAllMessagesAsRead() {
    let messagesData = JSON.parse(localStorage.getItem('messagesData') || '{}');
    Object.keys(messagesData).forEach(date => {
        messagesData[date].forEach(msg => {
            msg.unread = false;
        });
    });
    localStorage.setItem('messagesData', JSON.stringify(messagesData));
    updateUnreadCount();
}

function updateUnreadCount() {
    let messagesData = JSON.parse(localStorage.getItem('messagesData') || '{}');
    let unreadCount = 0;
    Object.keys(messagesData).forEach(date => {
        messagesData[date].forEach(msg => {
            if (msg.unread) {
                unreadCount++;
            }
        });
    });
    if (document.getElementById('unreadCount')) {
        document.getElementById('unreadCount').textContent = unreadCount;
    }
}

function addWish() {
    const wishText = document.getElementById('wishInput').value.trim();
    if (!wishText) {
        showNotification('请输入心愿');
        return;
    }

    let wishData = JSON.parse(localStorage.getItem('wishData') || '[]');
    wishData.push({
        id: Date.now(),
        text: wishText,
        user: currentUser,
        completed: false,
        createdAt: new Date().toLocaleString()
    });

    localStorage.setItem('wishData', JSON.stringify(wishData));
    document.getElementById('wishInput').value = '';
    renderWishlist();
    showNotification('✅ 心愿已添加');
}

function renderWishlist() {
    let wishData = JSON.parse(localStorage.getItem('wishData') || '[]');
    let html = '';

    wishData.forEach(wish => {
        html += `
            <div class="wish-item ${wish.completed ? 'completed' : ''}">
                <input type="checkbox" class="wish-checkbox" ${wish.completed ? 'checked' : ''} onchange="toggleWish(${wish.id})">
                <div class="wish-text">${wish.text}</div>
                <div class="wish-author">${wish.user === 'huanghuang' ? '璠璠' : '渲渲'}</div>
                <button class="wish-delete" onclick="deleteWish(${wish.id})">删除</button>
            </div>
        `;
    });

    if (document.getElementById('wishlistItems')) {
        document.getElementById('wishlistItems').innerHTML = html || '<p>暂无心愿</p>';
    }
}

function toggleWish(id) {
    let wishData = JSON.parse(localStorage.getItem('wishData') || '[]');
    const wish = wishData.find(w => w.id === id);
    if (wish) {
        wish.completed = !wish.completed;
        localStorage.setItem('wishData', JSON.stringify(wishData));
        renderWishlist();
    }
}

function deleteWish(id) {
    if (confirm('确定要删除这个心愿吗？')) {
        let wishData = JSON.parse(localStorage.getItem('wishData') || '[]');
        wishData = wishData.filter(w => w.id !== id);
        localStorage.setItem('wishData', JSON.stringify(wishData));
        renderWishlist();
        showNotification('✅ 心愿已删除');
    }
}

function renderMissCalendar() {
    const year = missCalendarDate.getFullYear();
    const month = missCalendarDate.getMonth();

    if (document.getElementById('missMonthYear')) {
        document.getElementById('missMonthYear').textContent = `${year}年${month + 1}月`;
    }

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    let html = '';

    const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
    weekDays.forEach(day => {
        html += `<div class="calendar-day-header">${day}</div>`;
    });

    for (let i = 0; i < startingDayOfWeek; i++) {
        html += '<div class="miss-calendar-day"></div>';
    }

    let missData = JSON.parse(localStorage.getItem('missData') || '{}');

    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dateStr = date.toISOString().split('T')[0];
        const key = `miss_${currentUser}_${dateStr}`;
        const count = missData[key] ? missData[key].length : 0;

        const hasClass = count > 0 ? 'has-miss' : '';
        const highClass = count > 10 ? 'high-miss' : '';

        html += `
            <div class="miss-calendar-day ${hasClass} ${highClass}">
                <div class="miss-day-number">${day}</div>
                ${count > 0 ? `<div class="miss-day-count">${count}</div>` : ''}
            </div>
        `;
    }

    if (document.getElementById('missCalendarGrid')) {
        document.getElementById('missCalendarGrid').innerHTML = html;
    }
}

function changeMissMonth(offset) {
    missCalendarDate.setMonth(missCalendarDate.getMonth() + offset);
    renderMissCalendar();
}

function showNotification(message) {
    const notification = document.getElementById('notification');
    if (!notification) return;
    notification.textContent = message;
    notification.classList.remove('hidden');

    setTimeout(() => {
        notification.classList.add('hidden');
    }, 3000);
}

function showAddRecordModal() {
    document.getElementById('addRecordModal').classList.add('show');
}

function showAddMessageModal() {
    document.getElementById('addMessageModal').classList.add('show');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('show');
}

function saveRecord() {
    const text = document.getElementById('recordText').value.trim();
    if (!text) {
        showNotification('请输入记录内容');
        return;
    }

    const dateStr = selectedDate.toISOString().split('T')[0];
    let recordsData = JSON.parse(localStorage.getItem('recordsData') || '{}');
    if (!recordsData[dateStr]) {
        recordsData[dateStr] = [];
    }

    recordsData[dateStr].push({
        user: currentUser,
        text: text,
        time: new Date().toLocaleString(),
        image: null
    });

    localStorage.setItem('recordsData', JSON.stringify(recordsData));
    document.getElementById('recordText').value = '';
    closeModal('addRecordModal');
    loadDailyData();
    showNotification('✅ 记录已保存');
}

function saveCalendarMessage() {
    const text = document.getElementById('calendarMessageText').value.trim();
    if (!text) {
        showNotification('请输入留言内容');
        return;
    }

    const dateStr = selectedDate.toISOString().split('T')[0];
    let messagesData = JSON.parse(localStorage.getItem('messagesData') || '{}');
    if (!messagesData[dateStr]) {
        messagesData[dateStr] = [];
    }

    messagesData[dateStr].push({
        user: currentUser,
        text: text,
        time: new Date().toLocaleString(),
        image: null,
        replies: []
    });

    localStorage.setItem('messagesData', JSON.stringify(messagesData));
    document.getElementById('calendarMessageText').value = '';
    closeModal('addMessageModal');
    loadDailyData();
    showNotification('✅ 留言已发送');
}

function openReplyModal(index, dateStr) {
    let messagesData = JSON.parse(localStorage.getItem('messagesData') || '{}');
    const message = messagesData[dateStr][index];
    
    if (document.getElementById('replyOriginalMessage')) {
        document.getElementById('replyOriginalMessage').innerHTML = `
            <strong>${message.user === 'huanghuang' ? '璠璠' : '渲渲'}</strong>: ${message.text}
        `;
    }
    
    document.getElementById('replyModal').dataset.dateStr = dateStr;
    document.getElementById('replyModal').dataset.msgIndex = index;
    document.getElementById('replyModal').classList.add('show');
}

function openReplyModalWall(index) {
    showNotification('回复功能开发中');
}

function saveReply() {
    const text = document.getElementById('replyText').value.trim();
    if (!text) {
        showNotification('请输入回复内容');
        return;
    }

    const dateStr = document.getElementById('replyModal').dataset.dateStr;
    const msgIndex = document.getElementById('replyModal').dataset.msgIndex;

    let messagesData = JSON.parse(localStorage.getItem('messagesData') || '{}');
    if (!messagesData[dateStr][msgIndex].replies) {
        messagesData[dateStr][msgIndex].replies = [];
    }

    messagesData[dateStr][msgIndex].replies.push({
        user: currentUser,
        text: text,
        time: new Date().toLocaleString()
    });

    localStorage.setItem('messagesData', JSON.stringify(messagesData));
    document.getElementById('replyText').value = '';
    closeModal('replyModal');
    loadDailyData();
    renderMessagesWall();
    showNotification('✅ 回复已发送');
}

function exportData() {
    const data = {
        messagesData: localStorage.getItem('messagesData'),
        recordsData: localStorage.getItem('recordsData'),
        wishData: localStorage.getItem('wishData'),
        checkInData: localStorage.getItem('checkInData'),
        checkInProjects: localStorage.getItem('checkInProjects'),
        missData: localStorage.getItem('missData')
    };

    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `我们的故事_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    showNotification('✅ 数据已导出');
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
                Object.keys(data).forEach(key => {
                    if (data[key]) {
                        localStorage.setItem(key, data[key]);
                    }
                });
                showNotification('✅ 数据已导入');
                loadAllData();
            } catch (error) {
                showNotification('❌ 导入失败');
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

function clearAllData() {
    if (confirm('确定要清空所有数据吗？此操作不可撤销！')) {
        localStorage.removeItem('messagesData');
        localStorage.removeItem('recordsData');
        localStorage.removeItem('wishData');
        localStorage.removeItem('checkInData');
        localStorage.removeItem('checkInProjects');
        localStorage.removeItem('missData');
        showNotification('✅ 数据已清空');
        loadAllData();
    }
}

function loadAllData() {
    updateCountdowns();
    updateMissStats();
    renderWishlist();
    updateUnreadCount();
}
