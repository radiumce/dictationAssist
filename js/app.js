// 全局变量
let allWords = []; // 所有单词
let initialWords = []; // 初始输入的所有单词
let unknownWords = []; // 不会的单词
let currentWordIndex = 0; // 当前单词索引
let currentRound = 1; // 当前轮次
let isButtonDisabled = false; // 按钮是否被禁用

// DOM 元素
const inputPage = document.getElementById('input-page');
const historyPage = document.getElementById('history-page');
const dictationPage = document.getElementById('dictation-page');
const confirmationPage = document.getElementById('confirmation-page');
const resultPage = document.getElementById('result-page');

const wordsInput = document.getElementById('words-input');
const startDictationBtn = document.getElementById('start-dictation');
const loadHistoryBtn = document.getElementById('load-history');
const backToInputBtn = document.getElementById('back-to-input');
const historyList = document.getElementById('history-list');

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

// 标记是否从历史记录加载
let isFromHistory = false;

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
    backToInputBtn.addEventListener('click', () => debounceButton(backToInputBtn, backToInput));
    unknownBtn.addEventListener('click', () => debounceButton(unknownBtn, markAsUnknown));
    nextBtn.addEventListener('click', () => debounceButton(nextBtn, nextWord));
    nextRoundBtn.addEventListener('click', () => debounceButton(nextRoundBtn, startNextRound));
    startDictationFromHistoryBtn.addEventListener('click', () => debounceButton(startDictationFromHistoryBtn, startDictationFromHistory));
    finishBtn.addEventListener('click', () => debounceButton(finishBtn, showResults));
    saveResultBtn.addEventListener('click', () => debounceButton(saveResultBtn, saveResults));
    newDictationBtn.addEventListener('click', () => debounceButton(newDictationBtn, backToInput));
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
            groupTitle.className = 'col-span-full font-semibold text-lg mt-2 mb-1';
            groupTitle.textContent = forgottenCount === 0 ? 
                '已掌握的单词 (遗忘度: 0)' : 
                `遗忘度 ${forgottenCount} 的单词`;
            allWordsList.appendChild(groupTitle);
            
            // 添加该组的单词
            groupedWords[forgottenCount].forEach(word => {
                const wordItem = document.createElement('div');
                
                // 决定颜色: 遗忘度越高颜色越深
                let bgColorClass = 'bg-gray-100';
                if (word.isUnknown) {
                    bgColorClass = 'bg-red-100';
                } else if (forgottenCount > 0) {
                    // 根据遗忘度设置不同深度的颜色
                    if (forgottenCount >= 3) {
                        bgColorClass = 'bg-red-50';
                    } else if (forgottenCount == 2) {
                        bgColorClass = 'bg-yellow-50';
                    } else if (forgottenCount == 1) {
                        bgColorClass = 'bg-green-50';
                    }
                }
                
                wordItem.className = `p-2 border rounded ${bgColorClass} cursor-pointer`;
                wordItem.textContent = `${word.word} (${word.forgottenCount})`;
                wordItem.addEventListener('click', () => {
                    // 无论是否从历史记录进入，点击都应该添加到不会列表
                    if (!word.isUnknown) {
                        word.isUnknown = true;
                        
                        // 只有在正常听写流程中才增加遗忘度，从历史记录选择时不增加
                        if (!isFromHistory) {
                            word.forgottenCount += 1;
                        }
                        
                        wordItem.classList.remove('bg-gray-100', 'bg-red-50', 'bg-yellow-50', 'bg-green-50');
                        wordItem.classList.add('bg-red-100');
                        
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
        let bgColorClass = 'bg-red-100';
        if (word.forgottenCount >= 3) {
            bgColorClass = 'bg-red-200';
        } else if (word.forgottenCount == 2) {
            bgColorClass = 'bg-red-100';
        } else if (word.forgottenCount == 1) {
            bgColorClass = 'bg-red-50';
        }
        
        wordItem.className = `p-2 border rounded ${bgColorClass}`;
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
            groupTitle.className = 'col-span-full font-semibold text-lg mt-2 mb-1';
            groupTitle.textContent = forgottenCount === 0 ? 
                '已掌握的单词 (遗忘度: 0)' : 
                `遗忘度 ${forgottenCount} 的单词`;
            resultWordsList.appendChild(groupTitle);
            
            // 添加该组的单词
            groupedWords[forgottenCount].forEach(word => {
                const wordItem = document.createElement('div');
                
                // 决定颜色: 遗忘度越高颜色越深
                let bgColorClass = 'bg-green-100';
                if (forgottenCount >= 3) {
                    bgColorClass = 'bg-red-200';
                } else if (forgottenCount == 2) {
                    bgColorClass = 'bg-red-100';
                } else if (forgottenCount == 1) {
                    bgColorClass = 'bg-yellow-100';
                }
                
                wordItem.className = `p-2 border rounded ${bgColorClass}`;
                wordItem.textContent = `${word.word} (${word.forgottenCount})`;
                resultWordsList.appendChild(wordItem);
            });
        });
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
        words: finalWords
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
                historyList.innerHTML = '<p class="text-gray-500">暂无历史记录</p>';
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
                historyItem.className = 'p-4 border-b cursor-pointer hover:bg-gray-50';
                historyItem.innerHTML = `
                    <div class="flex justify-between">
                        <span class="font-medium">${date}</span>
                        <span class="text-gray-500">共 ${wordCount} 个单词，不会 ${unknownCount} 个</span>
                    </div>
                `;
                
                historyItem.addEventListener('click', () => {
                    loadHistoryItem(dictation);
                });
                
                historyList.appendChild(historyItem);
            });
        };
        
        getAllRequest.onerror = function() {
            historyList.innerHTML = '<p class="text-red-500">加载历史记录失败</p>';
        };
    };
    
    request.onerror = function() {
        historyList.innerHTML = '<p class="text-red-500">数据库打开失败</p>';
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
    wordsInput.value = '';
    isFromHistory = false;
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
