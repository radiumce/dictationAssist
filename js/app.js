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
const wordPinyin = document.getElementById('word-pinyin');
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

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    // 按钮事件监听 - 使用 debounce 防止快速连续点击
    startDictationBtn.addEventListener('click', () => debounceButton(startDictationBtn, startDictation));
    loadHistoryBtn.addEventListener('click', () => debounceButton(loadHistoryBtn, loadHistory));
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
    alert(`请按照"汉字(拼音)"的格式输入单词，例如：苹果(píng guǒ)`);
    return word;
}

// 开始听写
function startDictation() {
    const wordsText = wordsInput.value.trim();
    if (!wordsText) {
        alert('请输入单词！');
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
}

// 标记为不会
function markAsUnknown() {
    const currentWord = allWords[currentWordIndex];
    currentWord.isUnknown = true;
    currentWord.forgottenCount += 1;
    
    // 如果不在不会列表中，添加到不会列表
    if (!unknownWords.some(w => w.word === currentWord.word)) {
        unknownWords.push(currentWord);
    }
    
    // 进入下一个单词
    currentWordIndex++;
    updateDictationUI();
}

// 下一个单词
function nextWord() {
    // 如果点击"下一个"，则当前单词被标记为"会了"
    const currentWord = allWords[currentWordIndex];
    currentWord.isUnknown = false;
    
    // 从不会列表中移除
    const index = unknownWords.findIndex(w => w.word === currentWord.word);
    if (index !== -1) {
        unknownWords.splice(index, 1);
    }
    
    currentWordIndex++;
    updateDictationUI();
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
function startDictationFromHistory() {
    if (unknownWords.length === 0) {
        alert('请先选择需要听写的单词！');
        return;
    }
    
    // 只听写不会的单词
    allWords = unknownWords.map(word => ({
        ...word,
        isUnknown: true  // 确保这些单词的状态是"不会"
    }));
    
    // 保持一份初始的不会单词列表，这样用户点击"下一个"时能从列表中移除
    unknownWords = [...allWords];
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
    
    // 只听写不会的单词
    allWords = unknownWords.map(word => ({
        ...word,
        isUnknown: true  // 确保这些单词的状态是"不会"
    }));
    
    unknownWords = [...allWords]; // 复制一份，确保初始状态所有单词都在"不会"列表中
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
function saveResults() {
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
            alert('听写结果已保存！');
        };
        
        addRequest.onerror = function() {
            alert('保存失败，请重试！');
        };
    };
    
    request.onerror = function() {
        alert('数据库打开失败，请重试！');
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
            alert('已复制到剪贴板（JSON格式）！');
        })
        .catch(err => {
            alert('复制失败，请重试！');
            console.error('复制失败: ', err);
        });
}

// 添加或修改备注
function addEditNotes(dictation) {
    const currentNotes = dictation.notes || '';
    const newNotes = prompt('请输入备注信息：', currentNotes);
    
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
function deleteHistoryItem(id) {
    if (!confirm('确定要删除这条历史记录吗？此操作不可撤销。')) {
        return;
    }
    
    const request = indexedDB.open('DictationAssistant', 1);
    
    request.onsuccess = function(event) {
        const db = event.target.result;
        const transaction = db.transaction(['dictations'], 'readwrite');
        const store = transaction.objectStore('dictations');
        
        // 删除记录
        const deleteRequest = store.delete(id);
        
        deleteRequest.onsuccess = function() {
            alert('历史记录已删除！');
            // 重新加载历史记录
            loadHistory();
        };
        
        deleteRequest.onerror = function() {
            alert('删除失败，请重试！');
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
                alert('暂无历史记录可导出');
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
            alert('导出失败：无法获取历史记录');
        };
    };
    
    request.onerror = function() {
        alert('导出失败：数据库打开错误');
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
                            alert(`导入完成！\n成功：${successCount} 条\n重复：${duplicateCount} 条\n错误：${errorCount} 条`);
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
                alert('导入失败：数据库打开错误');
            };
            
        } catch (error) {
            alert(`导入失败：${error.message}`);
        }
    };
    
    reader.onerror = function() {
        alert('读取文件失败');
    };
    
    reader.readAsText(file);
}
