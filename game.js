// ===================================================
// 1. 遊戲參數
// ===================================================
const XP_WIN = 50;      
const XP_LOSE = 30;     
const HINT_COST = 20;   
const REQUIRED_REVIEW_WINS = 3;

// 房屋進化表 (20階)
const HOUSE_STAGES = [
    { icon: "🌲", name: "荒野樹林" }, { icon: "🚜", name: "整地中..." }, { icon: "🟫", name: "平坦空地" },
    { icon: "⛺", name: "簡易帳篷" }, { icon: "🔥", name: "營火帳篷" }, { icon: "🛖", name: "茅草屋" },
    { icon: "🪵", name: "小木屋" }, { icon: "🌻", name: "花園木屋" }, { icon: "🧱", name: "磚瓦房" },
    { icon: "🏠", name: "煙囪磚屋" }, { icon: "🪜", name: "雙層別墅" }, { icon: "🏡", name: "豪華別墅" },
    { icon: "⛲", name: "噴泉豪宅" }, { icon: "🏰", name: "小城堡" }, { icon: "🏯", name: "大城堡" },
    { icon: "🏳️", name: "王國城堡" }, { icon: "🎠", name: "遊樂城堡" }, { icon: "💎", name: "水晶宮殿" },
    { icon: "☁️", name: "天空之城" }, { icon: "👑", name: "宇宙基地" }
];

const HOUSE_CHEERS = ["好棒！", "磚塊+1 🧱", "離城堡近了！", "勇者太強了！", "繼續保持！🔥", "Nice Job!"];

// 玩家狀態 (currentXP 是總累加經驗值)
let player = { name: "Player", level: 1, currentXP: 0, combo: 0, freeHints: 0 };
let voiceSettings = { gender: 'female', pitch: 1.1, rate: 0.8 };

let currentCategory = "ALL";
let questionBank = []; // 會從 data.js 載入
let filteredQuestions = [];
let currentQ = {};      
let currentInput = [];  
let errorCount = 0;     
let questionCount = 0;  
let hasUsedHint = false;
let mistakeRegistry = {}; 
let isReviewMode = false;
let isFrozen = false; 

// ===================================================
// 2. 初始化 (讀取 data.js)
// ===================================================
window.onload = function() { 
    if('speechSynthesis' in window) window.speechSynthesis.getVoices(); 
    
    // ★ 關鍵：從外部 data.js 讀取單字庫，預設 Grade 3
    if (typeof VOCAB_DB !== 'undefined') {
        questionBank = VOCAB_DB['grade3']; 
    } else {
        alert("錯誤：找不到單字庫 data.js");
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
    updateHUD();
    updateHouse();
    cheerHouse(`你好，${player.name}！開始蓋房子囉！`);
    nextQuestion();
}

function nextQuestion() {
    isFrozen = false;
    document.getElementById("freeze-overlay").style.display = "none";
    if (!isReviewMode) {
        questionCount++;
        document.getElementById("q-count").innerText = questionCount;
    } else {
        document.getElementById("q-count").innerText = "🔥魔王關";
    }
    
    errorCount = 0; currentInput = []; hasUsedHint = false;
    
    document.getElementById("message-area").innerText = "";
    document.getElementById("btn-hint").disabled = false;
    document.getElementById("btn-clear").disabled = false;
    document.getElementById("hint-overlay").classList.remove("visible");
    updateHintButton();

    if (isReviewMode) {
        const mistakes = Object.keys(mistakeRegistry);
        if (mistakes.length === 0) { levelUp(); return; }
        const randomKey = mistakes[Math.floor(Math.random() * mistakes.length)];
        currentQ = mistakeRegistry[randomKey].wordObj;
        document.getElementById("message-area").innerHTML = `<span style='color:#e91e63'>🔥 複習剩餘：${REQUIRED_REVIEW_WINS - mistakeRegistry[randomKey].wins} 次</span>`;
    } else {
        const randomIndex = Math.floor(Math.random() * filteredQuestions.length);
        currentQ = filteredQuestions[randomIndex];
    }
    
    document.getElementById("image-area").innerText = currentQ.icon;
    document.getElementById("hint-overlay").innerText = currentQ.word;
    document.getElementById("cn-meaning").innerText = currentQ.cn;

    renderSlots();
    renderLetterPool();
    setTimeout(() => { try { speak(currentQ.word); } catch(e){} }, 500);
}

function renderSlots() {
    const slotsDiv = document.getElementById("answer-slots");
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
            slot.innerText = char;
            break;
        }
    }
    
    btnElement.classList.add("used");
    btnElement.disabled = true;

    if (currentInput.length === cleanWord.length) {
        setTimeout(checkAnswer, 100); 
    }
}

function backspace() {
    if (isFrozen || currentInput.length === 0) return;
    const lastChar = currentInput.pop();
    const btns = document.getElementsByClassName("letter-btn");
    for (let i = 0; i < btns.length; i++) {
        if (btns[i].innerText === lastChar && btns[i].classList.contains("used")) {
            btns[i].classList.remove("used");
            btns[i].disabled = false;
            break; 
        }
    }
    const slots = document.getElementsByClassName("slot");
    for (let i = slots.length - 1; i >= 0; i--) {
        if (slots[i].innerText !== "" && slots[i].innerHTML !== "&nbsp;") {
            slots[i].innerText = "";
            break; 
        }
    }
}

function resetInput() {
    if (isFrozen) return;
    currentInput = [];
    const slots = document.getElementsByClassName("slot");
    for(let s of slots) if(s.innerHTML !== "&nbsp;") s.innerText = "";
    const btns = document.getElementsByClassName("letter-btn");
    for(let b of btns) { b.classList.remove("used"); b.disabled = false; }
}

function checkAnswer() {
    const cleanWord = currentQ.word.replace(/ /g, "");
    const playerAnswer = currentInput.join("");
    const msgDiv = document.getElementById("message-area");

    if (playerAnswer === cleanWord) {
        // --- 答對 ---
        document.getElementById("btn-clear").disabled = true;
        document.getElementById("btn-hint").disabled = true;
        msgDiv.innerHTML = "<span style='color:green; font-size:24px;'>🎉 Correct!</span>";

        gainXP(XP_WIN); 

        try {
            const randomCheer = HOUSE_CHEERS[Math.floor(Math.random() * HOUSE_CHEERS.length)];
            cheerHouse(randomCheer);
            const houseIcon = document.getElementById("my-house-icon");
            houseIcon.classList.add("bounce");
            setTimeout(() => houseIcon.classList.remove("bounce"), 1000);
            fireConfetti();
            speak("Correct! " + currentQ.word);
        } catch(e) {}

        // ★ 自動跳轉 (如果沒有升級的話)
        if (!document.getElementById("levelup-modal").style.display || document.getElementById("levelup-modal").style.display === "none") {
            setTimeout(nextQuestion, 1500); // 1.5秒後自動下一題
        }

    } else {
        // --- 答錯 ---
        loseXP(XP_LOSE);
        msgDiv.innerHTML = "<span style='color:red'>❌ Wrong!</span>";
        try { speak("Try again"); cheerHouse("哎呀！扣分了！🛡️"); } catch(e){}
        
        registerMistake(currentQ);
        errorCount++;
        isFrozen = true;
        const freezeOverlay = document.getElementById("freeze-overlay");
        freezeOverlay.style.display = "flex";
        
        setTimeout(() => {
            isFrozen = false;
            freezeOverlay.style.display = "none";
            resetInput();
        }, 1500);
    }
}

// ===================================================
// 4. XP 系統 (★ 累加制)
// ===================================================

// 計算升級所需的「總累加經驗值」門檻
function getLevelThreshold(level) {
    // 門檻累加公式：
    // Lv1 -> Lv2: 100
    // Lv2 -> Lv3: 100 + 150 = 250
    // Lv3 -> Lv4: 250 + 200 = 450
    // ...
    let totalReq = 0;
    for(let i = 1; i <= level; i++) {
        totalReq += (50 * (i + 1)); // 每一級需要的單級經驗 (100, 150, 200...)
    }
    return totalReq;
}

// 取得上一級的總經驗值 (用來畫進度條起點)
function getPrevLevelThreshold(level) {
    if (level === 1) return 0;
    return getLevelThreshold(level - 1);
}

function updateHUD() {
    document.getElementById("level-display").innerText = player.level;
    document.getElementById("ticket-count").innerText = player.freeHints;
    
    // 計算進度條
    const currentTotal = player.currentXP;
    const nextLevelTotal = getLevelThreshold(player.level);
    const prevLevelTotal = getPrevLevelThreshold(player.level);
    
    // 分母 = 這一級需要賺多少 XP
    const levelRange = nextLevelTotal - prevLevelTotal;
    // 分子 = 這一級已經賺了多少 XP
    const levelProgress = currentTotal - prevLevelTotal;
    
    // 確保百分比在 0~100 之間
    let percentage = (levelProgress / levelRange) * 100;
    if (percentage < 0) percentage = 0;
    if (percentage > 100) percentage = 100;
    
    document.getElementById("xp-bar").style.width = percentage + "%";
    
    // ★ 顯示：總經驗 / 下一級門檻 (例如 120 / 250 XP)
    document.getElementById("xp-display-text").innerText = `${currentTotal} / ${nextLevelTotal} XP`;
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

function gainXP(amount) {
    if (isReviewMode) return;
    player.currentXP += amount;
    showXPGainEffect(amount, true);
    
    const threshold = getLevelThreshold(player.level);
    
    // 檢查升級 (累積經驗 >= 門檻)
    if (player.currentXP >= threshold) {
        levelUp();
    } else {
        updateHUD();
    }
}

function loseXP(amount) {
    if (isReviewMode) return;
    player.currentXP -= amount;
    // 不低於上一級的門檻 (保護等級不掉落)
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
    document.getElementById("levelup-title").innerText = `升到 Lv. ${player.level}！`;
    
    let nextStageIndex = player.level - 1;
    if (nextStageIndex >= HOUSE_STAGES.length) nextStageIndex = HOUSE_STAGES.length - 1;
    document.getElementById("levelup-house").innerText = HOUSE_STAGES[nextStageIndex].icon;
    
    modal.style.display = "flex";
    updateHouse();
    cheerHouse("太棒了！房子升級囉！🎉");
}

function updateHouse() {
    let stageIndex = player.level - 1;
    if (stageIndex >= HOUSE_STAGES.length) stageIndex = HOUSE_STAGES.length - 1;
    const stage = HOUSE_STAGES[stageIndex];
    document.getElementById("my-house-icon").innerText = stage.icon;
    document.getElementById("house-name").innerText = stage.name;
}

// ... (以下輔助功能保持不變) ...
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
        updateHUD();
        updateHintButton();
    } else {
        // 確保扣分後不低於等級下限
        const minXP = getPrevLevelThreshold(player.level);
        if (player.currentXP - HINT_COST >= minXP) {
            player.currentXP -= HINT_COST;
        } else {
            // 經驗不夠，不給看，或直接扣到底
            alert("經驗值不足，無法偷看！");
            return;
        }
        hasUsedHint = true;
        updateHUD();
    }

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

function cheerHouse(message) {
    const bubble = document.getElementById("house-msg");
    if(bubble) {
        bubble.innerText = message;
        bubble.classList.add("show");
        setTimeout(() => { bubble.classList.remove("show"); }, 3000);
    }
}

function closeLevelUpModal() {
    document.getElementById("levelup-modal").style.display = "none";
    nextQuestion();
}

function registerMistake(wordObj) {
    if (!mistakeRegistry[wordObj.word]) { mistakeRegistry[wordObj.word] = { wordObj: wordObj, wins: 0 }; } 
    else { mistakeRegistry[wordObj.word].wins = 0; }
}

function handleNormalVictory() {}

function handleReviewVictory() {
    const wordKey = currentQ.word;
    if (mistakeRegistry[wordKey]) {
        mistakeRegistry[wordKey].wins++;
        if (mistakeRegistry[wordKey].wins >= REQUIRED_REVIEW_WINS) {
            delete mistakeRegistry[wordKey];
        }
    }
    if (Object.keys(mistakeRegistry).length === 0) { levelUp(); } 
    else { try{ fireConfetti(); }catch(e){} setTimeout(nextQuestion, 1500); }
}

function checkLevelUpCondition() {
    if (Object.keys(mistakeRegistry).length === 0) { levelUp(); } 
    else { startReviewMode(); }
}

function startReviewMode() {
    if (isReviewMode) return;
    isReviewMode = true; 
    updateHUD();
    try{ speak("Boss Battle!"); }catch(e){}
    alert(`🚨 升級檢定！\n需複習 ${Object.keys(mistakeRegistry).length} 個錯字。`);
    nextQuestion(); 
}

function handleDamage() {
    try {
        document.body.classList.add("shake-screen");
        setTimeout(() => document.body.classList.remove("shake-screen"), 500);
    } catch(e){}
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