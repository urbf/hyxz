(function(window) {
    'use strict';

    // ================= 默认配置 =================
    const DEFAULT_CONFIG = {
        containerId: 'meeting-schedule-root',
        adminPassword: '13666222130',
        rooms: [
            "玉华厅(22)",
            "第一会议室(98)",
            "第三会议室(100)",
            "第二会议室(49)",
            "第五会议室(67)",
            "第六会议室(360)",
            "第四会议室(75)",
            "第十二会议室(12)",
            "金华厅(30)"
        ],
        startHour: 7,
        endHour: 18.5,
        interval: 0.5,
        defaultData: [
            { date: "2026-09-15", room: "第二会议室(49)", start: "09:00", end: "12:00", dept: "政府办", status: "internal" },
            { date: "2026-09-15", room: "金华厅(30)", start: "14:00", end: "16:30", dept: "统战部", status: "internal" }
        ]
    };

    // ================= 样式注入 =================
    const CSS = `
        :root {
            --header-bg: #2c3e50;
            --cell-border: #e0e0e0;
            --time-col-width: 80px;
            --room-col-width: 160px;
            --row-height: 35px;
            --red-internal: #e74c3c;
            --green-external: #27ae60;
        }
        .ms-root, .ms-root * { box-sizing: border-box; margin: 0; padding: 0; }
        .ms-root {
            font-family: -apple-system, BlinkMacSystemFont, 'Microsoft YaHei', sans-serif;
            background-color: #f5f6fa;
            color: #333;
            padding: 20px;
            -webkit-tap-highlight-color: transparent;
        }
        .ms-controls {
            display: flex; justify-content: space-between; align-items: center;
            background: white; padding: 15px 20px; border-radius: 8px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1); margin-bottom: 15px;
            flex-wrap: wrap; gap: 10px;
        }
        .ms-controls-left, .ms-controls-center, .ms-controls-right {
            display: flex; align-items: center; gap: 10px;
        }
        .ms-controls h1 { font-size: 20px; color: #2c3e50; white-space: nowrap; }
        .ms-btn {
            padding: 8px 15px; border: 1px solid #ccc; border-radius: 4px;
            background: white; cursor: pointer; font-size: 14px;
            transition: all 0.2s; touch-action: manipulation;
        }
        .ms-btn:hover { background: #f0f0f0; border-color: #999; }
        .ms-btn.primary { background: #3498db; color: white; border-color: #3498db; }
        .ms-btn.danger { background: #e74c3c; color: white; border-color: #e74c3c; }
        .ms-input {
            padding: 8px; border: 1px solid #ccc; border-radius: 4px;
            font-family: inherit; font-size: 14px;
        }
        .ms-auth-status {
            font-size: 13px; font-weight: bold; color: #e74c3c;
            padding: 4px 8px; background: #fdf0f0; border-radius: 4px;
            white-space: nowrap;
        }
        .ms-auth-status.unlocked { color: #27ae60; background: #eafaf1; }
        .ms-schedule-wrapper {
            background: white; border-radius: 8px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            overflow: auto; max-height: calc(100vh - 150px);
            position: relative; -webkit-overflow-scrolling: touch;
        }
        .ms-schedule-container { display: flex; min-width: max-content; }
        .ms-time-column {
            width: var(--time-col-width); flex-shrink: 0;
            position: sticky; left: 0; z-index: 10;
            background: white; border-right: 2px solid var(--header-bg);
        }
        .ms-time-header {
            height: 50px; background: var(--header-bg); color: white;
            display: flex; align-items: center; justify-content: center;
            font-weight: bold; position: sticky; top: 0; z-index: 11;
        }
        .ms-time-slot {
            height: var(--row-height); display: flex; align-items: center;
            justify-content: center; font-size: 12px; color: #666;
            border-bottom: 1px solid var(--cell-border);
        }
        .ms-rooms-container { display: flex; flex-direction: column; }
        .ms-rooms-header {
            display: flex; height: 50px; background: var(--header-bg); color: white;
            position: sticky; top: 0; z-index: 9;
        }
        .ms-room-header {
            width: var(--room-col-width); flex-shrink: 0; display: flex;
            align-items: center; justify-content: center; font-size: 13px;
            text-align: center; padding: 0 5px;
            border-right: 1px solid rgba(255,255,255,0.2);
            word-break: break-all; line-height: 1.2;
        }
        .ms-rooms-body { display: flex; position: relative; }
        .ms-room-column {
            width: var(--room-col-width); flex-shrink: 0;
            border-right: 1px solid var(--cell-border); position: relative;
        }
        .ms-grid-row {
            height: var(--row-height); border-bottom: 1px solid var(--cell-border);
            cursor: pointer; transition: background 0.2s;
        }
        .ms-grid-row:hover { background-color: #f0f8ff !important; }
        .ms-grid-row:nth-child(even) { background-color: #fafafa; }
        .ms-meeting-block {
            position: absolute; left: 2px; right: 2px; border-radius: 4px;
            color: white; font-size: 12px; display: flex; align-items: center;
            justify-content: center; text-align: center; padding: 2px;
            box-shadow: 1px 1px 3px rgba(0,0,0,0.2);
            overflow: hidden; z-index: 5; word-break: break-all; cursor: pointer;
        }
        .ms-meeting-block:active { opacity: 0.8; }
        .ms-status-internal { background-color: var(--red-internal); }
        .ms-status-external { background-color: var(--green-external); }
        .ms-legend {
            margin-top: 15px; display: flex; gap: 15px; font-size: 13px;
            flex-wrap: wrap; padding-left: 10px;
        }
        .ms-legend-item { display: flex; align-items: center; gap: 5px; }
        .ms-legend-color { width: 16px; height: 16px; border-radius: 3px; }
        .ms-modal-overlay {
            display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.5); z-index: 100; justify-content: center;
            align-items: center; padding: 15px;
        }
        .ms-modal-overlay.active { display: flex; }
        .ms-modal {
            background: white; padding: 20px; border-radius: 8px;
            width: 400px; max-width: 100%; box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            max-height: 95vh; overflow-y: auto;
        }
        .ms-modal h3 {
            margin-top: 0; color: #2c3e50; border-bottom: 1px solid #eee;
            padding-bottom: 10px; font-size: 18px;
        }
        .ms-form-group { margin-bottom: 15px; }
        .ms-form-group label { display: block; margin-bottom: 5px; font-weight: bold; font-size: 14px; }
        .ms-form-group input, .ms-form-group select { width: 100%; }
        .ms-modal-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; }
        .ms-error-msg { color: #e74c3c; font-size: 12px; margin-top: 5px; display: none; }
        .ms-portrait-tip {
            display: none; text-align: center; font-size: 12px; color: #e67e22;
            background: #fdf2e9; padding: 6px; border-radius: 4px; margin-bottom: 5px;
        }
        @media (max-width: 768px) {
            .ms-root { padding: 10px; }
            .ms-controls { padding: 10px; flex-direction: column; align-items: stretch; }
            .ms-controls-left, .ms-controls-right { justify-content: center; }
            .ms-controls-center { justify-content: space-between; width: 100%; }
            .ms-controls-center .ms-btn { flex: 1; padding: 8px 0; font-size: 13px; }
            .ms-controls-center input[type="date"] { flex: 2; text-align: center; font-size: 13px; }
            .ms-room-header { font-size: 11px; padding: 0 2px; }
            .ms-time-slot { font-size: 10px; }
            .ms-meeting-block { font-size: 11px; }
            .ms-form-group input, .ms-form-group select { font-size: 16px; }
            .ms-modal-actions .ms-btn { flex: 1; padding: 12px; font-size: 15px; }
            .ms-modal-actions { flex-wrap: wrap; }
            .ms-modal-actions .danger { width: 100%; margin-bottom: 10px; }
            .ms-portrait-tip { display: block; }
        }
        @media (orientation: landscape) and (max-height: 500px) {
            .ms-root { padding: 8px; }
            .ms-controls h1 { display: none; }
            .ms-controls { flex-direction: row; flex-wrap: nowrap; padding: 8px 15px; margin-bottom: 8px; }
            .ms-legend { display: none; }
            .ms-schedule-wrapper { max-height: calc(100vh - 80px); }
        }
    `;

    // ================= 工具函数 =================
    function injectStyle() {
        if (document.getElementById('ms-styles')) return;
        const style = document.createElement('style');
        style.id = 'ms-styles';
        style.textContent = CSS;
        document.head.appendChild(style);
    }

    function timeToDecimal(timeStr) {
        const [h, m] = timeStr.split(':').map(Number);
        return h + m / 60;
    }

    function formatDate(date) {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    // ================= 主类 =================
    class MeetingSchedule {
        constructor(config) {
            this.config = Object.assign({}, DEFAULT_CONFIG, config);
            this.container = document.getElementById(this.config.containerId);
            if (!this.container) throw new Error('找不到容器元素: ' + this.config.containerId);

            this.isAuthorized = false;
            this.pendingAction = null;
            this.currentDate = new Date();
            this.meetingData = this.loadData();

            this.init();
        }

        loadData() {
            const stored = localStorage.getItem('meetingData');
            if (stored) {
                try { return JSON.parse(stored); } catch (e) { /* ignore */ }
            }
            return this.config.defaultData;
        }

        saveData() {
            localStorage.setItem('meetingData', JSON.stringify(this.meetingData));
        }

        init() {
            injectStyle();
            this.buildHTML();
            this.bindEvents();
            this.initDatePicker();
            this.renderSchedule(formatDate(this.currentDate));
        }

        buildHTML() {
            const cfg = this.config;
            const startHour = cfg.startHour;
            const endHour = cfg.endHour;
            const interval = cfg.interval;

            let timeSlotsHTML = '';
            let current = startHour;
            while (current <= endHour) {
                const h = Math.floor(current);
                const m = (current % 1) * 60;
                const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
                timeSlotsHTML += `<div class="ms-time-slot">${timeStr}</div>`;
                current += interval;
            }

            let roomsHeaderHTML = '';
            cfg.rooms.forEach(room => {
                roomsHeaderHTML += `<div class="ms-room-header">${room}</div>`;
            });

            const totalRows = Math.ceil((endHour - startHour) / interval);
            let roomsBodyHTML = '';
            cfg.rooms.forEach(room => {
                let rowsHTML = '';
                for (let i = 0; i < totalRows; i++) {
                    rowsHTML += `<div class="ms-grid-row" data-room="${room}" data-index="${i}"></div>`;
                }
                roomsBodyHTML += `<div class="ms-room-column" data-room="${room}">${rowsHTML}</div>`;
            });

            this.container.innerHTML = `
                <div class="ms-root">
                    <div class="ms-controls">
                        <div class="ms-controls-left">
                            <h1>📅 会议中心会议室排期表</h1>
                            <span class="ms-auth-status" id="ms-auth-status">🔒 未授权</span>
                        </div>
                        <div class="ms-controls-center">
                            <button class="ms-btn" id="ms-prev-day">◀ 前一天</button>
                            <input type="date" class="ms-input" id="ms-date-picker">
                            <button class="ms-btn" id="ms-today">今天</button>
                            <button class="ms-btn" id="ms-next-day">后一天 ▶</button>
                        </div>
                        <div class="ms-controls-right">
                            <span id="ms-display-date" style="font-weight:bold;color:#e74c3c;font-size:14px;"></span>
                        </div>
                    </div>
                    <div class="ms-portrait-tip">📱 提示：横屏查看表格体验更佳，可左右滑动查看所有会议室</div>
                    <div class="ms-schedule-wrapper">
                        <div class="ms-schedule-container">
                            <div class="ms-time-column">
                                <div class="ms-time-header">时间</div>
                                <div id="ms-time-slots">${timeSlotsHTML}</div>
                            </div>
                            <div class="ms-rooms-container">
                                <div class="ms-rooms-header" id="ms-rooms-header">${roomsHeaderHTML}</div>
                                <div class="ms-rooms-body" id="ms-rooms-body">${roomsBodyHTML}</div>
                            </div>
                        </div>
                    </div>
                    <div class="ms-legend">
                        <div class="ms-legend-item"><div class="ms-legend-color ms-status-external"></div><span>外部使用</span></div>
                        <div class="ms-legend-item"><div class="ms-legend-color ms-status-internal"></div><span>内部使用</span></div>
                        <div style="color:#666;margin-left:auto;font-size:12px;">💡 点击网格添加，点击色块修改（需密码）</div>
                    </div>

                    <!-- 密码验证弹窗 -->
                    <div class="ms-modal-overlay" id="ms-auth-modal">
                        <div class="ms-modal">
                            <h3>🔐 管理员验证</h3>
                            <p style="font-size:14px;color:#666;margin-top:0;">修改、增加或删除会议需要验证密码。</p>
                            <div class="ms-form-group">
                                <input type="password" class="ms-input" id="ms-password-input" placeholder="请输入密码">
                                <div class="ms-error-msg" id="ms-auth-error">密码错误，请重试！</div>
                            </div>
                            <div class="ms-modal-actions">
                                <button class="ms-btn" id="ms-auth-cancel">取消</button>
                                <button class="ms-btn primary" id="ms-auth-confirm">确认</button>
                            </div>
                        </div>
                    </div>

                    <!-- 添加/修改会议弹窗 -->
                    <div class="ms-modal-overlay" id="ms-meeting-modal">
                        <div class="ms-modal">
                            <h3 id="ms-modal-title">添加会议</h3>
                            <input type="hidden" id="ms-edit-index" value="-1">
                            <input type="hidden" id="ms-edit-room" value="">
                            <input type="hidden" id="ms-edit-date" value="">
                            <div class="ms-form-group">
                                <label>会议室</label>
                                <input type="text" class="ms-input" id="ms-form-room" disabled style="background:#eee;">
                            </div>
                            <div style="display:flex;gap:10px;">
                                <div class="ms-form-group" style="flex:1;">
                                    <label>开始时间</label>
                                    <input type="time" class="ms-input" id="ms-form-start" step="1800">
                                </div>
                                <div class="ms-form-group" style="flex:1;">
                                    <label>结束时间</label>
                                    <input type="time" class="ms-input" id="ms-form-end" step="1800">
                                </div>
                            </div>
                            <div class="ms-form-group">
                                <label>使用部门</label>
                                <input type="text" class="ms-input" id="ms-form-dept" placeholder="例如：政府办">
                            </div>
                            <div class="ms-form-group">
                                <label>使用状态</label>
                                <select class="ms-input" id="ms-form-status">
                                    <option value="internal">内部使用（红色）</option>
                                    <option value="external">外部使用（绿色）</option>
                                </select>
                            </div>
                            <div class="ms-error-msg" id="ms-form-error">时间冲突或信息不完整！</div>
                            <div class="ms-modal-actions">
                                <button class="ms-btn danger" id="ms-btn-delete" style="display:none;margin-right:auto;">删除会议</button>
                                <button class="ms-btn" id="ms-meeting-cancel">取消</button>
                                <button class="ms-btn primary" id="ms-meeting-save">保存</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        bindEvents() {
            const self = this;
            document.getElementById('ms-prev-day').addEventListener('click', () => self.changeDate(-1));
            document.getElementById('ms-next-day').addEventListener('click', () => self.changeDate(1));
            document.getElementById('ms-today').addEventListener('click', () => self.goToday());
            document.getElementById('ms-date-picker').addEventListener('change', () => self.onDateChange());

            // 网格点击添加
            document.getElementById('ms-rooms-body').addEventListener('click', function(e) {
                const row = e.target.closest('.ms-grid-row');
                if (!row) return;
                if (e.target.closest('.ms-meeting-block')) return; // 点击到会议块由块的监听处理
                const room = row.dataset.room;
                const index = parseInt(row.dataset.index);
                const startTime = self.getTimeFromIndex(index);
                const endTime = self.getTimeFromIndex(index + 1);
                self.requestAuth(() => self.openAddModal(room, startTime, endTime, formatDate(self.currentDate)));
            });

            // 密码验证弹窗
            document.getElementById('ms-auth-confirm').addEventListener('click', () => self.verifyPassword());
            document.getElementById('ms-auth-cancel').addEventListener('click', () => self.closeAuthModal());
            document.getElementById('ms-password-input').addEventListener('keypress', (e) => {
                if (e.key === 'Enter') self.verifyPassword();
            });

            // 会议弹窗
            document.getElementById('ms-meeting-save').addEventListener('click', () => self.saveMeeting());
            document.getElementById('ms-meeting-cancel').addEventListener('click', () => self.closeMeetingModal());
            document.getElementById('ms-btn-delete').addEventListener('click', () => self.deleteMeeting());
        }

        initDatePicker() {
            document.getElementById('ms-date-picker').value = formatDate(this.currentDate);
        }

        onDateChange() {
            const selectedDate = document.getElementById('ms-date-picker').value;
            this.currentDate = new Date(selectedDate);
            this.renderSchedule(selectedDate);
        }

        changeDate(days) {
            this.currentDate.setDate(this.currentDate.getDate() + days);
            document.getElementById('ms-date-picker').value = formatDate(this.currentDate);
            this.renderSchedule(formatDate(this.currentDate));
        }

        goToday() {
            this.currentDate = new Date();
            document.getElementById('ms-date-picker').value = formatDate(this.currentDate);
            this.renderSchedule(formatDate(this.currentDate));
        }

        getTimeFromIndex(index) {
            const total = this.config.startHour + index * this.config.interval;
            const h = Math.floor(total);
            const m = Math.round((total % 1) * 60);
            return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        }

        renderSchedule(dateStr) {
            // 移除旧块
            this.container.querySelectorAll('.ms-meeting-block').forEach(el => el.remove());

            const dayData = this.meetingData.filter(item => item.date === dateStr);
            const self = this;

            dayData.forEach((meeting, index) => {
                const roomCol = self.container.querySelector(`.ms-room-column[data-room="${meeting.room}"]`);
                if (!roomCol) return;

                const startDec = timeToDecimal(meeting.start);
                const endDec = timeToDecimal(meeting.end);
                const rowHeight = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--row-height').replace('px', ''));
                const topOffset = (startDec - self.config.startHour) * (rowHeight / self.config.interval);
                const height = (endDec - startDec) * (rowHeight / self.config.interval);

                const block = document.createElement('div');
                block.className = `ms-meeting-block ${meeting.status === 'internal' ? 'ms-status-internal' : 'ms-status-external'}`;
                block.style.top = `${topOffset}px`;
                block.style.height = `${height}px`;
                block.textContent = meeting.dept;
                block.title = `${meeting.dept}\n${meeting.start} - ${meeting.end}\n状态: ${meeting.status === 'internal' ? '内部使用' : '外部使用'}`;

                block.addEventListener('click', function(e) {
                    e.stopPropagation();
                    self.requestAuth(() => self.openEditModal(meeting, index, meeting.room, dateStr));
                });
                roomCol.appendChild(block);
            });

            const dateObj = new Date(dateStr);
            const weekDays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
            document.getElementById('ms-display-date').textContent =
                `${dateObj.getMonth() + 1}月${dateObj.getDate()}日 ${weekDays[dateObj.getDay()]}`;
        }

        requestAuth(callback) {
            if (this.isAuthorized) { callback(); return; }
            this.pendingAction = callback;
            document.getElementById('ms-auth-modal').classList.add('active');
            document.getElementById('ms-password-input').value = '';
            document.getElementById('ms-auth-error').style.display = 'none';
            setTimeout(() => document.getElementById('ms-password-input').focus(), 300);
        }

        verifyPassword() {
            const input = document.getElementById('ms-password-input').value;
            if (input === this.config.adminPassword) {
                this.isAuthorized = true;
                const statusEl = document.getElementById('ms-auth-status');
                statusEl.textContent = '🔓 已授权';
                statusEl.classList.add('unlocked');
                this.closeAuthModal();
                if (this.pendingAction) { this.pendingAction(); this.pendingAction = null; }
            } else {
                document.getElementById('ms-auth-error').style.display = 'block';
            }
        }

        closeAuthModal() {
            document.getElementById('ms-auth-modal').classList.remove('active');
            this.pendingAction = null;
        }

        openAddModal(room, start, end, date) {
            document.getElementById('ms-modal-title').textContent = '添加会议';
            document.getElementById('ms-edit-index').value = '-1';
            document.getElementById('ms-edit-room').value = room;
            document.getElementById('ms-edit-date').value = date;
            document.getElementById('ms-form-room').value = room;
            document.getElementById('ms-form-start').value = start;
            document.getElementById('ms-form-end').value = end;
            document.getElementById('ms-form-dept').value = '';
            document.getElementById('ms-form-status').value = 'internal';
            document.getElementById('ms-btn-delete').style.display = 'none';
            document.getElementById('ms-form-error').style.display = 'none';
            document.getElementById('ms-meeting-modal').classList.add('active');
        }

        openEditModal(meeting, index, room, date) {
            document.getElementById('ms-modal-title').textContent = '修改会议';
            document.getElementById('ms-edit-index').value = index;
            document.getElementById('ms-edit-room').value = room;
            document.getElementById('ms-edit-date').value = date;
            document.getElementById('ms-form-room').value = room;
            document.getElementById('ms-form-start').value = meeting.start;
            document.getElementById('ms-form-end').value = meeting.end;
            document.getElementById('ms-form-dept').value = meeting.dept;
            document.getElementById('ms-form-status').value = meeting.status;
            document.getElementById('ms-btn-delete').style.display = 'block';
            document.getElementById('ms-form-error').style.display = 'none';
            document.getElementById('ms-meeting-modal').classList.add('active');
        }

        closeMeetingModal() {
            document.getElementById('ms-meeting-modal').classList.remove('active');
        }

        checkConflict(newMeeting, ignoreIndex = -1) {
            for (let i = 0; i < this.meetingData.length; i++) {
                if (i === ignoreIndex) continue;
                const m = this.meetingData[i];
                if (m.date === newMeeting.date && m.room === newMeeting.room) {
                    const start1 = timeToDecimal(m.start);
                    const end1 = timeToDecimal(m.end);
                    const start2 = timeToDecimal(newMeeting.start);
                    const end2 = timeToDecimal(newMeeting.end);
                    if (Math.max(start1, start2) < Math.min(end1, end2)) return true;
                }
            }
            return false;
        }

        saveMeeting() {
            const index = parseInt(document.getElementById('ms-edit-index').value);
            const room = document.getElementById('ms-edit-room').value;
            const date = document.getElementById('ms-edit-date').value;
            const start = document.getElementById('ms-form-start').value;
            const end = document.getElementById('ms-form-end').value;
            const dept = document.getElementById('ms-form-dept').value.trim();
            const status = document.getElementById('ms-form-status').value;

            if (!start || !end || !dept) { this.showFormError('请填写完整信息！'); return; }
            if (timeToDecimal(start) >= timeToDecimal(end)) { this.showFormError('结束时间必须大于开始时间！'); return; }

            const newMeeting = { date, room, start, end, dept, status };
            if (this.checkConflict(newMeeting, index)) { this.showFormError('该时间段与已有会议冲突！'); return; }

            if (index === -1) this.meetingData.push(newMeeting);
            else this.meetingData[index] = newMeeting;

            this.saveData();
            this.renderSchedule(formatDate(this.currentDate));
            this.closeMeetingModal();
        }

        deleteMeeting() {
            const index = parseInt(document.getElementById('ms-edit-index').value);
            if (index > -1 && confirm('确定要删除这个会议吗？')) {
                this.meetingData.splice(index, 1);
                this.saveData();
                this.renderSchedule(formatDate(this.currentDate));
                this.closeMeetingModal();
            }
        }

        showFormError(msg) {
            const el = document.getElementById('ms-form-error');
            el.textContent = msg;
            el.style.display = 'block';
        }
    }

    // ================= 暴露全局初始化函数 =================
    window.initMeetingSchedule = function(config) {
        return new MeetingSchedule(config);
    };

})(window);