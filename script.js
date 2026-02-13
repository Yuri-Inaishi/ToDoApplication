// --- Start of Auth Logic from original script ---
// Global State
let appState = {
    users: [],
    currentUser: null,
    isLogin: true,
};

// DOM Elements
const authElements = {
    loadingScreen: document.getElementById('loading-screen'),
    authScreen: document.getElementById('auth-screen'),
    taskManagerScreen: document.getElementById('task-manager-screen'),
    authForm: document.getElementById('auth-form'),
    authTitle: document.getElementById('auth-title'),
    authSubtitle: document.getElementById('auth-subtitle'),
    errorMessage: document.getElementById('error-message'),
    errorText: document.getElementById('error-text'),
    emailInput: document.getElementById('email'),
    passwordInput: document.getElementById('password'),
    confirmPasswordInput: document.getElementById('confirm-password'),
    confirmPasswordGroup: document.getElementById('confirm-password-group'),
    passwordToggle: document.getElementById('password-toggle'),
    submitBtn: document.getElementById('submit-btn'),
    submitText: document.getElementById('submit-text'),
    submitSpinner: document.getElementById('submit-spinner'),
    modeText: document.getElementById('mode-text'),
    modeToggleBtn: document.getElementById('mode-toggle-btn'),
    taskLogoutBtn: document.getElementById('task-logout-btn'),
};

// Utility Functions
function showElement(element) {
    element.classList.remove('hidden');
}

function hideElement(element) {
    element.classList.add('hidden');
}

function showError(message) {
    authElements.errorText.textContent = message;
    showElement(authElements.errorMessage);
}

function hideError() {
    hideElement(authElements.errorMessage);
}

function setLoading(isLoading) {
    if (isLoading) {
        hideElement(authElements.submitText);
        showElement(authElements.submitSpinner);
        authElements.submitBtn.disabled = true;
        authElements.emailInput.disabled = true;
        authElements.passwordInput.disabled = true;
        authElements.confirmPasswordInput.disabled = true;
        authElements.passwordToggle.disabled = true;
        authElements.modeToggleBtn.disabled = true;
    } else {
        showElement(authElements.submitText);
        hideElement(authElements.submitSpinner);
        authElements.submitBtn.disabled = false;
        authElements.emailInput.disabled = false;
        authElements.passwordInput.disabled = false;
        authElements.confirmPasswordInput.disabled = false;
        authElements.passwordToggle.disabled = false;
        authElements.modeToggleBtn.disabled = false;
    }
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function resetForm() {
    authElements.emailInput.value = '';
    authElements.passwordInput.value = '';
    authElements.confirmPasswordInput.value = '';
    hideError();
}

function toggleMode() {
    appState.isLogin = !appState.isLogin;
    
    if (appState.isLogin) {
        authElements.authTitle.textContent = 'ログイン';
        authElements.authSubtitle.textContent = 'アカウントにログインしてください';
        authElements.submitText.textContent = 'ログイン';
        authElements.modeText.textContent = 'アカウントをお持ちでない方は';
        authElements.modeToggleBtn.textContent = 'アカウント作成';
        hideElement(authElements.confirmPasswordGroup);
    } else {
        authElements.authTitle.textContent = 'アカウント作成';
        authElements.authSubtitle.textContent = '新しいアカウントを作成してください';
        authElements.submitText.textContent = 'アカウント作成';
        authElements.modeText.textContent = '既にアカウントをお持ちの方は';
        authElements.modeToggleBtn.textContent = 'ログイン';
        showElement(authElements.confirmPasswordGroup);
    }
    
    resetForm();
}

// Authentication Functions
async function handleLogin() {
    const email = authElements.emailInput.value.trim();
    const password = authElements.passwordInput.value;

    if (!email || !password) {
        showError('メールアドレスとパスワードを入力してください');
        return;
    }

    if (!isValidEmail(email)) {
        showError('有効なメールアドレスを入力してください');
        return;
    }

    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));

    try {
        const user = appState.users.find(u => u.email === email && u.password === password);

        if (user) {
            appState.currentUser = { email: user.email, uid: user.uid };
            showTaskManager();
            resetForm();
        } else {
            showError('メールアドレスまたはパスワードが間違っています');
        }
    } catch (error) {
        showError('ログイン中にエラーが発生しました');
    } finally {
        setLoading(false);
    }
}

async function handleSignup() {
    const email = authElements.emailInput.value.trim();
    const password = authElements.passwordInput.value;
    const confirmPassword = authElements.confirmPasswordInput.value;

    if (!email || !password || !confirmPassword) {
        showError('全ての項目を入力してください');
        return;
    }

    if (!isValidEmail(email)) {
        showError('有効なメールアドレスを入力してください');
        return;
    }

    if (password !== confirmPassword) {
        showError('パスワードが一致しません');
        return;
    }

    if (password.length < 6) {
        showError('パスワードは6文字以上で入力してください');
        return;
    }

    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));

    try {
        const existingUser = appState.users.find(u => u.email === email);
        if (existingUser) {
            showError('このメールアドレスは既に登録されています');
            return;
        }

        const newUser = {
            uid: Date.now().toString(),
            email,
            password,
            createdAt: new Date().toISOString()
        };

        appState.users.push(newUser);
        appState.currentUser = { email: newUser.email, uid: newUser.uid };
        
        showTaskManager();
        resetForm();
    } catch (error) {
        showError('アカウント作成中にエラーが発生しました');
    } finally {
        setLoading(false);
    }
}

function handleLogout() {
    appState.currentUser = null;
    showAuth();
}

// Screen Management
function showAuth() {
    hideElement(authElements.loadingScreen);
    hideElement(authElements.taskManagerScreen);
    showElement(authElements.authScreen);
}

function showTaskManager() {
    hideElement(authElements.loadingScreen);
    hideElement(authElements.authScreen);
    showElement(authElements.taskManagerScreen);
    
    if (!taskManager) {
        taskManager = new TaskManager();
        taskManager.init();
    }
}

function showLoading() {
    hideElement(authElements.authScreen);
    hideElement(authElements.taskManagerScreen);
    showElement(authElements.loadingScreen);
}

// --- End of Auth Logic ---


// --- Start of TaskManager Logic from new script ---
class TaskManager {
    constructor() {
        this.currentWeekStart = new Date();
        this.tasks = {};
        this.completedTasks = new Set();
        this.selectedDays = new Set();
        this.projects = new Set();
        this.currentEditingTask = null;
        this.theme = localStorage.getItem('theme') || 'light';
        this.searchQuery = '';
        this.priorityFilter = '';
        this.projectFilter = '';
    }

    async init() {
        await this.loadData();
        this.applyTheme();
        this.setupEventListeners();
        this.currentWeekStart = this.getMonday(new Date());
        this.render();
        this.showToast('アプリが起動しました', 'info');
    }

    // データベース操作
    async loadData() {
        return new Promise((resolve) => {
            const request = indexedDB.open('TaskManagerDB', 1);
            
            request.onerror = () => {
                console.error('Database error:', request.error);
                resolve();
            };
            
            request.onsuccess = (event) => {
                const db = event.target.result;
                const transaction = db.transaction(['tasks'], 'readonly');
                const store = transaction.objectStore('tasks');
                const getRequest = store.getAll();
                
                getRequest.onsuccess = () => {
                    const data = getRequest.result[0];
                    if (data) {
                        this.tasks = data.tasks || {};
                        this.completedTasks = new Set(data.completedTasks || []);
                        this.projects = new Set(data.projects || []);
                    }
                    resolve();
                };
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains('tasks')) {
                    db.createObjectStore('tasks', { keyPath: 'id' });
                }
            };
        });
    }

    async saveData() {
        return new Promise((resolve) => {
            const request = indexedDB.open('TaskManagerDB', 1);
            
            request.onsuccess = (event) => {
                const db = event.target.result;
                const transaction = db.transaction(['tasks'], 'readwrite');
                const store = transaction.objectStore('tasks');
                
                const data = {
                    id: 'main',
                    tasks: this.tasks,
                    completedTasks: Array.from(this.completedTasks),
                    projects: Array.from(this.projects),
                    lastUpdated: new Date().toISOString()
                };
                
                store.put(data);
                transaction.oncomplete = () => resolve();
            };
        });
    }

    // イベントリスナーの設定
    setupEventListeners() {
        // キーボードショートカット
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch(e.key) {
                    case 'n': e.preventDefault(); this.addNewTaskToToday(); break;
                    case 'f': e.preventDefault(); document.getElementById('search-input').focus(); break;
                    case 'ArrowLeft': e.preventDefault(); this.navigateWeek(-1); break;
                    case 'ArrowRight': e.preventDefault(); this.navigateWeek(1); break;
                    case 'Home': e.preventDefault(); this.navigateWeek(0); break;
                    case 'd': e.preventDefault(); this.toggleTheme(); break;
                    case 's': e.preventDefault(); this.openStatsModal(); break;
                    case 'e': e.preventDefault(); this.openDataModal(); break;
                }
            }
        });

        // 検索とフィルター
        document.getElementById('search-input').addEventListener('input', (e) => {
            this.searchQuery = e.target.value.toLowerCase();
            this.render();
        });

        document.getElementById('priority-filter').addEventListener('change', (e) => {
            this.priorityFilter = e.target.value;
            this.render();
        });

        document.getElementById('project-filter').addEventListener('change', (e) => {
            this.projectFilter = e.target.value;
            this.render();
        });

        // タスクフォームの送信
        document.getElementById('task-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveCurrentTask();
        });

        // ドラッグ&ドロップのセットアップ
        this.setupDragAndDrop();
    }

    // ドラッグ&ドロップ機能
    setupDragAndDrop() {
        document.addEventListener('dragstart', (e) => {
            if (e.target.classList.contains('task-item')) {
                e.target.classList.add('dragging');
                e.dataTransfer.setData('text/plain', e.target.dataset.taskId);
            }
        });

        document.addEventListener('dragend', (e) => {
            if (e.target.classList.contains('task-item')) {
                e.target.classList.remove('dragging');
            }
        });

        document.addEventListener('dragover', (e) => {
            e.preventDefault();
            const dayColumn = e.target.closest('.day-column');
            if (dayColumn) {
                dayColumn.classList.add('drag-over');
            }
        });

        document.addEventListener('dragleave', (e) => {
            const dayColumn = e.target.closest('.day-column');
            if (dayColumn && !dayColumn.contains(e.relatedTarget)) {
                dayColumn.classList.remove('drag-over');
            }
        });

        document.addEventListener('drop', (e) => {
            e.preventDefault();
            const dayColumn = e.target.closest('.day-column');
            if (dayColumn) {
                dayColumn.classList.remove('drag-over');
                const taskId = e.dataTransfer.getData('text/plain');
                const targetDateKey = dayColumn.dataset.dateKey;
                this.moveTask(taskId, targetDateKey);
            }
        });
    }

    moveTask(taskId, targetDateKey) {
        const [sourceDateKey, taskIndex] = taskId.split('-');
        const taskIndex2 = parseInt(taskIndex);
        
        if (sourceDateKey === targetDateKey) return;
        
        const task = this.tasks[sourceDateKey][taskIndex2];
        if (!task) return;
        
        // ソースから削除
        this.tasks[sourceDateKey].splice(taskIndex2, 1);
        if (this.tasks[sourceDateKey].length === 0) {
            delete this.tasks[sourceDateKey];
        }
        
        // ターゲットに追加
        if (!this.tasks[targetDateKey]) {
            this.tasks[targetDateKey] = [];
        }
        this.tasks[targetDateKey].push({...task});
        
        // 完了状態を更新
        this.completedTasks.delete(taskId);
        
        this.saveData();
        this.render();
        this.showToast('タスクを移動しました', 'success');
    }

    // ユーティリティ関数
    getMonday(date) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(d.setDate(diff));
    }

    formatDate(date, format = 'MM/DD') {
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const year = date.getFullYear();
        return format.replace('YYYY', year).replace('MM', month).replace('DD', day);
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // レンダリング
    render() {
        this.updateWeekInfo();
        this.generateDayColumns();
        this.updateProjectFilter();
    }

    updateWeekInfo() {
        const weekStart = this.getMonday(this.currentWeekStart);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        
        document.getElementById('current-week').textContent = 
            `${this.formatDate(weekStart)} - ${this.formatDate(weekEnd)}`;
        
        this.updateWeekStats();
    }

    updateWeekStats() {
        const weekStart = this.getMonday(this.currentWeekStart);
        let totalTasks = 0;
        let completedCount = 0;
        
        for (let i = 0; i < 7; i++) {
            const currentDay = new Date(weekStart);
            currentDay.setDate(currentDay.getDate() + i);
            const dateKey = this.formatDate(currentDay, 'YYYY-MM-DD');
            
            const dayTasks = this.tasks[dateKey] || [];
            totalTasks += dayTasks.length;
            
            dayTasks.forEach((task, index) => {
                const taskId = `${dateKey}-${index}`;
                if (this.completedTasks.has(taskId)) {
                    completedCount++;
                }
            });
        }
        
        const completionRate = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;
        const statsHtml = `
            <div style="display: flex; align-items: center; gap: 16px; font-size: 12px;">
                <div style="display: flex; align-items: center; gap: 4px;">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M3 3v18h18"/>
                        <path d="m19 9-5 5-4-4-3 3"/>
                    </svg>
                    ${totalTasks} タスク
                </div>
                <div style="display: flex; align-items: center; gap: 4px;">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="20,6 9,17 4,12"/>
                    </svg>
                    ${completedCount} 完了
                </div>
                <div style="display: flex; align-items: center; gap: 4px;">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="12" y1="2" x2="12" y2="6"/>
                        <line x1="12" y1="18" x2="12" y2="22"/>
                        <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/>
                        <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/>
                        <line x1="2" y1="12" x2="6" y2="12"/>
                        <line x1="18" y1="12" x2="22" y2="12"/>
                    </svg>
                    ${completionRate}%
                </div>
            </div>
        `;
        document.getElementById('week-stats').innerHTML = statsHtml;
    }

    generateDayColumns() {
        const dayNames = ['月', '火', '水', '木', '金', '土', '日'];
        const today = new Date();
        
        for (let i = 0; i < 7; i++) {
            const currentDay = new Date(this.getMonday(this.currentWeekStart));
            currentDay.setDate(currentDay.getDate() + i);
            const dateKey = this.formatDate(currentDay, 'YYYY-MM-DD');
            
            const dayColumn = document.getElementById(`day-${i}`);
            dayColumn.innerHTML = '';
            dayColumn.className = 'day-column';
            dayColumn.dataset.dateKey = dateKey;
            
            // 今日かどうかチェック
            if (currentDay.toDateString() === today.toDateString()) {
                dayColumn.classList.add('today');
            }
            
            // 選択状態を復元
            if (this.selectedDays.has(dateKey)) {
                dayColumn.classList.add('selected');
            }
            
            // 日付の統計を計算
            const dayTasks = this.tasks[dateKey] || [];
            const completedInDay = dayTasks.filter((task, index) => 
                this.completedTasks.has(`${dateKey}-${index}`)
            ).length;
            
            // ヘッダー
            const dayHeader = document.createElement('div');
            dayHeader.className = 'day-header';
            if (this.selectedDays.has(dateKey)) {
                dayHeader.classList.add('selected');
            }
            
            dayHeader.innerHTML = `
                <div class="day-name">${dayNames[i]}</div>
                <div class="day-date">${this.formatDate(currentDay)}</div>
                <div class="day-stats" style="display: flex; align-items: center; gap: 8px;">
                    <span style="display: flex; align-items: center; gap: 2px;">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                            <path d="m9 9 2 2 4-4"/>
                        </svg>
                        ${dayTasks.length}
                    </span>
                    <span style="display: flex; align-items: center; gap: 2px;">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="20,6 9,17 4,12"/>
                        </svg>
                        ${completedInDay}
                    </span>
                </div>
            `;
            dayColumn.appendChild(dayHeader);
            
            // タスクコンテナ
            const tasksContainer = document.createElement('div');
            tasksContainer.className = 'tasks-container';
            
            // フィルタリングされたタスクを表示
            const filteredTasks = this.getFilteredTasks(dateKey);
            filteredTasks.forEach((task, originalIndex) => {
                const taskElement = this.createTaskElement(dateKey, originalIndex, task);
                tasksContainer.appendChild(taskElement);
            });
            
            // 新しいタスク追加ボタン
            const addBtn = document.createElement('button');
            addBtn.className = 'add-task-btn animate-fade-in';
            addBtn.textContent = '+ タスクを追加';
            addBtn.onclick = () => this.addNewTask(dateKey);
            tasksContainer.appendChild(addBtn);
            
            dayColumn.appendChild(tasksContainer);
            
            // 日付選択のイベントリスナー
            dayHeader.addEventListener('click', (e) => {
                if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    this.toggleDaySelection(dateKey);
                }
            });
        }
    }

    getFilteredTasks(dateKey) {
        const dayTasks = this.tasks[dateKey] || [];
        return dayTasks.map((task, index) => ({...task, originalIndex: index}))
            .filter(task => {
                // 検索フィルター
                if (this.searchQuery && !task.text.toLowerCase().includes(this.searchQuery)) {
                    return false;
                }
                
                // 優先度フィルター
                if (this.priorityFilter && task.priority !== this.priorityFilter) {
                    return false;
                }
                
                // プロジェクトフィルター
                if (this.projectFilter && task.project !== this.projectFilter) {
                    return false;
                }
                
                return true;
            });
    }

    createTaskElement(dateKey, taskIndex, task) {
        const taskItem = document.createElement('div');
        taskItem.className = `task-item animate-slide-in priority-${task.priority || 'low'}`;
        taskItem.draggable = true;
        taskItem.dataset.taskId = `${dateKey}-${taskIndex}`;
        
        const taskId = `${dateKey}-${taskIndex}`;
        const isCompleted = this.completedTasks.has(taskId);
        
        // チェックボックス
        const checkbox = document.createElement('div');
        checkbox.className = `task-checkbox ${isCompleted ? 'checked' : ''}`;
        checkbox.onclick = (e) => {
            e.stopPropagation();
            this.toggleTaskCompletion(taskId, checkbox, taskItem);
        };
        
        // タスク内容エリア
        const contentArea = document.createElement('div');
        contentArea.style.flex = '1';
        
        // タスクテキスト
        const taskContent = document.createElement('div');
        taskContent.className = `task-content ${isCompleted ? 'completed' : ''}`;
        taskContent.textContent = task.text || '';
        contentArea.appendChild(taskContent);
        
        // メタデータ
        if (task.priority || task.project) {
            const taskMeta = document.createElement('div');
            taskMeta.className = 'task-meta';
            
            if (task.priority) {
                const priorityBadge = document.createElement('span');
                priorityBadge.className = `priority-badge priority-${task.priority}`;
                priorityBadge.textContent = {
                    high: '高',
                    medium: '中',
                    low: '低'
                }[task.priority];
                taskMeta.appendChild(priorityBadge);
            }
            
            if (task.project) {
                const projectTag = document.createElement('span');
                projectTag.className = 'project-tag';
                projectTag.textContent = task.project;
                taskMeta.appendChild(projectTag);
            }
            
            contentArea.appendChild(taskMeta);
        }
        
        taskItem.appendChild(checkbox);
        taskItem.appendChild(contentArea);
        
        // ダブルクリックで編集
        taskItem.addEventListener('dblclick', () => {
            this.openTaskModal(dateKey, taskIndex, task);
        });
        
        return taskItem;
    }

    // タスク管理
    addNewTask(dateKey) {
        if (!this.tasks[dateKey]) {
            this.tasks[dateKey] = [];
        }
        
        const newTask = {
            id: this.generateId(),
            text: '',
            priority: 'medium',
            project: '',
            createdAt: new Date().toISOString()
        };
        
        this.tasks[dateKey].push(newTask);
        this.openTaskModal(dateKey, this.tasks[dateKey].length - 1, newTask);
    }

    addNewTaskToToday() {
        const today = this.formatDate(new Date(), 'YYYY-MM-DD');
        this.addNewTask(today);
    }

    toggleTaskCompletion(taskId, checkbox, taskItem) {
        if (this.completedTasks.has(taskId)) {
            this.completedTasks.delete(taskId);
            checkbox.classList.remove('checked');
            taskItem.querySelector('.task-content').classList.remove('completed');
            this.showToast('タスクを未完了にしました', 'info');
        } else {
            this.completedTasks.add(taskId);
            checkbox.classList.add('checked');
            taskItem.querySelector('.task-content').classList.add('completed');
            taskItem.classList.add('animate-bounce');
            this.showToast('タスクを完了しました！', 'success');
            
            setTimeout(() => {
                taskItem.classList.remove('animate-bounce');
            }, 300);
        }
        
        this.saveData();
        this.updateWeekStats();
    }

    // モーダル管理
    openTaskModal(dateKey, taskIndex, task) {
        this.currentEditingTask = { dateKey, taskIndex, task };
        
        document.getElementById('task-text').value = task.text || '';
        document.getElementById('task-priority').value = task.priority || 'medium';
        document.getElementById('task-project').value = task.project || '';
        
        this.showModal('task-modal');
        document.getElementById('task-text').focus();
    }

    closeTaskModal() {
        this.hideModal('task-modal');
        this.currentEditingTask = null;
    }

    saveCurrentTask() {
        if (!this.currentEditingTask) return;
        
        const { dateKey, taskIndex } = this.currentEditingTask;
        const taskText = document.getElementById('task-text').value.trim();
        
        if (!taskText) {
            this.deleteCurrentTask();
            return;
        }
        
        const updatedTask = {
            ...this.currentEditingTask.task,
            text: taskText,
            priority: document.getElementById('task-priority').value,
            project: document.getElementById('task-project').value.trim(),
            updatedAt: new Date().toISOString()
        };
        
        this.tasks[dateKey][taskIndex] = updatedTask;
        
        // プロジェクトリストを更新
        if (updatedTask.project) {
            this.projects.add(updatedTask.project);
        }
        
        this.saveData();
        this.render();
        this.closeTaskModal();
        this.showToast('タスクを保存しました', 'success');
    }

    deleteCurrentTask() {
        if (!this.currentEditingTask) return;
        
        const { dateKey, taskIndex } = this.currentEditingTask;
        const taskId = `${dateKey}-${taskIndex}`;
        
        // 完了状態も削除
        this.completedTasks.delete(taskId);
        
        // タスクを削除
        this.tasks[dateKey].splice(taskIndex, 1);
        
        if (this.tasks[dateKey].length === 0) {
            delete this.tasks[dateKey];
        }
        
        this.saveData();
        this.render();
        this.closeTaskModal();
        this.showToast('タスクを削除しました', 'info');
    }

    // 複数日選択機能
    toggleDaySelection(dateKey) {
        if (this.selectedDays.has(dateKey)) {
            this.selectedDays.delete(dateKey);
        } else {
            this.selectedDays.add(dateKey);
        }
        
        this.render();
        this.updateMultiInputButton();
    }

    updateMultiInputButton() {
        const btn = document.getElementById('multi-input-btn');
        if (this.selectedDays.size > 1) {
            btn.style.display = 'inline-block';
            btn.textContent = `一括入力 (${this.selectedDays.size}日)`;
        } else {
            btn.style.display = 'none';
        }
    }

    openMultiInput() {
        if (this.selectedDays.size < 2) return;
        
        const dayNames = ['月', '火', '水', '木', '金', '土', '日'];
        let displayText = '';
        const sortedDays = Array.from(this.selectedDays).sort();
        
        sortedDays.forEach(dateKey => {
            const date = new Date(dateKey);
            const dayIndex = date.getDay() === 0 ? 6 : date.getDay() - 1;
            const dayName = dayNames[dayIndex];
            displayText += `${dayName}(${this.formatDate(date)}), `;
        });
        
        document.getElementById('selected-slots-display').textContent = 
            `選択中の日付: ${displayText.slice(0, -2)}`;
        
        this.showModal('multi-input-modal');
        document.getElementById('multi-task-text').focus();
    }

    closeMultiInput() {
        this.hideModal('multi-input-modal');
        document.getElementById('multi-task-text').value = '';
        document.getElementById('multi-task-priority').value = 'medium';
        document.getElementById('multi-task-project').value = '';
    }

    applyMultiInput() {
        const text = document.getElementById('multi-task-text').value.trim();
        if (!text) return;
        
        const priority = document.getElementById('multi-task-priority').value;
        const project = document.getElementById('multi-task-project').value.trim();
        
        let addedCount = 0;
        this.selectedDays.forEach(dateKey => {
            if (!this.tasks[dateKey]) {
                this.tasks[dateKey] = [];
            }
            
            this.tasks[dateKey].push({
                id: this.generateId(),
                text: text,
                priority: priority,
                project: project,
                createdAt: new Date().toISOString()
            });
            
            addedCount++;
        });
        
        if (project) {
            this.projects.add(project);
        }
        
        this.selectedDays.clear();
        this.saveData();
        this.render();
        this.closeMultiInput();
        this.showToast(`${addedCount}日にタスクを追加しました`, 'success');
    }

    // 週の移動
    navigateWeek(direction) {
        if (direction === 0) {
            // 今週
            this.currentWeekStart = new Date();
        } else {
            // 前週・次週
            this.currentWeekStart.setDate(this.currentWeekStart.getDate() + (direction * 7));
        }
        
        this.selectedDays.clear();
        this.render();
    }

    // プロジェクトフィルターの更新
    updateProjectFilter() {
        const select = document.getElementById('project-filter');
        const currentValue = select.value;
        
        select.innerHTML = '<option value="">全てのプロジェクト</option>';
        
        Array.from(this.projects).sort().forEach(project => {
            const option = document.createElement('option');
            option.value = project;
            option.textContent = project;
            if (project === currentValue) {
                option.selected = true;
            }
            select.appendChild(option);
        });
    }

    // テーマ切り替え
    toggleTheme() {
        this.theme = this.theme === 'light' ? 'dark' : 'light';
        this.applyTheme();
        localStorage.setItem('theme', this.theme);
        this.showToast(`${this.theme === 'light' ? 'ライト' : 'ダーク'}テーマに切り替えました`, 'info');
    }

    applyTheme() {
        document.body.setAttribute('data-theme', this.theme);
        const themeBtn = document.querySelector('.nav-btn[onclick="toggleTheme()"]');
        if (themeBtn) {
            const icon = this.theme === 'light' ? 
                '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>' :
                '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>';
            themeBtn.innerHTML = icon;
        }
    }

    // 統計モーダル
    openStatsModal() {
        const stats = this.calculateStats();
        const statsContent = document.getElementById('stats-content');
        
        statsContent.innerHTML = `
            <div class="stat-card">
                <div class="stat-number">${stats.totalTasks}</div>
                <div class="stat-label">総タスク数</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${stats.completedTasks}</div>
                <div class="stat-label">完了タスク数</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${stats.completionRate}%</div>
                <div class="stat-label">完了率</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${stats.projectCount}</div>
                <div class="stat-label">プロジェクト数</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${stats.highPriorityTasks}</div>
                <div class="stat-label">高優先度タスク</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${stats.averageTasksPerDay}</div>
                <div class="stat-label">1日平均タスク数</div>
            </div>
        `;
        
        this.showModal('stats-modal');
    }

    closeStatsModal() {
        this.hideModal('stats-modal');
    }

    calculateStats() {
        let totalTasks = 0;
        let completedTasks = 0;
        let highPriorityTasks = 0;
        let daysWithTasks = 0;
        
        Object.values(this.tasks).forEach(dayTasks => {
            if (dayTasks.length > 0) daysWithTasks++;
            dayTasks.forEach((task, index) => {
                totalTasks++;
                if (task.priority === 'high') highPriorityTasks++;
            });
        });
        
        Object.keys(this.tasks).forEach(dateKey => {
            this.tasks[dateKey].forEach((task, index) => {
                const taskId = `${dateKey}-${index}`;
                if (this.completedTasks.has(taskId)) {
                    completedTasks++;
                }
            });
        });
        
        const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        const averageTasksPerDay = daysWithTasks > 0 ? Math.round((totalTasks / daysWithTasks) * 10) / 10 : 0;
        
        return {
            totalTasks,
            completedTasks,
            completionRate,
            projectCount: this.projects.size,
            highPriorityTasks,
            averageTasksPerDay
        };
    }

    // データ管理モーダル
    openDataModal() {
        this.showModal('data-modal');
    }

    closeDataModal() {
        this.hideModal('data-modal');
    }

    exportData() {
        const data = {
            tasks: this.tasks,
            completedTasks: Array.from(this.completedTasks),
            projects: Array.from(this.projects),
            exportedAt: new Date().toISOString(),
            version: '1.0'
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tasks_backup_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        this.showToast('データをエクスポートしました', 'success');
    }

    importData(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                
                if (data.tasks) {
                    this.tasks = data.tasks;
                }
                if (data.completedTasks) {
                    this.completedTasks = new Set(data.completedTasks);
                }
                if (data.projects) {
                    this.projects = new Set(data.projects);
                }
                
                this.saveData();
                this.render();
                this.showToast('データをインポートしました', 'success');
                this.closeDataModal();
            } catch (error) {
                this.showToast('データの読み込みに失敗しました', 'error');
                console.error('Import error:', error);
            }
        };
        reader.readAsText(file);
    }

    clearAllData() {
        if (!confirm('本当に全てのデータを削除しますか？この操作は取り消せません。')) {
            return;
        }
        
        this.tasks = {};
        this.completedTasks = new Set();
        this.projects = new Set();
        this.selectedDays = new Set();
        
        this.saveData();
        this.render();
        this.closeDataModal();
        this.showToast('全てのデータを削除しました', 'info');
    }

    // ショートカットモーダル
    openShortcutsModal() {
        this.showModal('shortcuts-modal');
    }

    closeShortcutsModal() {
        this.hideModal('shortcuts-modal');
    }

    // モーダルユーティリティ
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        modal.style.display = 'flex';
        setTimeout(() => modal.classList.add('show'), 10);
        
        // ESCキーでモーダルを閉じる
        const closeOnEsc = (e) => {
            if (e.key === 'Escape') {
                this.hideModal(modalId);
                document.removeEventListener('keydown', closeOnEsc);
            }
        };
        document.addEventListener('keydown', closeOnEsc);
    }

    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        modal.classList.remove('show');
        setTimeout(() => modal.style.display = 'none', 200);
    }

    // トースト通知
    showToast(message, type = 'info') {
        const existingToast = document.querySelector('.toast');
        if (existingToast) {
            existingToast.remove();
        }
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => toast.classList.add('show'), 100);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

// --- End of TaskManager Logic ---


// --- Start of Global functions from new script ---
let taskManager;

function navigateWeek(direction) {
    taskManager.navigateWeek(direction);
}

function toggleTheme() {
    taskManager.toggleTheme();
}

function openMultiInput() {
    taskManager.openMultiInput();
}

function closeMultiInput() {
    taskManager.closeMultiInput();
}

function applyMultiInput() {
    taskManager.applyMultiInput();
}

function closeTaskModal() {
    taskManager.closeTaskModal();
}

function deleteCurrentTask() {
    taskManager.deleteCurrentTask();
}

function openStatsModal() {
    taskManager.openStatsModal();
}

function closeStatsModal() {
    taskManager.closeStatsModal();
}

function openDataModal() {
    taskManager.openDataModal();
}

function closeDataModal() {
    taskManager.closeDataModal();
}

function exportData() {
    taskManager.exportData();
}

function importData(event) {
    taskManager.importData(event);
}

function clearAllData() {
    taskManager.clearAllData();
}

function openShortcutsModal() {
    taskManager.openShortcutsModal();
}

function closeShortcutsModal() {
    taskManager.closeShortcutsModal();
}

// --- End of Global functions from new script ---


// --- Start of App Initialization ---
function initEventListeners() {
    // Auth Form submission
    authElements.authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (appState.isLogin) {
            await handleLogin();
        } else {
            await handleSignup();
        }
    });

    // Password visibility toggle
    authElements.passwordToggle.addEventListener('click', () => {
        const passwordField = authElements.passwordInput;
        const icon = authElements.passwordToggle.querySelector('span');
        
        if (passwordField.type === 'password') {
            passwordField.type = 'text';
            icon.className = 'icon-eye-off';
        } else {
            passwordField.type = 'password';
            icon.className = 'icon-eye';
        }
    });

    // Mode toggle
    authElements.modeToggleBtn.addEventListener('click', toggleMode);

    // Logout button
    authElements.taskLogoutBtn.addEventListener('click', handleLogout);
}

function initApp() {
    showLoading();
    
    // Add some demo data for testing
    const demoUser = {
        uid: 'demo-user-1',
        email: 'demo@example.com',
        password: 'demo',
        createdAt: new Date().toISOString()
    };
    appState.users.push(demoUser);
    
    // Simulate initial loading
    setTimeout(() => {
        if (appState.currentUser) {
            showTaskManager();
        } else {
            showAuth();
        }
    }, 1000);
}

document.addEventListener('DOMContentLoaded', () => {
    initEventListeners();
    initApp();
});
