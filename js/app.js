// 全局变量
let allWords = []; // 所有单词
let initialWords = []; // 初始输入的所有单词
let unknownWords = []; // 不会的单词
let currentWordIndex = 0; // 当前单词索引
let currentRound = 1; // 当前轮次
let isButtonDisabled = false; // 按钮是否被禁用
let isFromHistory = false; // 是否从历史记录进入
let navigationPath = ['主页']; // 导航路径

// DOM 元素
const inputPage = document.getElementById('input-page');
const historyPage = document.getElementById('history-page');
const dictationPage = document.getElementById('dictation-page');
const confirmationPage = document.getElementById('confirmation-page');
const resultPage = document.getElementById('result-page');

const wordsInput = document.getElementById('words-input');
const startDictationBtn = document.getElementById('start-dictation');
const loadHistoryBtn = document.getElementById('load-history');
const historyList = document.getElementById('history-list');
const breadcrumbPath = document.getElementById('breadcrumb-path');
const exportHistoryBtn = document.getElementById('export-history');
const importHistoryInput = document.getElementById('import-history-input');

const progressText = document.getElementById('progress');
const unknownCountText = document.getElementById('unknown-count');
const wordCard = document.getElementById('word-card');
const wordPinyin = document.getElementById('word-pinyin');
const prevBtn = document.getElementById('prev-btn');
const unknownBtn = document.getElementById('unknown-btn');
const nextBtn = document.getElementById('next-btn');

const allWordsList = document.getElementById('all-words-list');
const unknownWordsList = document.getElementById('unknown-words-list');
const nextRoundBtn = document.getElementById('next-round-btn');
const startDictationFromHistoryBtn = document.getElementById('start-dictation-btn');
const finishBtn = document.getElementById('finish-btn');

const resultWordsList = document.getElementById('result-words-list');
const saveResultBtn = document.getElementById('save-result-btn');
const newDictationBtn = document.getElementById('new-dictation-btn');

const toastContainer = document.getElementById('toast-container');
const modalBackdrop = document.getElementById('modal-backdrop');
const modalContainer = document.getElementById('modal-container');
const modalTitle = document.getElementById('modal-title');
const modalMessage = document.getElementById('modal-message');
const modalInput = document.getElementById('modal-input');
const modalCancel = document.getElementById('modal-cancel');
const modalConfirm = document.getElementById('modal-confirm');

/**
 * 显示 Toast 通知
 * @param {string} message - 消息内容
 * @param {string} type - 消息类型 'info' | 'success' | 'error' | 'warning'
 * @param {number} duration - 持续时间(毫秒)
 */
function showToast(message, type = 'info', duration = 3000) {
    // 创建 toast 元素
    const toast = document.createElement('div');
    toast.className = `animate-fade-in-up rounded-lg shadow-md p-3 flex items-center gap-2 max-w-xs`;
    
    // 根据类型设置样式
    let bgColor, textColor, icon;
    switch (type) {
        case 'success':
            bgColor = 'bg-success-light';
            textColor = 'text-success-dark';
            icon = `<svg class="w-5 h-5 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                    </svg>`;
            break;
        case 'error':
            bgColor = 'bg-danger-light';
            textColor = 'text-danger-dark';
            icon = `<svg class="w-5 h-5 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>`;
            break;
        case 'warning':
            bgColor = 'bg-yellow-100';
            textColor = 'text-yellow-800';
            icon = `<svg class="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                    </svg>`;
            break;
        default: // info
            bgColor = 'bg-primary-light';
            textColor = 'text-primary-dark';
            icon = `<svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>`;
    }
    
    toast.classList.add(bgColor, textColor);
    toast.innerHTML = `${icon}<span>${message}</span>`;
    
    // 添加到容器
    toastContainer.appendChild(toast);
    
    // 设置自动消失
    setTimeout(() => {
        toast.classList.remove('animate-fade-in-up');
        toast.classList.add('animate-fade-out-down');
        
        // 移除元素
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, duration);
}

/**
 * 显示自定义确认对话框 (替代 window.confirm)
 * @param {string} message - 消息内容
 * @param {string} title - 标题 (可选)
 * @param {string} confirmText - 确认按钮文本 (可选)
 * @param {string} cancelText - 取消按钮文本 (可选)
 * @returns {Promise<boolean>} - 用户选择确认返回 true，取消返回 false
 */
function showConfirm(message, title = '确认操作', confirmText = '确认', cancelText = '取消') {
    return new Promise((resolve) => {
        // 设置对话框内容
        modalTitle.textContent = title;
        modalMessage.textContent = message;
        modalInput.classList.add('hidden');
        
        // 修改按钮文本
        modalCancel.textContent = cancelText;
        modalConfirm.textContent = confirmText;
        
        // 显示对话框
        modalBackdrop.classList.remove('hidden');
        
        // 按钮事件
        const handleConfirm = () => {
            modalBackdrop.classList.add('hidden');
            cleanup();
            resolve(true);
        };
        
        const handleCancel = () => {
            modalBackdrop.classList.add('hidden');
            cleanup();
            resolve(false);
        };
        
        const handleOutsideClick = (e) => {
            if (e.target === modalBackdrop) {
                handleCancel();
            }
        };
        
        // 添加事件监听
        modalConfirm.addEventListener('click', handleConfirm);
        modalCancel.addEventListener('click', handleCancel);
        modalBackdrop.addEventListener('click', handleOutsideClick);
        
        // 清理函数
        function cleanup() {
            modalConfirm.removeEventListener('click', handleConfirm);
            modalCancel.removeEventListener('click', handleCancel);
            modalBackdrop.removeEventListener('click', handleOutsideClick);
        }
    });
}

/**
 * 显示自定义输入对话框 (替代 window.prompt)
 * @param {string} message - 消息内容
 * @param {string} defaultValue - 默认值 (可选)
 * @param {string} title - 标题 (可选)
 * @param {string} confirmText - 确认按钮文本 (可选)
 * @param {string} cancelText - 取消按钮文本 (可选)
 * @returns {Promise<string|null>} - 用户输入的值，取消返回 null
 */
function showPrompt(message, defaultValue = '', title = '请输入', confirmText = '确认', cancelText = '取消') {
    return new Promise((resolve) => {
        // 设置对话框内容
        modalTitle.textContent = title;
        modalMessage.textContent = message;
        modalInput.value = defaultValue;
        modalInput.classList.remove('hidden');
        
        // 修改按钮文本
        modalCancel.textContent = cancelText;
        modalConfirm.textContent = confirmText;
        
        // 显示对话框
        modalBackdrop.classList.remove('hidden');
        
        // 聚焦输入框
        setTimeout(() => {
            modalInput.focus();
        }, 100);
        
        // 按钮事件
        const handleConfirm = () => {
            const value = modalInput.value;
            modalBackdrop.classList.add('hidden');
            cleanup();
            resolve(value);
        };
        
        const handleCancel = () => {
            modalBackdrop.classList.add('hidden');
            cleanup();
            resolve(null);
        };
        
        const handleOutsideClick = (e) => {
            if (e.target === modalBackdrop) {
                handleCancel();
            }
        };
        
        const handleKeydown = (e) => {
            if (e.key === 'Enter') {
                handleConfirm();
            } else if (e.key === 'Escape') {
                handleCancel();
            }
        };
        
        // 添加事件监听
        modalConfirm.addEventListener('click', handleConfirm);
        modalCancel.addEventListener('click', handleCancel);
        modalBackdrop.addEventListener('click', handleOutsideClick);
        modalInput.addEventListener('keydown', handleKeydown);
        
        // 清理函数
        function cleanup() {
            modalConfirm.removeEventListener('click', handleConfirm);
            modalCancel.removeEventListener('click', handleCancel);
            modalBackdrop.removeEventListener('click', handleOutsideClick);
            modalInput.removeEventListener('keydown', handleKeydown);
        }
    });
}

// 防止按钮短时间内被连续点击的函数
function debounceButton(button, callback, delay = 500) {
    if (isButtonDisabled) return;
    
    // 添加视觉反馈
    button.classList.add('button-active');
    
    // 禁用所有按钮
    isButtonDisabled = true;
    
    // 执行回调函数
    callback();
    
    // 视觉反馈持续200毫秒
    setTimeout(() => {
        button.classList.remove('button-active');
    }, 200);
    
    // 防呆间隔保持500毫秒
    setTimeout(() => {
        isButtonDisabled = false;
    }, delay);
}

// 汉字转拼音函数（简化版，实际应用中可能需要更复杂的转换库）
function toPinyin(word) {
    // 这里只是一个简单的模拟，实际应用中应该使用专业的汉字转拼音库
    // 由于这是静态HTML，我们假设用户输入的单词格式为：汉字(拼音)
    // 例如：苹果(píng guǒ)
    const match = word.match(/^(.*?)\((.*?)\)$/);
    if (match && match[2]) {
        return match[2]; // 返回括号中的拼音部分
    }
    
    // 如果没有按照格式输入，则返回原词，提示用户
    showToast(`请按照"汉字(拼音)"的格式输入单词，例如：苹果(píng guǒ)`, 'warning');
    return word;
}

// 开始听写
function startDictation() {
    const wordsText = wordsInput.value.trim();
    if (!wordsText) {
        showToast('请输入单词！', 'error');
        return;
    }

    // 解析输入的单词，支持英文逗号、中文逗号和顿号分隔
    allWords = wordsText.split(/[,，、]/).map(word => ({
        word: word.trim(),
        pinyin: toPinyin(word.trim()),
        forgottenCount: 0,
        isUnknown: false
    }));

    initialWords = [...allWords]; // store the initial input words list

    unknownWords = [];
    currentWordIndex = 0;
    currentRound = 1;

    // 显示听写页面
    showPage(dictationPage);
    updateBreadcrumb(['主页', '听写']);
    updateDictationUI();
}

// 更新听写界面
function updateDictationUI() {
    if (currentWordIndex >= allWords.length) {
        // 当前轮次结束，进入确认页面
        showConfirmationPage();
        return;
    }

    const currentWord = allWords[currentWordIndex];
    progressText.textContent = `${currentWordIndex + 1}/${allWords.length}`;
    unknownCountText.textContent = `不会：${unknownWords.length}`;
    wordPinyin.textContent = currentWord.pinyin;
    
    // 更新“上一个”按钮的禁用状态
    prevBtn.disabled = currentWordIndex === 0;
    
    // 更新卡片背景色和“不会”按钮状态
    if (currentWord.isUnknown) {
        // 已标记为不会：卡片背景浅粉红色，禁用“不会”按钮
        wordCard.classList.remove('bg-white');
        wordCard.classList.add('bg-danger-light');
        unknownBtn.disabled = true;
    } else {
        // 未标记：卡片背景白色，启用“不会”按钮
        wordCard.classList.remove('bg-danger-light');
        wordCard.classList.add('bg-white');
        unknownBtn.disabled = false;
    }
}

// 标记为不会
function markAsUnknown() {
    const currentWord = allWords[currentWordIndex];
    
    // 只有当该词在本轮次中尚未被标记为"不会"时，才增加遗忘度
    if (!currentWord.isUnknown) {
        currentWord.isUnknown = true;
        currentWord.forgottenCount += 1;
        
        // 添加到不会列表
        if (!unknownWords.some(w => w.word === currentWord.word)) {
            unknownWords.push(currentWord);
        }
    }
    
    // 进入下一个单词
    currentWordIndex++;
    updateDictationUI();
}

// 下一个单词
function nextWord() {
    const currentWord = allWords[currentWordIndex];
    
    // 只有当该词尚未被标记为"不会"时，才将其标记为"会了"
    // 如果已经标记为"不会"，则保持其状态不变，只是跳到下一个词
    if (!currentWord.isUnknown) {
        currentWord.isUnknown = false;
        
        // 从不会列表中移除（以防万一）
        const index = unknownWords.findIndex(w => w.word === currentWord.word);
        if (index !== -1) {
            unknownWords.splice(index, 1);
        }
    }
    
    currentWordIndex++;
    updateDictationUI();
}

// 上一个单词
function prevWord() {
    if (currentWordIndex > 0) {
        currentWordIndex--;
        updateDictationUI();
    }
}

// 显示确认页面
function showConfirmationPage() {
    showPage(confirmationPage);
    
    // 更新所有单词列表 - 显示初始输入的所有单词，按遗忘度分组
    allWordsList.innerHTML = '';
    
    // 获取所有单词的最新状态
    const wordsWithCurrentState = initialWords.map(initialWord => {
        // 查找当前单词在allWords中的状态
        const currentWordState = allWords.find(w => w.word === initialWord.word) || initialWord;
        return currentWordState;
    });
    
    // 按遗忘度分组
    const groupedWords = {};
    wordsWithCurrentState.forEach(word => {
        const forgottenCount = word.forgottenCount;
        if (!groupedWords[forgottenCount]) {
            groupedWords[forgottenCount] = [];
        }
        groupedWords[forgottenCount].push(word);
    });
    
    // 按遗忘度从高到低排序并显示
    Object.keys(groupedWords)
        .map(Number)
        .sort((a, b) => b - a)
        .forEach(forgottenCount => {
            // 创建分组标题
            const groupTitle = document.createElement('div');
            groupTitle.className = 'col-span-full font-semibold text-lg mt-3 mb-2 text-neutral-darker';
            groupTitle.textContent = forgottenCount === 0 ? 
                '已掌握的单词 (遗忘度: 0)' : 
                `遗忘度 ${forgottenCount} 的单词`;
            allWordsList.appendChild(groupTitle);
            
            // 添加该组的单词
            groupedWords[forgottenCount].forEach(word => {
                const wordItem = document.createElement('div');
                
                // 决定颜色: 遗忘度越高颜色越深
                let bgColorClass = 'bg-neutral-lightest';
                if (word.isUnknown) {
                    bgColorClass = 'bg-danger-light';
                } else if (forgottenCount > 0) {
                    // 根据遗忘度设置不同深度的颜色
                    if (forgottenCount >= 3) {
                        bgColorClass = 'bg-danger-light';
                    } else if (forgottenCount == 2) {
                        bgColorClass = 'bg-neutral-light';
                    } else if (forgottenCount == 1) {
                        bgColorClass = 'bg-success-light';
                    }
                }
                
                wordItem.className = `p-3 border border-neutral-light rounded-lg ${bgColorClass} cursor-pointer hover:shadow-sm transition`;
                wordItem.textContent = `${word.word} (${word.forgottenCount})`;
                wordItem.addEventListener('click', () => {
                    // 无论是否从历史记录进入，点击都应该添加到不会列表
                    if (!word.isUnknown) {
                        word.isUnknown = true;
                        
                        // 只有在正常听写流程中才增加遗忘度，从历史记录选择时不增加
                        if (!isFromHistory) {
                            word.forgottenCount += 1;
                        }
                        
                        wordItem.classList.remove('bg-neutral-lightest', 'bg-danger-light', 'bg-neutral-light', 'bg-success-light');
                        wordItem.classList.add('bg-danger-light');
                        
                        // 如果不在不会列表中，添加到不会列表
                        if (!unknownWords.some(w => w.word === word.word)) {
                            unknownWords.push(word);
                            updateUnknownWordsList();
                        }
                        
                        // 重新显示确认页面以更新分组
                        showConfirmationPage();
                    }
                });
                allWordsList.appendChild(wordItem);
            });
        });
    
    // 更新不会的单词列表
    updateUnknownWordsList();
    
    // 根据来源和不会的单词数量显示不同的按钮
    if (isFromHistory) {
        // 从历史记录加载，显示"进入听写"按钮
        nextRoundBtn.classList.add('hidden');
        finishBtn.classList.add('hidden');
        startDictationFromHistoryBtn.classList.remove('hidden');
        
        // 如果不会的单词列表为空，禁用"进入听写"按钮
        if (unknownWords.length === 0) {
            startDictationFromHistoryBtn.disabled = true;
            startDictationFromHistoryBtn.classList.add('opacity-50', 'cursor-not-allowed');
        } else {
            startDictationFromHistoryBtn.disabled = false;
            startDictationFromHistoryBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        }
    } else {
        // 正常听写流程
        startDictationFromHistoryBtn.classList.add('hidden');
        
        if (unknownWords.length === 0) {
            nextRoundBtn.classList.add('hidden');
            finishBtn.classList.remove('hidden');
        } else {
            nextRoundBtn.classList.remove('hidden');
            finishBtn.classList.add('hidden');
        }
    }
    
    // 更新面包屑导航
    if (isFromHistory) {
        updateBreadcrumb(['主页', '历史记录', '听写确认']);
    } else {
        updateBreadcrumb(['主页', '听写', '听写确认']);
    }
}

// 从历史记录开始听写
async function startDictationFromHistory() {
    if (unknownWords.length === 0) {
        showToast('请先选择需要听写的单词！', 'error');
        return;
    }
    
    // 只听写选中的单词，重置本轮状态
    allWords = unknownWords.map(word => ({
        ...word,
        isUnknown: false  // 本轮尚未标记
    }));
    
    // 本轮不会的词从0开始
    unknownWords = [];
    currentWordIndex = 0;
    currentRound = 1;
    isFromHistory = false; // 重置标记，进入正常听写流程
    
    // 显示听写页面
    showPage(dictationPage);
    updateBreadcrumb(['主页', '历史记录', '听写确认', '听写']);
    updateDictationUI();
}

// 开始下一轮
function startNextRound() {
    if (unknownWords.length === 0) {
        showResults();
        return;
    }
    
    // 只听写上一轮不会的单词，重置本轮状态
    allWords = unknownWords.map(word => ({
        ...word,
        isUnknown: false  // 本轮尚未标记
    }));
    
    // 本轮不会的词从0开始
    unknownWords = [];
    currentWordIndex = 0;
    currentRound++;
    
    // 显示听写页面
    showPage(dictationPage);
    updateDictationUI();
}

// 更新不会的单词列表
function updateUnknownWordsList() {
    unknownWordsList.innerHTML = '';
    unknownWords.forEach(word => {
        const wordItem = document.createElement('div');
        
        // 根据遗忘度设置不同深度的颜色
        let bgColorClass = 'bg-danger-light';
        if (word.forgottenCount >= 3) {
            bgColorClass = 'bg-danger';
        } else if (word.forgottenCount == 2) {
            bgColorClass = 'bg-danger-light';
        } else if (word.forgottenCount == 1) {
            bgColorClass = 'bg-danger-light bg-opacity-50';
        }
        
        wordItem.className = `p-3 border border-neutral-light rounded-lg ${bgColorClass} text-neutral-darker`;
        wordItem.textContent = `${word.word} (${word.forgottenCount})`;
        unknownWordsList.appendChild(wordItem);
    });
}

// 显示结果
function showResults() {
    showPage(resultPage);
    
    // 更新结果列表 - 使用初始单词列表，但显示最新的遗忘度，并按遗忘度分组
    resultWordsList.innerHTML = '';
    
    // 创建一个包含所有初始单词最新状态的数组
    const resultWords = initialWords.map(initialWord => {
        // 查找当前单词在allWords中的最新状态
        const currentState = allWords.find(w => w.word === initialWord.word);
        // 如果找到了，使用最新状态，否则使用初始状态
        return currentState || initialWord;
    });
    
    // 按遗忘度分组
    const groupedWords = {};
    resultWords.forEach(word => {
        const forgottenCount = word.forgottenCount;
        if (!groupedWords[forgottenCount]) {
            groupedWords[forgottenCount] = [];
        }
        groupedWords[forgottenCount].push(word);
    });
    
    // 按遗忘度从高到低排序并显示
    Object.keys(groupedWords)
        .map(Number)
        .sort((a, b) => b - a)
        .forEach(forgottenCount => {
            // 创建分组标题
            const groupTitle = document.createElement('div');
            groupTitle.className = 'col-span-full font-semibold text-lg mt-3 mb-2 text-neutral-darker';
            groupTitle.textContent = forgottenCount === 0 ? 
                '已掌握的单词 (遗忘度: 0)' : 
                `遗忘度 ${forgottenCount} 的单词`;
            resultWordsList.appendChild(groupTitle);
            
            // 添加该组的单词
            groupedWords[forgottenCount].forEach(word => {
                const wordItem = document.createElement('div');
                
                // 决定颜色: 遗忘度越高颜色越深
                let bgColorClass = 'bg-success-light';
                if (forgottenCount >= 3) {
                    bgColorClass = 'bg-danger';
                } else if (forgottenCount == 2) {
                    bgColorClass = 'bg-danger-light';
                } else if (forgottenCount == 1) {
                    bgColorClass = 'bg-neutral-light';
                }
                
                wordItem.className = `p-3 border border-neutral-light rounded-lg ${bgColorClass} hover:shadow-sm transition`;
                wordItem.textContent = `${word.word} (${word.forgottenCount})`;
                resultWordsList.appendChild(wordItem);
            });
        });
    
    // 更新面包屑导航
    if (isFromHistory) {
        updateBreadcrumb(['主页', '历史记录', '听写确认', '听写', '结果']);
    } else {
        updateBreadcrumb(['主页', '听写', '听写确认', '结果']);
    }
}

// 保存结果到 IndexedDB
async function saveResults() {
    const timestamp = new Date().toISOString();
    
    // 创建一个包含所有初始单词最新状态的数组
    const finalWords = initialWords.map(initialWord => {
        // 查找当前单词在allWords中的最新状态
        const currentState = allWords.find(w => w.word === initialWord.word);
        // 如果找到了，使用最新状态，否则使用初始状态
        return currentState || initialWord;
    });
    
    const dictationData = {
        id: timestamp,
        date: timestamp,
        words: finalWords,
        notes: '' // 添加空备注字段
    };
    
    // 打开或创建 IndexedDB 数据库
    const request = indexedDB.open('DictationAssistant', 1);
    
    request.onupgradeneeded = function(event) {
        const db = event.target.result;
        // 创建对象存储空间
        if (!db.objectStoreNames.contains('dictations')) {
            db.createObjectStore('dictations', { keyPath: 'id' });
        }
    };
    
    request.onsuccess = function(event) {
        const db = event.target.result;
        const transaction = db.transaction(['dictations'], 'readwrite');
        const store = transaction.objectStore('dictations');
        
        // 添加数据
        const addRequest = store.add(dictationData);
        
        addRequest.onsuccess = function() {
            showToast('听写结果已保存！', 'success');
        };
        
        addRequest.onerror = function() {
            showToast('保存失败，请重试！', 'error');
        };
    };
    
    request.onerror = function() {
        showToast('数据库打开失败，请重试！', 'error');
    };
}

// 加载历史记录
function loadHistory() {
    showPage(historyPage);
    updateBreadcrumb(['主页', '历史记录']);
    historyList.innerHTML = '';
    
    // 打开 IndexedDB 数据库
    const request = indexedDB.open('DictationAssistant', 1);
    
    request.onsuccess = function(event) {
        const db = event.target.result;
        const transaction = db.transaction(['dictations'], 'readonly');
        const store = transaction.objectStore('dictations');
        
        // 获取所有记录
        const getAllRequest = store.getAll();
        
        getAllRequest.onsuccess = function() {
            const dictations = getAllRequest.result;
            
            if (dictations.length === 0) {
                historyList.innerHTML = '<p class="text-neutral-dark py-4 text-center">暂无历史记录</p>';
                return;
            }
            
            // 按日期降序排序
            dictations.sort((a, b) => new Date(b.date) - new Date(a.date));
            
            // 显示历史记录
            dictations.forEach(dictation => {
                const date = new Date(dictation.date).toLocaleString();
                const wordCount = dictation.words.length;
                const unknownCount = dictation.words.filter(w => w.forgottenCount > 0).length;
                
                const historyItem = document.createElement('div');
                historyItem.className = 'p-4 border-b border-neutral-light hover:bg-neutral-lightest rounded-lg mb-2 transition';
                
                // 添加备注和主要信息
                historyItem.innerHTML = `
                    <div class="flex justify-between items-center mb-2">
                        <span class="font-medium text-neutral-darker">${date}</span>
                        <span class="text-neutral-dark">共 ${wordCount} 个单词，不会 ${unknownCount} 个</span>
                    </div>
                    <div class="notes-container mb-2 ${dictation.notes ? '' : 'hidden'}">
                        <p class="text-sm text-neutral italic bg-neutral-lightest p-2 rounded-lg">${dictation.notes || ''}</p>
                    </div>
                    <div class="flex flex-wrap gap-2">
                        <button class="view-btn bg-primary hover:bg-primary-dark text-white text-sm py-1.5 px-3 rounded-lg transition">查看</button>
                        <button class="copy-btn bg-white border border-primary text-primary hover:bg-primary-light hover:text-primary-dark text-sm py-1.5 px-3 rounded-lg transition">复制</button>
                        <button class="notes-btn bg-neutral-light hover:bg-neutral text-neutral-darker text-sm py-1.5 px-3 rounded-lg transition">${dictation.notes ? '修改备注' : '添加备注'}</button>
                        <button class="delete-btn bg-danger hover:bg-danger-dark text-white text-sm py-1.5 px-3 rounded-lg transition">删除</button>
                    </div>
                `;
                
                // 查看按钮事件
                historyItem.querySelector('.view-btn').addEventListener('click', () => {
                    loadHistoryItem(dictation);
                });
                
                // 复制到剪贴板按钮事件
                historyItem.querySelector('.copy-btn').addEventListener('click', () => {
                    copyToClipboard(dictation);
                });
                
                // 添加/修改备注按钮事件
                historyItem.querySelector('.notes-btn').addEventListener('click', () => {
                    addEditNotes(dictation);
                });
                
                // 删除按钮事件
                historyItem.querySelector('.delete-btn').addEventListener('click', () => {
                    deleteHistoryItem(dictation.id);
                });
                
                historyList.appendChild(historyItem);
            });
        };
        
        getAllRequest.onerror = function() {
            historyList.innerHTML = '<p class="text-danger py-4 text-center">加载历史记录失败</p>';
        };
    };
    
    request.onerror = function() {
        historyList.innerHTML = '<p class="text-danger py-4 text-center">数据库打开失败</p>';
    };
}

// 复制历史记录到剪贴板
function copyToClipboard(dictation) {
    // 创建一个JSON对象
    const clipboardData = {
        date: dictation.date,
        formattedDate: new Date(dictation.date).toLocaleString(),
        notes: dictation.notes || '',
        words: []
    };
    
    // 处理单词数据
    dictation.words.forEach(word => {
        // 提取汉字和拼音
        const match = word.word.match(/^(.*?)\((.*?)\)$/);
        let hanzi = word.word;
        let pinyin = '';
        
        if (match && match[1] && match[2]) {
            hanzi = match[1];
            pinyin = match[2];
        }
        
        clipboardData.words.push({
            word: hanzi,
            pinyin: pinyin,
            forgottenCount: word.forgottenCount
        });
    });
    
    // 转换为JSON字符串
    const jsonString = JSON.stringify(clipboardData, null, 2); // 使用2个空格缩进，美化输出
    
    // 使用Clipboard API复制到剪贴板
    navigator.clipboard.writeText(jsonString)
        .then(() => {
            showToast('已复制到剪贴板（JSON格式）！', 'success');
        })
        .catch(err => {
            showToast('复制失败，请重试！', 'error');
            console.error('复制失败: ', err);
        });
}

// 添加或修改备注
async function addEditNotes(dictation) {
    const currentNotes = dictation.notes || '';
    const newNotes = await showPrompt('请输入备注信息：', currentNotes);
    
    // 如果用户取消了，不做任何操作
    if (newNotes === null) return;
    
    // 更新数据库中的备注
    const request = indexedDB.open('DictationAssistant', 1);
    
    request.onsuccess = function(event) {
        const db = event.target.result;
        const transaction = db.transaction(['dictations'], 'readwrite');
        const store = transaction.objectStore('dictations');
        
        // 先获取记录
        const getRequest = store.get(dictation.id);
        
        getRequest.onsuccess = function() {
            const record = getRequest.result;
            if (record) {
                // 更新备注
                record.notes = newNotes;
                // 保存回数据库
                store.put(record);
                // 重新加载历史记录
                loadHistory();
            }
        };
    };
}

// 删除历史记录项
async function deleteHistoryItem(id) {
    const confirmed = await showConfirm('确定要删除这条历史记录吗？此操作不可撤销。', '删除确认');
    
    // 如果用户取消了，不做任何操作
    if (!confirmed) return;
    
    const request = indexedDB.open('DictationAssistant', 1);
    
    request.onsuccess = function(event) {
        const db = event.target.result;
        const transaction = db.transaction(['dictations'], 'readwrite');
        const store = transaction.objectStore('dictations');
        
        // 删除记录
        const deleteRequest = store.delete(id);
        
        deleteRequest.onsuccess = function() {
            showToast('历史记录已删除！', 'success');
            // 重新加载历史记录
            loadHistory();
        };
        
        deleteRequest.onerror = function() {
            showToast('删除失败，请重试！', 'error');
        };
    };
}

// 加载历史记录项
function loadHistoryItem(dictation) {
    // 重置所有单词的 isUnknown 状态，确保可以重新选择
    const resetWords = dictation.words.map(word => ({
        ...word,
        isUnknown: false  // 重置状态，确保可以重新选择
    }));
    
    allWords = [...resetWords];
    initialWords = [...resetWords];
    unknownWords = []; // 清空不会列表，等待用户重新选择
    currentWordIndex = 0;
    currentRound = 1;
    isFromHistory = true;
    
    // 显示确认页面
    showConfirmationPage();
}

// 返回输入页面
function backToInput() {
    showPage(inputPage);
    updateBreadcrumb(['主页']);
    wordsInput.value = '';
    isFromHistory = false;
}

// 返回历史记录页面
function backToHistory() {
    showPage(historyPage);
    updateBreadcrumb(['主页', '历史记录']);
    loadHistory(); // 刷新历史记录列表
}

// 显示指定页面，隐藏其他页面
function showPage(page) {
    inputPage.classList.add('hidden');
    historyPage.classList.add('hidden');
    dictationPage.classList.add('hidden');
    confirmationPage.classList.add('hidden');
    resultPage.classList.add('hidden');
    
    page.classList.remove('hidden');
}

// 更新面包屑导航
function updateBreadcrumb(path) {
    navigationPath = path;
    breadcrumbPath.innerHTML = '';
    
    path.forEach((item, index) => {
        const span = document.createElement('span');
        
        if (index === path.length - 1) {
            // 当前位置，高亮显示
            span.className = 'text-primary font-medium';
            span.textContent = item;
        } else {
            // 可点击的路径
            span.className = 'text-neutral-dark cursor-pointer hover:text-primary-dark transition';
            span.textContent = item;
            span.onclick = () => navigateToBreadcrumb(index);
            
            // 添加箭头分隔符（除了最后一个元素）
            const arrow = document.createElement('span');
            arrow.className = 'mx-2 text-neutral';
            arrow.innerHTML = '<svg class="w-3 h-3 fill-current" viewBox="0 0 20 20"><path d="M7.293 14.707a1 1 0 0 1 0-1.414L10.586 10 7.293 6.707a1 1 0 0 1 1.414-1.414l4 4a1 1 0 0 1 0 1.414l-4 4a1 1 0 0 1-1.414 0z"/></svg>';
            
            breadcrumbPath.appendChild(span);
            breadcrumbPath.appendChild(arrow);
            return;
        }
        
        breadcrumbPath.appendChild(span);
    });
}

// 面包屑导航点击处理
function navigateToBreadcrumb(index) {
    const target = navigationPath[index];
    
    switch (target) {
        case '主页':
            backToInput();
            break;
        case '历史记录':
            backToHistory();
            break;
        case '听写':
            // 只有在听写确认页面直接进入听写时才应该回到听写页面
            if (navigationPath[index + 1] === '听写确认') {
                showPage(dictationPage);
                if (isFromHistory) {
                    updateBreadcrumb(['主页', '历史记录', '听写']);
                } else {
                    updateBreadcrumb(['主页', '听写']);
                }
                updateDictationUI();
            }
            break;
        // 其他情况不处理，因为可能是从不同路径进入的相同页面
    }
}

// 导出全部历史记录
function exportAllHistory() {
    // 打开 IndexedDB 数据库
    const request = indexedDB.open('DictationAssistant', 1);
    
    request.onsuccess = function(event) {
        const db = event.target.result;
        const transaction = db.transaction(['dictations'], 'readonly');
        const store = transaction.objectStore('dictations');
        
        // 获取所有记录
        const getAllRequest = store.getAll();
        
        getAllRequest.onsuccess = function() {
            const dictations = getAllRequest.result;
            
            if (dictations.length === 0) {
                showToast('暂无历史记录可导出', 'warning');
                return;
            }
            
            // 创建用于导出的数据对象
            const exportData = {
                version: '1.0',
                exportDate: new Date().toISOString(),
                dictations: dictations
            };
            
            // 转换为JSON字符串
            const jsonString = JSON.stringify(exportData, null, 2);
            
            // 创建Blob对象
            const blob = new Blob([jsonString], { type: 'application/json' });
            
            // 创建下载链接
            const downloadLink = document.createElement('a');
            downloadLink.href = URL.createObjectURL(blob);
            downloadLink.download = `听写历史记录_${new Date().toLocaleDateString().replace(/\//g, '-')}.json`;
            
            // 模拟点击下载
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
        };
        
        getAllRequest.onerror = function() {
            showToast('导出失败：无法获取历史记录', 'error');
        };
    };
    
    request.onerror = function() {
        showToast('导出失败：数据库打开错误', 'error');
    };
}

// 导入历史记录
function importHistory(file) {
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            // 解析JSON
            const importedData = JSON.parse(e.target.result);
            
            // 验证导入的数据格式
            if (!importedData.dictations || !Array.isArray(importedData.dictations)) {
                throw new Error('导入文件格式错误');
            }
            
            // 打开数据库
            const request = indexedDB.open('DictationAssistant', 1);
            
            request.onsuccess = function(event) {
                const db = event.target.result;
                const transaction = db.transaction(['dictations'], 'readwrite');
                const store = transaction.objectStore('dictations');
                
                let successCount = 0;
                let errorCount = 0;
                let duplicateCount = 0;
                
                // 处理每条记录
                const processNextRecord = (index) => {
                    if (index >= importedData.dictations.length) {
                        // 所有记录处理完毕
                        transaction.oncomplete = function() {
                            showToast(`导入完成！\n成功：${successCount} 条\n重复：${duplicateCount} 条\n错误：${errorCount} 条`, 'success');
                            // 重新加载历史记录
                            loadHistory();
                        };
                        return;
                    }
                    
                    const dictation = importedData.dictations[index];
                    
                    // 检查记录是否已存在
                    const checkRequest = store.get(dictation.id);
                    
                    checkRequest.onsuccess = function() {
                        if (checkRequest.result) {
                            // 记录已存在
                            duplicateCount++;
                            processNextRecord(index + 1);
                        } else {
                            // 添加新记录
                            const addRequest = store.add(dictation);
                            
                            addRequest.onsuccess = function() {
                                successCount++;
                                processNextRecord(index + 1);
                            };
                            
                            addRequest.onerror = function() {
                                errorCount++;
                                processNextRecord(index + 1);
                            };
                        }
                    };
                    
                    checkRequest.onerror = function() {
                        errorCount++;
                        processNextRecord(index + 1);
                    };
                };
                
                // 开始处理第一条记录
                processNextRecord(0);
            };
            
            request.onerror = function() {
                showToast('导入失败：数据库打开错误', 'error');
            };
            
        } catch (error) {
            showToast(`导入失败：${error.message}`, 'error');
        }
    };
    
    reader.onerror = function() {
        showToast('读取文件失败', 'error');
    };
    
    reader.readAsText(file);
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    // 按钮事件监听 - 使用 debounce 防止快速连续点击
    startDictationBtn.addEventListener('click', () => debounceButton(startDictationBtn, startDictation));
    loadHistoryBtn.addEventListener('click', () => debounceButton(loadHistoryBtn, loadHistory));
    prevBtn.addEventListener('click', () => debounceButton(prevBtn, prevWord));
    unknownBtn.addEventListener('click', () => debounceButton(unknownBtn, markAsUnknown));
    nextBtn.addEventListener('click', () => debounceButton(nextBtn, nextWord));
    nextRoundBtn.addEventListener('click', () => debounceButton(nextRoundBtn, startNextRound));
    startDictationFromHistoryBtn.addEventListener('click', () => debounceButton(startDictationFromHistoryBtn, startDictationFromHistory));
    finishBtn.addEventListener('click', () => debounceButton(finishBtn, showResults));
    saveResultBtn.addEventListener('click', () => debounceButton(saveResultBtn, saveResults));
    newDictationBtn.addEventListener('click', () => debounceButton(newDictationBtn, backToInput));
    
    // 导出和导入历史记录事件监听
    exportHistoryBtn.addEventListener('click', () => debounceButton(exportHistoryBtn, exportAllHistory));
    importHistoryInput.addEventListener('change', (event) => {
        if (event.target.files.length > 0) {
            importHistory(event.target.files[0]);
        }
    });
    
    // 初始加载历史记录
    initDB();
});
