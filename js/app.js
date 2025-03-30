// 全局变量
let allWords = []; // 所有单词
let initialWords = []; // 初始输入的所有单词
let unknownWords = []; // 不会的单词
let currentWordIndex = 0; // 当前单词索引
let currentRound = 1; // 当前轮次

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
const finishBtn = document.getElementById('finish-btn');

const resultWordsList = document.getElementById('result-words-list');
const saveResultBtn = document.getElementById('save-result-btn');
const newDictationBtn = document.getElementById('new-dictation-btn');

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    // 按钮事件监听
    startDictationBtn.addEventListener('click', startDictation);
    loadHistoryBtn.addEventListener('click', loadHistory);
    backToInputBtn.addEventListener('click', backToInput);
    unknownBtn.addEventListener('click', markAsUnknown);
    nextBtn.addEventListener('click', nextWord);
    nextRoundBtn.addEventListener('click', startNextRound);
    finishBtn.addEventListener('click', showResults);
    saveResultBtn.addEventListener('click', saveResults);
    newDictationBtn.addEventListener('click', backToInput);
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
    
    nextWord();
}

// 下一个单词
function nextWord() {
    currentWordIndex++;
    updateDictationUI();
}

// 显示确认页面
function showConfirmationPage() {
    showPage(confirmationPage);
    
    // 更新所有单词列表 - 显示初始输入的所有单词
    allWordsList.innerHTML = '';
    initialWords.forEach(word => {
        // 查找当前单词在allWords中的状态
        const currentWordState = allWords.find(w => w.word === word.word) || word;
        
        const wordItem = document.createElement('div');
        wordItem.className = `p-2 border rounded ${currentWordState.isUnknown ? 'bg-red-100' : 'bg-gray-100'} cursor-pointer`;
        wordItem.textContent = `${word.word} (${currentWordState.forgottenCount})`;
        wordItem.addEventListener('click', () => {
            if (!currentWordState.isUnknown) {
                currentWordState.isUnknown = true;
                currentWordState.forgottenCount += 1;
                wordItem.classList.remove('bg-gray-100');
                wordItem.classList.add('bg-red-100');
                
                // 如果不在不会列表中，添加到不会列表
                if (!unknownWords.some(w => w.word === currentWordState.word)) {
                    unknownWords.push(currentWordState);
                    updateUnknownWordsList();
                }
            }
        });
        allWordsList.appendChild(wordItem);
    });
    
    // 更新不会的单词列表
    updateUnknownWordsList();
    
    // 如果没有不会的单词，显示结束按钮
    if (unknownWords.length === 0) {
        nextRoundBtn.classList.add('hidden');
        finishBtn.classList.remove('hidden');
    } else {
        nextRoundBtn.classList.remove('hidden');
        finishBtn.classList.add('hidden');
    }
}

// 更新不会的单词列表
function updateUnknownWordsList() {
    unknownWordsList.innerHTML = '';
    unknownWords.forEach(word => {
        const wordItem = document.createElement('div');
        wordItem.className = 'p-2 border rounded bg-red-100';
        wordItem.textContent = `${word.word} (${word.forgottenCount})`;
        unknownWordsList.appendChild(wordItem);
    });
}

// 开始下一轮
function startNextRound() {
    if (unknownWords.length === 0) {
        showResults();
        return;
    }
    
    // 只听写不会的单词
    allWords = [...unknownWords];
    unknownWords = [];
    currentWordIndex = 0;
    currentRound++;
    
    // 显示听写页面
    showPage(dictationPage);
    updateDictationUI();
}

// 显示结果
function showResults() {
    showPage(resultPage);
    
    // 更新结果列表 - 使用初始单词列表，但显示最新的遗忘度
    resultWordsList.innerHTML = '';
    
    // 创建一个包含所有初始单词最新状态的数组
    const resultWords = initialWords.map(initialWord => {
        // 查找当前单词在allWords中的最新状态
        const currentState = allWords.find(w => w.word === initialWord.word);
        // 如果找到了，使用最新状态，否则使用初始状态
        return currentState || initialWord;
    });
    
    // 按遗忘度排序
    resultWords.sort((a, b) => b.forgottenCount - a.forgottenCount);
    
    resultWords.forEach(word => {
        const wordItem = document.createElement('div');
        wordItem.className = `p-2 border rounded ${word.forgottenCount > 0 ? 'bg-red-100' : 'bg-green-100'}`;
        wordItem.textContent = `${word.word} (${word.forgottenCount})`;
        resultWordsList.appendChild(wordItem);
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
    allWords = [...dictation.words];
    initialWords = [...dictation.words]; // Set initialWords to the loaded history words
    unknownWords = [];
    currentWordIndex = 0;
    currentRound = 1;
    
    // 显示确认页面
    showConfirmationPage();
}

// 返回输入页面
function backToInput() {
    showPage(inputPage);
    wordsInput.value = '';
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
