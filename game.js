// ===================================================
// 1. 遊戲參數與狀態
// ===================================================
const MAX_HP = 8;
const XP_WIN = 50;      // 答對 +50 XP
const XP_LOSE = 30;     // 答錯 -30 XP
const HINT_COST = 20;   // 偷看 -20 XP
const REQUIRED_REVIEW_WINS = 3;
const MASTERY_THRESHOLD = 5;

// 房屋進化表
const HOUSE_STAGES = [
    { icon: "🌲", name: "荒野樹林" }, { icon: "🚜", name: "整地中..." }, { icon: "🟫", name: "平坦空地" },
    { icon: "⛺", name: "簡易帳篷" }, { icon: "🔥", name: "營火帳篷" }, { icon: "🛖", name: "茅草屋" },
    { icon: "🪵", name: "小木屋" }, { icon: "🌻", name: "花園木屋" }, { icon: "🧱", name: "磚瓦房" },
    { icon: "🏠", name: "煙囪磚屋" }, { icon: "🪜", name: "雙層別墅" }, { icon: "🏡", name: "豪華別墅" },
    { icon: "⛲", name: "噴泉豪宅" }, { icon: "🏰", name: "小城堡" }, { icon: "🏯", name: "大城堡" },
    { icon: "🏳️", name: "王國城堡" }, { icon: "🎠", name: "遊樂城堡" }, { icon: "💎", name: "水晶宮殿" },
    { icon: "☁️", name: "天空之城" }, { icon: "👑", name: "宇宙基地" }
];

const HOUSE_CHEERS = ["好棒！", "磚塊+1 🧱", "離城堡近了！", "勇者太強了！", "Nice Job!"];

// 玩家狀態
let player = { name: "Player", level: 1, currentXP: 0, combo: 0, freeHints: 0 };
let voiceSettings = { gender: 'female', pitch: 1.1, rate: 0.8 };

// 遊戲局狀態
let currentCategory = "ALL";
let questionBank = []; 
let filteredQuestions = [];
let currentQ = {};      
let currentInput = [];  
let isFrozen = false;
let isReviewMode = false;
let mistakeRegistry = {}; 
let learningProgress = JSON.parse(localStorage.getItem('english_rpg_progress')) || {};

// 備用題庫 (防止 data.js 沒讀到)
const fallbackData = [
    { word: "CAT", icon: "🐱", cn: "貓咪", cat: "animal" },
    { word: "DOG", icon: "🐶", cn: "狗狗", cat: "animal" },
    { word: "RED", icon: "🔴", cn: "紅色", cat: "color" },
    { word: "ONE", icon: "1️⃣", cn: "一", cat: "number" },
    { word: "APPLE", icon: "🍎", cn: "蘋果", cat: "food" }
];

// 偵測打字模式
const isTypingMode = () => document.getElementById('typing-input') !== null;

// ===================================================
// 2. 初始化
// ===================================================
window.onload = function() { 
    if('speechSynthesis' in window) window.speechSynthesis.getVoices(); 
    
    // 嘗試讀取 data.js
    if (typeof window.VOCAB_DB !== 'undefined' && window.VOCAB_DB['grade3']) {
        questionBank = window.VOCAB_DB['grade3']; 
        console.log("Loaded data.js");
    } else {
        console.warn("data.js not found, using fallback.");
        questionBank = fallbackData;
    }
};

// ===================================================
// 3. 遊戲流程
// ===================================================
// 將函數掛載到 window 確保 HTML 按鈕找得到
window.goToCategorySelect = function(gender) {
    const nameInput = document.getElementById('player-name-input');
    if(nameInput) player.name = nameInput.value.trim() || "勇者";
    
    const nameDisplay = document.getElementById('player-name-display');
    if(nameDisplay) nameDisplay.innerText = player.name;

    voiceSettings.gender = gender;
    voiceSettings.pitch = (gender === 'male') ? 0.8 : 1.2;

    const startScreen = document.getElementById('start-screen');
    const catScreen = document.getElementById('category-screen');
    if(startScreen) startScreen.style.display = 'none';
    if(catScreen) catScreen.style.display = 'flex';
}

window.startGame = function(category) {
    currentCategory = category;
    if (category === 'ALL') {
        filteredQuestions = questionBank;
        const tag = document.getElementById('category-tag');
        if(tag) tag.innerText = "隨機挑戰";
    } else {
        filteredQuestions = questionBank.filter(q => q.cat === category);
        const map = { 'animal': "動物園", 'food': "美食街", 'color': "顏色館", 'number': "數字谷", 'body': "身體檢查", 'item': "生活用品" };
        const tag = document.getElementById('category-tag');
        if(tag) tag.innerText = map[category] || category;
    }

    if (!filteredQuestions || filteredQuestions.length === 0) filteredQuestions = questionBank;

    const catScreen = document.getElementById('category-screen');
    const hud = document.getElementById('hud');
    const container = document.getElementById('game-container');
    
    if(catScreen) catScreen.style.display = 'none';
    if(hud) hud.style.display = 'block';
    if(container) container.style.display = 'block';
    
    if(isTypingMode()) {
        const input = document.getElementById('typing-input');
        if(input) {
            input.addEventListener('input', handleTypingInput);
            input.addEventListener('click', () => speak(currentQ.word));
        }
    }

    updateHUD();
    updateHouse();
    cheerHouse(`你好，${player.name}！加油！`);
    
    // 延遲一下確保畫面切換完成
    setTimeout(nextQuestion, 100);
}

window.nextQuestion = function() {
    isFrozen = false;
    const freezeOverlay = document.getElementById("freeze-overlay");
    if(freezeOverlay) freezeOverlay.style.display = "none";

    if (!isReviewMode) {
        questionCount++;
        const qCountEl = document.getElementById("q-count");
        if(qCountEl) qCountEl.innerText = questionCount;
    } else {
        const qCountEl = document.getElementById("q-count");
        if(qCountEl) qCountEl.innerText = "🔥魔王關";
    }
    
    errorCount = 0; currentInput = []; hasUsedHint = false;
    
    const msgArea = document.getElementById("message-area");
    if(msgArea) msgArea.innerText = "";
    
    const nextBtn = document.getElementById("next-btn");
    if(nextBtn) nextBtn.style.display = "none";
    
    const btnHint = document.getElementById("btn-hint");
    if(btnHint) btnHint.disabled = false;
    
    if(!isTypingMode()) {
        const btnClear = document.getElementById("btn-clear");
        if(btnClear) btnClear.disabled = false;
    }
    
    const hintOverlay = document.getElementById("hint-overlay");
    if(hintOverlay) hintOverlay.classList.remove("visible");
    
    updateHintButton();

    if(isTypingMode()) {
        const input = document.getElementById('typing-input');
        if(input) {
            input.value = "";
            input.disabled = false;
            input.classList.remove('correct-anim', 'wrong-anim');
            input.focus();
        }
    } else {
        // ★ 安全清空：先檢查元素是否存在
        const slotsDiv = document.getElementById("answer-slots");
        const poolDiv = document.getElementById("letter-pool");
        if(slotsDiv) slotsDiv.innerHTML = "";
        if(poolDiv) poolDiv.innerHTML = "";
    }

    currentQ = getWeightedQuestion();
    if (!currentQ) currentQ = fallbackData[0];
    
    const imgArea = document.getElementById("image-area");
    const cnArea = document.getElementById("cn-meaning");
    
    if(imgArea) imgArea.innerText = currentQ.icon;
    if(hintOverlay) hintOverlay.innerText = currentQ.word;
    if(cnArea) cnArea.innerText = currentQ.cn;

    // ★ 關鍵：只有在元素存在時才渲染
    if(!isTypingMode()) {
        renderSlots();
        renderLetterPool(); 
    }
    
    setTimeout(() => { try { speak(currentQ.word); } catch(e){} }, 500);
}

// 智慧選題
function getWeightedQuestion() {
    if (isReviewMode) {
        const mistakes = Object.keys(mistakeRegistry);
        if (mistakes.length === 0) { levelUp(); return filteredQuestions[0]; }
        const randomKey = mistakes[Math.floor(Math.random() * mistakes.length)];
        return mistakeRegistry[randomKey].wordObj;
    }
    if (!filteredQuestions || filteredQuestions.length === 0) return fallbackData[0];

    let totalWeight = 0;
    const weightedPool = filteredQuestions.map(q => {
        if (!learningProgress[q.word]) learningProgress[q.word] = { wins: 0, weight: 10 };
        const data = learningProgress[q.word];
        totalWeight += data.weight;
        return { q: q, weight: data.weight };
    });

    let random = Math.random() * totalWeight;
    for (let item of weightedPool) {
        if (random < item.weight) return item.q;
        random -= item.weight;
    }
    return filteredQuestions[0];
}

// ===================================================
// 4. 輸入處理
// ===================================================
function renderSlots() {
    const slotsDiv = document.getElementById("answer-slots");
    if(!slotsDiv) return; // ★ 防呆
    slotsDiv.innerHTML = "";
    for (let i = 0; i < currentQ.word.length; i++) {
        let slot = document.createElement("div");
        slot.className = "slot";
        slot.id = "slot-" + i;
        if (currentQ.word[i] === " ") { slot.style.borderBottom = "none"; slot.innerHTML = "&nbsp;"; }
        slotsDiv.appendChild(slot);
    }
}

function renderLetterPool() {
    const poolDiv = document.getElementById("letter-pool");
    if(!poolDiv) return; // ★ 防呆
    poolDiv.innerHTML = "";
    let letters = currentQ.word.replace(/ /g, "").split('');
    letters.sort(() => Math.random() - 0.5);
    letters.forEach((char) => {
        let btn = document.createElement("button");
        btn.innerText = char;
        btn.className = "letter-btn";
        btn.onclick = function() { selectLetter(char, this); };
        poolDiv.appendChild(btn);
    });
}

function selectLetter(char, btnElement) {
    if (isFrozen) return;
    const cleanWord = currentQ.word.replace(/ /g, "");
    if (currentInput.length >= cleanWord.length) return;
    try { speak(char); } catch(e){}
    currentInput.push(char);
    for(let i=0; i<currentQ.word.length; i++) {
        const slot = document.getElementById("slot-" + i);
        if (currentQ.word[i] !== " " && slot && slot.innerText === "") {
            slot.innerText = char; break;
        }
    }
    btnElement.classList.add("used");
    btnElement.disabled = true;
    if (currentInput.length === cleanWord.length) { setTimeout(() => checkAnswer(currentInput.join("")), 100); }
}

window.backspace = function() {
    if (isFrozen || currentInput.length === 0) return;
    const lastChar = currentInput.pop();
    const btns = document.getElementsByClassName("letter-btn");
    for (let i = 0; i < btns.length; i++) {
        if (btns[i].innerText === lastChar && btns[i].classList.contains("used")) {
            btns[i].classList.remove("used"); btns[i].disabled = false; break; 
        }
    }
    const slots = document.getElementsByClassName("slot");
    for (let i = slots.length - 1; i >= 0; i--) {
        if (slots[i].innerText !== "" && slots[i].innerHTML !== "&nbsp;") { slots[i].innerText = ""; break; }
    }
}

window.resetInput = function() {
    if (isFrozen) return;
    currentInput = [];
    const slots = document.getElementsByClassName("slot");
    if(slots) for(let s of slots) if(s.innerHTML !== "&nbsp;") s.innerText = "";
    const btns = document.getElementsByClassName("letter-btn");
    if(btns) for(let b of btns) { b.classList.remove("used"); b.disabled = false; }
}

function handleTypingInput(e) {
    if (isFrozen) return;
    const inputVal = e.target.value.toUpperCase();
    const targetVal = currentQ.word.toUpperCase();
    if (inputVal.length === targetVal.length) { checkAnswer(inputVal); }
}

// ===================================================
// 5. 判斷對錯
// ===================================================
function checkAnswer(playerAnswer) {
    if (!playerAnswer && !isTypingMode()) { playerAnswer = currentInput.join(""); }
    const cleanWord = currentQ.word.replace(/ /g, "");
    const cleanPlayerAns = playerAnswer.replace(/ /g, "").toUpperCase();
    const msgDiv = document.getElementById("message-area");

    if (cleanPlayerAns === cleanWord) {
        if(isTypingMode()) {
            const input = document.getElementById('typing-input');
            if(input) { input.classList.add('correct-anim'); input.disabled = true; }
        } else {
            const btnClear = document.getElementById("btn-clear");
            if(btnClear) btnClear.disabled = true;
        }
        
        const btnHint = document.getElementById("btn-hint");
        if(btnHint) btnHint.disabled = true;
        
        if(msgDiv) msgDiv.innerHTML = "<span style='color:green; font-size:24px;'>🎉 Correct!</span>";

        gainXP(XP_WIN);
        updateLearningProgress(currentQ.word, true);

        try {
            const randomCheer = HOUSE_CHEERS[Math.floor(Math.random() * HOUSE_CHEERS.length)];
            cheerHouse(randomCheer);
            const houseIcon = document.getElementById("my-house-icon");
            if(houseIcon) {
                houseIcon.classList.add("bounce");
                setTimeout(() => houseIcon.classList.remove("bounce"), 1000);
            }
            fireConfetti();
            speak("Correct! " + currentQ.word);
        } catch(e) {}

        const levelModal = document.getElementById("levelup-modal");
        if (!levelModal || levelModal.style.display === "none") {
            setTimeout(nextQuestion, 1500); 
        }

    } else {
        loseXP(XP_LOSE);
        updateLearningProgress(currentQ.word, false);
        if(msgDiv) msgDiv.innerHTML = "<span style='color:red'>❌ Wrong!</span>";
        try { speak("Try again"); cheerHouse("哎呀！扣分了！🛡️"); } catch(e){}
        
        registerMistake(currentQ);
        errorCount++;
        isFrozen = true;

        if(isTypingMode()) {
            const input = document.getElementById('typing-input');
            if(input) {
                input.classList.add('wrong-anim');
                setTimeout(() => {
                    isFrozen = false;
                    input.value = "";
                    input.classList.remove('wrong-anim');
                }, 1000);
            }
        } else {
            const freezeOverlay = document.getElementById("freeze-overlay");
            if(freezeOverlay) {
                freezeOverlay.style.display = "flex";
                setTimeout(() => {
                    isFrozen = false;
                    freezeOverlay.style.display = "none";
                    resetInput();
                }, 1500);
            }
        }
    }
}

// ===================================================
// 6. XP 系統
// ===================================================
function getLevelThreshold(level) {
    let totalReq = 0;
    for(let i = 1; i <= level; i++) totalReq += (50 * (i + 1));
    return totalReq;
}

function getPrevLevelThreshold(level) {
    if (level === 1) return 0;
    return getLevelThreshold(level - 1);
}

function updateHUD() {
    const elLevel = document.getElementById("level-display");
    if(elLevel) elLevel.innerText = player.level;
    
    const elTicket = document.getElementById("ticket-count");
    if(elTicket) elTicket.innerText = player.freeHints;
    
    const nextLevelTotal = getLevelThreshold(player.level);
    const prevLevelTotal = getPrevLevelThreshold(player.level);
    const levelRange = nextLevelTotal - prevLevelTotal;
    const currentProgress = player.currentXP - prevLevelTotal;
    
    let percentage = (currentProgress / levelRange) * 100;
    if (percentage < 0) percentage = 0;
    if (percentage > 100) percentage = 100;
    
    const bar = document.getElementById("xp-bar");
    if(bar) bar.style.width = percentage + "%";
    
    const displayStr = `${player.currentXP} / ${nextLevelTotal} XP`;
    const txtDisplay = document.getElementById("xp-display-text");
    if(txtDisplay) txtDisplay.innerText = displayStr;
}

function showXPGainEffect(amount, isGain) {
    const hud = document.querySelector('.xp-bar-container');
    if(!hud) return;
    const floatText = document.createElement('div');
    floatText.className = 'floating-text ' + (isGain ? 'xp-plus' : 'xp-minus');
    floatText.innerText = (isGain ? '+' : '-') + amount + ' XP';
    const rect = hud.getBoundingClientRect();
    floatText.style.top = (rect.top - 30) + 'px';
    floatText.style.left = (rect.left + rect.width / 2) + 'px';
    document.body.appendChild(floatText);
    setTimeout(() => { floatText.remove(); }, 1200);
}

function gainXP(amount) {
    if (isReviewMode) return;
    player.currentXP += amount;
    showXPGainEffect(amount, true);
    if (player.currentXP >= getLevelThreshold(player.level)) {
        levelUp();
    } else {
        updateHUD();
    }
}

function loseXP(amount) {
    if (isReviewMode) return;
    player.currentXP -= amount;
    const minXP = getPrevLevelThreshold(player.level);
    if (player.currentXP < minXP) player.currentXP = minXP;
    showXPGainEffect(amount, false);
    try {
        document.body.classList.add("shake-screen");
        setTimeout(() => document.body.classList.remove("shake-screen"), 500);
    } catch(e){}
    updateHUD();
}

function levelUp() {
    player.level++;
    if (player.level > 20) player.level = 20;
    player.freeHints++; 
    updateHUD();
    try{ speak("Level Up!"); fireConfetti(); }catch(e){}
    const modal = document.getElementById("levelup-modal");
    if(modal) {
        document.getElementById("levelup-title").innerText = `升到 Lv. ${player.level}！`;
        let nextStageIndex = player.level - 1;
        if (nextStageIndex >= HOUSE_STAGES.length) nextStageIndex = HOUSE_STAGES.length - 1;
        document.getElementById("levelup-house").innerText = HOUSE_STAGES[nextStageIndex].icon;
        modal.style.display = "flex";
    }
    updateHouse();
    cheerHouse("太棒了！房子升級囉！🎉");
}

function updateHouse() {
    let stageIndex = player.level - 1;
    if (stageIndex >= HOUSE_STAGES.length) stageIndex = HOUSE_STAGES.length - 1;
    const stage = HOUSE_STAGES[stageIndex];
    if(document.getElementById("my-house-icon")) document.getElementById("my-house-icon").innerText = stage.icon;
    if(document.getElementById("house-name")) document.getElementById("house-name").innerText = stage.name;
}

// ... 輔助 ...
function updateHintButton() {
    const btn = document.getElementById("btn-hint");
    if(!btn) return;
    if (player.freeHints > 0) {
        btn.innerHTML = "🎟️ 免費 (剩" + player.freeHints + ")";
        btn.classList.add("use-ticket");
    } else {
        btn.innerHTML = "💡 偷看 (-" + HINT_COST + " XP)";
        btn.classList.remove("use-ticket");
    }
}

window.showHint = function() {
    if (player.freeHints > 0) {
        player.freeHints--;
        hasUsedHint = true;
        updateHUD();
        updateHintButton();
    } else {
        const minXP = getPrevLevelThreshold(player.level);
        if (player.currentXP - HINT_COST >= minXP) {
            player.currentXP -= HINT_COST;
            hasUsedHint = true;
            updateHUD();
        } else {
            alert("經驗值不足，無法偷看！");
            return;
        }
    }
    const hintBox = document.getElementById("hint-overlay");
    const hintBtn = document.getElementById("btn-hint");
    if(hintBox) hintBox.classList.add("visible");
    try {
        let utterance = new SpeechSynthesisUtterance(currentQ.word.toLowerCase());
        setVoice(utterance); utterance.rate = 0.5;
        window.speechSynthesis.speak(utterance);
    } catch(e){}
    
    if(hintBtn) hintBtn.disabled = true;
    setTimeout(() => {
        if(hintBox) hintBox.classList.remove("visible");
        const nextBtn = document.getElementById("next-btn");
        if (nextBtn && nextBtn.style.display === "none") {
            if(hintBtn) hintBtn.disabled = false;
        }
    }, 2000);
}

function cheerHouse(message) {
    const bubble = document.getElementById("house-msg");
    if(bubble) {
        bubble.innerText = message;
        bubble.classList.add("show");
        setTimeout(() => { bubble.classList.remove("show"); }, 3000);
    }
}

window.closeLevelUpModal = function() {
    const modal = document.getElementById("levelup-modal");
    if(modal) modal.style.display = "none";
    nextQuestion();
}

function updateLearningProgress(word, isCorrect) {
    if (!learningProgress[word]) learningProgress[word] = { wins: 0, weight: 10 };
    const data = learningProgress[word];
    if (isCorrect) {
        data.wins++;
        if (data.wins >= MASTERY_THRESHOLD) data.weight = 1; else data.weight = Math.max(1, data.weight - 2);
    } else {
        data.wins = 0;
        data.weight += 10;
    }
    localStorage.setItem('english_rpg_progress', JSON.stringify(learningProgress));
}

// 語音與特效
window.playCurrentWord = function() { try{ speak(currentQ.word); }catch(e){} }

function speak(text) {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text.toLowerCase());
    setVoice(utterance);
    window.speechSynthesis.speak(utterance);
}

function setVoice(utterance) {
    utterance.lang = 'en-US'; utterance.rate = voiceSettings.rate; utterance.pitch = voiceSettings.pitch;
    const voices = window.speechSynthesis.getVoices();
    let targetVoice = (voiceSettings.gender === 'male') ? 
        voices.find(v => v.name.includes('Male') && v.lang.includes('en')) : 
        voices.find(v => v.name.includes('Female') && v.lang.includes('en'));
    if (targetVoice) utterance.voice = targetVoice;
}

function fireConfetti() { if (typeof confetti === 'function') confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } }); }