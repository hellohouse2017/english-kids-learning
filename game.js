// ===================================================
// 1. 遊戲參數
// ===================================================
const XP_WIN = 50;      
const XP_LOSE = 30;     
const HINT_COST = 20;   
const REQUIRED_REVIEW_WINS = 3;
const MASTERY_THRESHOLD = 5; // ★ 連續答對 5 次算精通

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

const HOUSE_CHEERS = ["好棒！", "蓋得好！", "繼續加油！", "勇者太強了！", "Nice Job!"];

// 玩家與系統狀態
let player = { name: "Player", level: 1, currentXP: 0, freeHints: 0 };
let voiceSettings = { gender: 'female', pitch: 1.1, rate: 0.8 };

let currentCategory = "ALL";
let questionBank = [];
let filteredQuestions = [];
let currentQ = {};      
let currentInput = [];  
let isFrozen = false;
let isReviewMode = false;
let mistakeRegistry = {}; 

// ★ 學習紀錄 (Adaptive Learning Data)
// 結構: { "CAT": { wins: 0, weight: 10 }, "DOG": { wins: 5, weight: 1 } }
let learningProgress = JSON.parse(localStorage.getItem('english_rpg_progress')) || {};

// ★ 偵測是否為打字模式
const isTypingMode = () => document.getElementById('typing-input') !== null;

// ===================================================
// 2. 初始化
// ===================================================
window.onload = function() { 
    if('speechSynthesis' in window) window.speechSynthesis.getVoices(); 
    if (typeof VOCAB_DB !== 'undefined') {
        questionBank = VOCAB_DB['grade3']; 
    } else {
        alert("找不到單字庫");
    }
};

// ===================================================
// 3. 遊戲流程
// ===================================================
function goToCategorySelect(gender) {
    const nameInput = document.getElementById('player-name-input').value.trim();
    player.name = nameInput || "勇者";
    document.getElementById('player-name-display').innerText = player.name;
    voiceSettings.gender = gender;
    voiceSettings.pitch = (gender === 'male') ? 0.8 : 1.2;
    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('category-screen').style.display = 'flex';
}

function startGame(category) {
    currentCategory = category;
    if (category === 'ALL') {
        filteredQuestions = questionBank;
        document.getElementById('category-tag').innerText = "隨機挑戰";
    } else {
        filteredQuestions = questionBank.filter(q => q.cat === category);
        const map = { 'animal': "動物園", 'food': "美食街", 'color': "顏色館", 'number': "數字谷", 'body': "身體檢查", 'item': "生活用品" };
        document.getElementById('category-tag').innerText = map[category] || category;
    }
    document.getElementById('category-screen').style.display = 'none';
    document.getElementById('hud').style.display = 'block';
    document.getElementById('game-container').style.display = 'block';
    
    // 如果是打字模式，綁定輸入事件
    if(isTypingMode()) {
        const input = document.getElementById('typing-input');
        input.addEventListener('input', handleTypingInput);
        input.addEventListener('click', () => speak(currentQ.word)); // 點擊輸入框也發音
    }

    updateHUD();
    updateHouse();
    nextQuestion();
}

function nextQuestion() {
    isFrozen = false;
    // 重置介面
    document.getElementById("message-area").innerText = "";
    document.getElementById("next-btn").style.display = "none";
    document.getElementById("btn-hint").disabled = false;
    if(!isTypingMode()) document.getElementById("btn-clear").disabled = false;
    document.getElementById("hint-overlay").classList.remove("visible");
    updateHintButton();

    if(isTypingMode()) {
        const input = document.getElementById('typing-input');
        input.value = "";
        input.disabled = false;
        input.classList.remove('correct-anim', 'wrong-anim');
        input.focus(); // 自動聚焦
    } else {
        document.getElementById("freeze-overlay").style.display = "none";
        currentInput = [];
        renderLetterPool(); // 重繪按鈕
        renderSlots();      // 重繪格子
    }

    // ★ 核心演算法：取得加權題目
    currentQ = getWeightedQuestion();
    
    document.getElementById("image-area").innerText = currentQ.icon;
    document.getElementById("hint-overlay").innerText = currentQ.word;
    document.getElementById("cn-meaning").innerText = currentQ.cn;

    setTimeout(() => { try { speak(currentQ.word); } catch(e){} }, 500);
}

// ★ 適性化選題演算法 (Weighted Random)
function getWeightedQuestion() {
    // 1. 如果是複習模式 (Level Up 前的魔王關)
    if (isReviewMode) {
        const mistakes = Object.keys(mistakeRegistry);
        if (mistakes.length === 0) { levelUp(); return filteredQuestions[0]; }
        const randomKey = mistakes[Math.floor(Math.random() * mistakes.length)];
        return mistakeRegistry[randomKey].wordObj;
    }

    // 2. 一般模式：計算權重
    // 預設權重 10。答錯一次 +10 (變常出現)，答對一次 -2 (變少出現)。
    // 答對 5 次以上，權重變很低 (例如 1)。
    
    let totalWeight = 0;
    const weightedPool = filteredQuestions.map(q => {
        // 初始化該字的學習紀錄
        if (!learningProgress[q.word]) {
            learningProgress[q.word] = { wins: 0, weight: 20 }; // 新字權重高一點
        }
        const data = learningProgress[q.word];
        totalWeight += data.weight;
        return { q: q, weight: data.weight };
    });

    // 3. 隨機抽取
    let random = Math.random() * totalWeight;
    for (let item of weightedPool) {
        if (random < item.weight) return item.q;
        random -= item.weight;
    }
    return filteredQuestions[0]; // fallback
}

// ★ 更新學習紀錄 (答對/答錯時呼叫)
function updateLearningProgress(word, isCorrect) {
    if (!learningProgress[word]) learningProgress[word] = { wins: 0, weight: 20 };
    const data = learningProgress[word];

    if (isCorrect) {
        data.wins++;
        // 答對越多，權重越低 (最少為 1)
        // 公式：每答對一次，權重減半，或減固定值
        if (data.wins >= MASTERY_THRESHOLD) {
            data.weight = 1; // 精通了，很少出現
        } else {
            data.weight = Math.max(1, data.weight - 5); 
        }
    } else {
        data.wins = 0; // 連續中斷
        data.weight += 15; // 答錯，大幅增加出現機率
    }
    
    // 存回 LocalStorage
    localStorage.setItem('english_rpg_progress', JSON.stringify(learningProgress));
}

// ===================================================
// 4. 輸入處理 (分為 按鈕模式 和 打字模式)
// ===================================================

// --- A. 按鈕模式邏輯 ---
function renderSlots() {
    const slotsDiv = document.getElementById("answer-slots");
    if(!slotsDiv) return;
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
    if(!poolDiv) return;
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

function backspace() {
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

function resetInput() {
    if (isFrozen) return;
    currentInput = [];
    const slots = document.getElementsByClassName("slot");
    if(slots) for(let s of slots) if(s.innerHTML !== "&nbsp;") s.innerText = "";
    const btns = document.getElementsByClassName("letter-btn");
    if(btns) for(let b of btns) { b.classList.remove("used"); b.disabled = false; }
}

// --- B. 打字模式邏輯 ---
function handleTypingInput(e) {
    if (isFrozen) return;
    const inputVal = e.target.value.toUpperCase();
    const targetVal = currentQ.word.toUpperCase(); // 包含空格
    
    // 即時檢查：如果長度一樣，就判斷對錯
    if (inputVal.length === targetVal.length) {
        checkAnswer(inputVal);
    }
}

// ===================================================
// 5. 判斷對錯 (通用)
// ===================================================
function checkAnswer(playerAnswer) {
    const targetWord = currentQ.word.replace(/ /g, ""); // 目標(無空格)
    // 打字模式可能包含空格，要處理一下，或者嚴格比對
    const cleanPlayerAns = playerAnswer.replace(/ /g, "").toUpperCase();

    if (cleanPlayerAns === targetWord) {
        // --- 答對 ---
        if(isTypingMode()) {
            document.getElementById('typing-input').classList.add('correct-anim');
            document.getElementById('typing-input').disabled = true;
        } else {
            document.getElementById("btn-clear").disabled = true;
        }
        
        document.getElementById("btn-hint").disabled = true;
        document.getElementById("message-area").innerHTML = "<span style='color:green; font-size:24px;'>🎉 Correct!</span>";

        gainXP(XP_WIN);
        updateLearningProgress(currentQ.word, true); // ★ 更新權重 (答對)

        try {
            const randomCheer = HOUSE_CHEERS[Math.floor(Math.random() * HOUSE_CHEERS.length)];
            cheerHouse(randomCheer);
            const houseIcon = document.getElementById("my-house-icon");
            houseIcon.classList.add("bounce");
            setTimeout(() => houseIcon.classList.remove("bounce"), 1000);
            fireConfetti();
            speak("Correct! " + currentQ.word);
        } catch(e) {}

        // 自動跳下一題 (如果沒升級)
        if (!document.getElementById("levelup-modal").style.display || document.getElementById("levelup-modal").style.display === "none") {
            document.getElementById("next-btn").style.display = "inline-block"; // 顯示按鈕做備用
            setTimeout(nextQuestion, 1500); 
        }

    } else {
        // --- 答錯 ---
        loseXP(XP_LOSE);
        updateLearningProgress(currentQ.word, false); // ★ 更新權重 (答錯)
        
        document.getElementById("message-area").innerHTML = "<span style='color:red'>❌ Wrong!</span>";
        try { speak("Try again"); cheerHouse("加油！再試一次！🛡️"); } catch(e){}
        
        registerMistake(currentQ);
        errorCount++;
        isFrozen = true;

        if(isTypingMode()) {
            const input = document.getElementById('typing-input');
            input.classList.add('wrong-anim');
            setTimeout(() => {
                isFrozen = false;
                input.value = "";
                input.classList.remove('wrong-anim');
            }, 1000);
        } else {
            const freezeOverlay = document.getElementById("freeze-overlay");
            freezeOverlay.style.display = "flex";
            setTimeout(() => {
                isFrozen = false;
                freezeOverlay.style.display = "none";
                resetInput();
            }, 1500);
        }
    }
}

// ===================================================
// 6. 其他系統 (XP, 升級, 提示)
// ===================================================
function getRequiredXP(level) { return 50 * (level + 1); }

function updateHUD() {
    document.getElementById("level-display").innerText = player.level;
    document.getElementById("ticket-count").innerText = player.freeHints;
    const maxXP = getRequiredXP(player.level);
    let percentage = (player.currentXP / maxXP) * 100;
    if (percentage > 100) percentage = 100;
    document.getElementById("xp-bar").style.width = percentage + "%";
    document.getElementById("xp-display-text").innerText = `${player.currentXP} / ${maxXP} XP`;
}

function gainXP(amount) {
    if (isReviewMode) return;
    player.currentXP += amount;
    showXPGainEffect(amount, true);
    if (player.currentXP >= getRequiredXP(player.level)) {
        player.currentXP -= getRequiredXP(player.level);
        levelUp();
    } else {
        updateHUD();
    }
}

function loseXP(amount) {
    if (isReviewMode) return;
    player.currentXP -= amount;
    if (player.currentXP < 0) player.currentXP = 0;
    showXPGainEffect(amount, false);
    try {
        document.body.classList.add("shake-screen");
        setTimeout(() => document.body.classList.remove("shake-screen"), 500);
    } catch(e){}
    updateHUD();
}

function showXPGainEffect(amount, isGain) {
    const hud = document.querySelector('.xp-bar-container');
    const floatText = document.createElement('div');
    floatText.className = 'floating-text ' + (isGain ? 'xp-plus' : 'xp-minus');
    floatText.innerText = (isGain ? '+' : '-') + amount + ' XP';
    const rect = hud.getBoundingClientRect();
    floatText.style.top = (rect.top - 30) + 'px';
    floatText.style.left = (rect.left + rect.width / 2) + 'px';
    document.body.appendChild(floatText);
    setTimeout(() => { floatText.remove(); }, 1200);
}

function levelUp() {
    player.level++;
    if (player.level > 20) player.level = 20;
    player.freeHints++; 
    updateHUD();
    try{ speak("Level Up!"); fireConfetti(); }catch(e){}
    const modal = document.getElementById("levelup-modal");
    document.getElementById("levelup-title").innerText = `升到 Lv. ${player.level}！`;
    let nextStageIndex = player.level - 1;
    if (nextStageIndex >= HOUSE_STAGES.length) nextStageIndex = HOUSE_STAGES.length - 1;
    document.getElementById("levelup-house").innerText = HOUSE_STAGES[nextStageIndex].icon;
    modal.style.display = "flex";
    updateHouse();
    cheerHouse("太棒了！房子升級囉！🎉");
}

function closeLevelUpModal() {
    document.getElementById("levelup-modal").style.display = "none";
    nextQuestion();
}

function updateHouse() {
    let stageIndex = player.level - 1;
    if (stageIndex >= HOUSE_STAGES.length) stageIndex = HOUSE_STAGES.length - 1;
    const stage = HOUSE_STAGES[stageIndex];
    document.getElementById("my-house-icon").innerText = stage.icon;
    document.getElementById("house-name").innerText = stage.name;
}

// 提示功能
function updateHintButton() {
    const btn = document.getElementById("btn-hint");
    if (player.freeHints > 0) {
        btn.innerHTML = "🎟️ 免費提示 (剩" + player.freeHints + ")";
        btn.classList.add("use-ticket");
    } else {
        btn.innerHTML = "💡 偷看 (-" + HINT_COST + " XP)";
        btn.classList.remove("use-ticket");
    }
}

function showHint() {
    if (player.freeHints > 0) {
        player.freeHints--;
        hasUsedHint = true;
    } else {
        if (player.currentXP < HINT_COST) player.currentXP = 0; 
        else player.currentXP -= HINT_COST;
        hasUsedHint = true;
    }
    updateHUD();
    updateHintButton();

    const hintBox = document.getElementById("hint-overlay");
    const hintBtn = document.getElementById("btn-hint");
    hintBox.classList.add("visible");
    try {
        let utterance = new SpeechSynthesisUtterance(currentQ.word.toLowerCase());
        setVoice(utterance); utterance.rate = 0.5;
        window.speechSynthesis.speak(utterance);
    } catch(e){}
    
    hintBtn.disabled = true;
    setTimeout(() => {
        hintBox.classList.remove("visible");
        if (document.getElementById("next-btn").style.display === "none") hintBtn.disabled = false;
    }, 2000);
}

// 魔王關邏輯
function checkLevelUpCondition() {
    if (Object.keys(mistakeRegistry).length === 0) { levelUp(); } 
    else { startReviewMode(); }
}
function startReviewMode() {
    if (isReviewMode) return;
    isReviewMode = true; updateHUD();
    try{ speak("Boss Battle!"); }catch(e){}
    alert(`🚨 升級檢定！\n需複習 ${Object.keys(mistakeRegistry).length} 個錯字。`);
    nextQuestion(); 
}
function handleReviewVictory() {
    const wordKey = currentQ.word;
    if (mistakeRegistry[wordKey]) {
        mistakeRegistry[wordKey].wins++;
        if (mistakeRegistry[wordKey].wins >= REQUIRED_REVIEW_WINS) delete mistakeRegistry[wordKey];
    }
    if (Object.keys(mistakeRegistry).length === 0) { levelUp(); } 
    else { try{ fireConfetti(); }catch(e){} setTimeout(nextQuestion, 1500); }
}
function registerMistake(wordObj) {
    if (!mistakeRegistry[wordObj.word]) { mistakeRegistry[wordObj.word] = { wordObj: wordObj, wins: 0 }; } 
    else { mistakeRegistry[wordObj.word].wins = 0; }
}

// 輔助函式
function cheerHouse(message) {
    const bubble = document.getElementById("house-msg");
    if(bubble) {
        bubble.innerText = message;
        bubble.classList.add("show");
        setTimeout(() => { bubble.classList.remove("show"); }, 3000);
    }
}
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
function playCurrentWord() { try{ speak(currentQ.word); }catch(e){} }
function fireConfetti() { if (typeof confetti === 'function') confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } }); }