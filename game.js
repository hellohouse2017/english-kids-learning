// ===================================================
// 1. 遊戲參數與狀態
// ===================================================
const MAX_HP = 8;
const HINT_HP_COST = 0.5;
const REQUIRED_REVIEW_WINS = 3;

// ★ 慢速養成：20 個階段
const HOUSE_STAGES = [
    { icon: "🌲", name: "荒野樹林" }, // Lv.1
    { icon: "🚜", name: "整地中..." }, // Lv.2
    { icon: "🟫", name: "平坦空地" }, // Lv.3
    { icon: "⛺", name: "簡易帳篷" }, // Lv.4
    { icon: "🔥", name: "營火帳篷" }, // Lv.5
    { icon: "🛖", name: "茅草屋" },   // Lv.6
    { icon: "🪵", name: "小木屋" },   // Lv.7
    { icon: "🌻", name: "花園木屋" }, // Lv.8
    { icon: "🧱", name: "磚瓦房" },   // Lv.9
    { icon: "🏠", name: "煙囪磚屋" }, // Lv.10
    { icon: "🪜", name: "雙層別墅" }, // Lv.11
    { icon: "🏡", name: "豪華別墅" }, // Lv.12
    { icon: "⛲", name: "噴泉豪宅" }, // Lv.13
    { icon: "🏰", name: "小城堡" },   // Lv.14
    { icon: "🏯", name: "大城堡" },   // Lv.15
    { icon: "🏳️", name: "王國城堡" }, // Lv.16
    { icon: "🎠", name: "遊樂城堡" }, // Lv.17
    { icon: "💎", name: "水晶宮殿" }, // Lv.18
    { icon: "☁️", name: "天空之城" }, // Lv.19
    { icon: "👑", name: "宇宙基地" }  // Lv.20
];

const HOUSE_CHEERS = ["好棒！", "磚塊+1 🧱", "離城堡近了！", "勇者太強了！", "繼續保持！🔥", "Nice Job!"];

let player = {
    name: "Player",
    hp: MAX_HP,
    level: 1,
    currentXP: 0,
    combo: 0,
    freeHints: 0 // ★ 新增：免費提示券
};

let voiceSettings = { gender: 'female', pitch: 1.1, rate: 0.8 };
let currentCategory = "ALL"; // 當前選擇的關卡類別
let filteredQuestions = [];  // 過濾後的題庫
let currentQ = {};      
let currentInput = [];  
let errorCount = 0;     
let questionCount = 0;  
let hasUsedHint = false;
let mistakeRegistry = {}; 
let isReviewMode = false;
let isFrozen = false; 

// ===================================================
// 2. 完整單字庫 (加上 category 標籤)
// ===================================================
const questionBank = [
    // 動物 (animal)
    { word: "CAT", icon: "🐱", cn: "貓咪", cat: "animal" }, { word: "DOG", icon: "🐶", cn: "狗狗", cat: "animal" },
    { word: "PIG", icon: "🐷", cn: "豬", cat: "animal" }, { word: "BIRD", icon: "🐦", cn: "鳥", cat: "animal" },
    { word: "FISH", icon: "🐟", cn: "魚", cat: "animal" }, { word: "DUCK", icon: "🦆", cn: "鴨子", cat: "animal" },
    { word: "LION", icon: "🦁", cn: "獅子", cat: "animal" }, { word: "TIGER", icon: "🐯", cn: "老虎", cat: "animal" },
    { word: "BEAR", icon: "🐻", cn: "熊", cat: "animal" }, { word: "RABBIT", icon: "🐰", cn: "兔子", cat: "animal" },
    { word: "MONKEY", icon: "🐵", cn: "猴子", cat: "animal" }, { word: "ELEPHANT", icon: "🐘", cn: "大象", cat: "animal" },
    
    // 顏色 (color)
    { word: "RED", icon: "🔴", cn: "紅色", cat: "color" }, { word: "BLUE", icon: "🔵", cn: "藍色", cat: "color" },
    { word: "YELLOW", icon: "🟡", cn: "黃色", cat: "color" }, { word: "GREEN", icon: "🟢", cn: "綠色", cat: "color" },
    { word: "ORANGE", icon: "🟠", cn: "橘色", cat: "color" }, { word: "PURPLE", icon: "🟣", cn: "紫色", cat: "color" },
    { word: "BLACK", icon: "⚫", cn: "黑色", cat: "color" }, { word: "WHITE", icon: "⚪", cn: "白色", cat: "color" },

    // 數字 (number)
    { word: "ONE", icon: "1️⃣", cn: "一", cat: "number" }, { word: "TWO", icon: "2️⃣", cn: "二", cat: "number" },
    { word: "THREE", icon: "3️⃣", cn: "三", cat: "number" }, { word: "FOUR", icon: "4️⃣", cn: "四", cat: "number" },
    { word: "FIVE", icon: "5️⃣", cn: "五", cat: "number" }, { word: "SIX", icon: "6️⃣", cn: "六", cat: "number" },
    { word: "SEVEN", icon: "7️⃣", cn: "七", cat: "number" }, { word: "EIGHT", icon: "8️⃣", cn: "八", cat: "number" },
    { word: "NINE", icon: "9️⃣", cn: "九", cat: "number" }, { word: "TEN", icon: "🔟", cn: "十", cat: "number" },

    // 食物 (food)
    { word: "APPLE", icon: "🍎", cn: "蘋果", cat: "food" }, { word: "BANANA", icon: "🍌", cn: "香蕉", cat: "food" },
    { word: "ORANGE", icon: "🍊", cn: "柳橙", cat: "food" }, { word: "LEMON", icon: "🍋", cn: "檸檬", cat: "food" },
    { word: "EGG", icon: "🥚", cn: "蛋", cat: "food" }, { word: "MILK", icon: "🥛", cn: "牛奶", cat: "food" },
    { word: "CAKE", icon: "🍰", cn: "蛋糕", cat: "food" }, { word: "ICE CREAM", icon: "🍦", cn: "冰淇淋", cat: "food" },
    { word: "RICE", icon: "🍚", cn: "米飯", cat: "food" }, { word: "WATER", icon: "💧", cn: "水", cat: "food" },
    { word: "PIZZA", icon: "🍕", cn: "披薩", cat: "food" }, { word: "HAMBURGER", icon: "🍔", cn: "漢堡", cat: "food" },

    // 身體 (body)
    { word: "HEAD", icon: "🗣️", cn: "頭", cat: "body" }, { word: "EYE", icon: "👁️", cn: "眼睛", cat: "body" },
    { word: "EAR", icon: "👂", cn: "耳朵", cat: "body" }, { word: "NOSE", icon: "👃", cn: "鼻子", cat: "body" },
    { word: "MOUTH", icon: "👄", cn: "嘴巴", cat: "body" }, { word: "HAND", icon: "🖐️", cn: "手", cat: "body" },
    { word: "LEG", icon: "🦵", cn: "腿", cat: "body" }, { word: "ARM", icon: "💪", cn: "手臂", cat: "body" },
    { word: "FOOT", icon: "🦶", cn: "腳", cat: "body" }, { word: "FACE", icon: "😀", cn: "臉", cat: "body" },

    // 生活用品 (item)
    { word: "PEN", icon: "🖊️", cn: "原子筆", cat: "item" }, { word: "PENCIL", icon: "✏️", cn: "鉛筆", cat: "item" },
    { word: "BOOK", icon: "📖", cn: "書", cat: "item" }, { word: "BAG", icon: "🎒", cn: "書包", cat: "item" },
    { word: "CHAIR", icon: "🪑", cn: "椅子", cat: "item" }, { word: "DESK", icon: "✍️", cn: "書桌", cat: "item" },
    { word: "CAR", icon: "🚗", cn: "車子", cat: "item" }, { word: "BUS", icon: "🚌", cn: "公車", cat: "item" },
    { word: "BIKE", icon: "🚲", cn: "腳踏車", cat: "item" }, { word: "BALL", icon: "⚽", cn: "球", cat: "item" },
    { word: "HAT", icon: "👒", cn: "帽子", cat: "item" }
];

window.onload = function() { window.speechSynthesis.getVoices(); };

// ===================================================
// 3. 遊戲流程 (新：加入類別選擇)
// ===================================================
function goToCategorySelect(gender) {
    const nameInput = document.getElementById('player-name-input').value.trim();
    player.name = nameInput || "勇者";
    document.getElementById('player-name-display').innerText = player.name;

    voiceSettings.gender = gender;
    voiceSettings.pitch = (gender === 'male') ? 0.8 : 1.2;

    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('category-screen').style.display = 'flex'; // 顯示類別選擇
}

function startGame(category) {
    currentCategory = category;
    
    // 過濾題目
    if (category === 'ALL') {
        filteredQuestions = questionBank;
        document.getElementById('category-tag').innerText = "隨機挑戰";
    } else {
        filteredQuestions = questionBank.filter(q => q.cat === category);
        const map = { 'animal': "動物園", 'food': "美食街", 'color': "顏色館", 'number': "數字谷", 'body': "身體檢查", 'item': "生活用品" };
        document.getElementById('category-tag').innerText = map[category];
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
    
    // UI 重置
    document.getElementById("message-area").innerText = "";
    document.getElementById("next-btn").style.display = "none";
    document.getElementById("btn-hint").disabled = false;
    document.getElementById("btn-clear").disabled = false;
    document.getElementById("hint-overlay").classList.remove("visible");
    updateHintButton(); // 更新提示按鈕文字 (是否免費)

    // 選題
    if (isReviewMode) {
        const mistakes = Object.keys(mistakeRegistry);
        if (mistakes.length === 0) { levelUp(); return; }
        const randomKey = mistakes[Math.floor(Math.random() * mistakes.length)];
        currentQ = mistakeRegistry[randomKey].wordObj;
        document.getElementById("message-area").innerHTML = `<span style='color:#e91e63'>🔥 複習剩餘：${REQUIRED_REVIEW_WINS - mistakeRegistry[randomKey].wins} 次</span>`;
    } else {
        // 從過濾後的清單選題
        const randomIndex = Math.floor(Math.random() * filteredQuestions.length);
        currentQ = filteredQuestions[randomIndex];
    }
    
    document.getElementById("image-area").innerText = currentQ.icon;
    document.getElementById("hint-overlay").innerText = currentQ.word;
    document.getElementById("cn-meaning").innerText = currentQ.cn;

    renderSlots();
    renderLetterPool();
    
    setTimeout(() => { speak(currentQ.word); }, 500);
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
    
    speak(char);
    currentInput.push(char);
    
    for(let i=0; i<currentQ.word.length; i++) {
        const slot = document.getElementById("slot-" + i);
        if (currentQ.word[i] !== " " && slot.innerText === "") {
            slot.innerText = char;
            break;
        }
    }
    
    btnElement.classList.add("used");
    btnElement.disabled = true;

    if (currentInput.length === cleanWord.length) checkAnswer();
}

function resetInput() {
    if (isFrozen) return;
    currentInput = [];
    const slots = document.getElementsByClassName("slot");
    for(let s of slots) if(s.innerHTML !== "&nbsp;") s.innerText = "";
    const btns = document.getElementsByClassName("letter-btn");
    for(let b of btns) { b.classList.remove("used"); b.disabled = false; }
}

// game.js 新增函式

function backspace() {
    // 1. 如果在冷卻中或是沒字可以刪，就不動作
    if (isFrozen || currentInput.length === 0) return;

    // 2. 移除邏輯陣列中的最後一個字
    const lastChar = currentInput.pop();

    // 3. 恢復按鈕狀態 (讓字母池的按鈕變回可按)
    // 找到所有該字母的按鈕，並挑出一個是「已使用(used)」狀態的來恢復
    const btns = document.getElementsByClassName("letter-btn");
    for (let i = 0; i < btns.length; i++) {
        if (btns[i].innerText === lastChar && btns[i].classList.contains("used")) {
            btns[i].classList.remove("used");
            btns[i].disabled = false;
            break; // 只恢復一個，跳出迴圈
        }
    }

    // 4. 清除畫面上的格子
    // 從最後面往前找，找到第一個「有填字」且「不是題目空格」的格子把它清空
    const slots = document.getElementsByClassName("slot");
    for (let i = slots.length - 1; i >= 0; i--) {
        // 檢查格子裡有字，且不是題目原本的空格(&nbsp;)
        if (slots[i].innerText !== "" && slots[i].innerHTML !== "&nbsp;") {
            slots[i].innerText = "";
            break; // 只清空一格，跳出迴圈
        }
    }
}

function checkAnswer() {
    const cleanWord = currentQ.word.replace(/ /g, "");
    const playerAnswer = currentInput.join("");
    const msgDiv = document.getElementById("message-area");

    if (playerAnswer === cleanWord) {
        document.getElementById("btn-clear").disabled = true;
        const randomCheer = HOUSE_CHEERS[Math.floor(Math.random() * HOUSE_CHEERS.length)];
        cheerHouse(randomCheer);
        
        const houseIcon = document.getElementById("my-house-icon");
        houseIcon.classList.add("bounce");
        setTimeout(() => houseIcon.classList.remove("bounce"), 1000);

        if (isReviewMode) handleReviewVictory(); else handleNormalVictory();
        
        msgDiv.innerHTML += " <span style='color:green; font-size:24px;'>⚔️ Correct!</span>";
        speak("Correct! " + currentQ.word);
        document.getElementById("next-btn").style.display = "inline-block";
        document.getElementById("btn-hint").disabled = true;
    } else {
        handleDamage();
        msgDiv.innerHTML = "<span style='color:red'>❌ Wrong!</span>";
        speak("Try again");
        cheerHouse("哎呀！再來一次！🛡️");

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

        if (errorCount >= 2) {
             setTimeout(() => { msgDiv.innerHTML += "<br><span style='color:#e91e63; font-size:0.9rem'>💡 用提示吧！</span>"; }, 1500);
        }
    }
}

// ===================================================
// 4. 系統邏輯 (XP計算 / 道具 / 升級)
// ===================================================

// ★ 動態 XP 需求：越後面越難
function getRequiredXP(level) {
    if (level <= 5) return 100; // Lv 1-5: 100xp
    if (level <= 10) return 200; // Lv 6-10: 200xp
    return 300 + (level - 11) * 50; // Lv 11+: 越來越難
}

function updateHUD() {
    document.getElementById("level-display").innerText = player.level;
    document.getElementById("ticket-count").innerText = player.freeHints; // 顯示券
    
    let hearts = "";
    const fullHearts = Math.floor(player.hp);
    const hasHalfHeart = (player.hp % 1 !== 0);
    for(let i=0; i<fullHearts; i++) hearts += "❤️";
    if (hasHalfHeart) hearts += "💔";
    const emptyHearts = MAX_HP - Math.ceil(player.hp);
    for(let i=0; i<emptyHearts; i++) hearts += "🖤";
    document.getElementById("hp-display").innerText = hearts;

    // XP 條
    const maxXP = getRequiredXP(player.level);
    let percentage = (player.currentXP / maxXP) * 100;
    if (percentage > 100) percentage = 100;
    document.getElementById("xp-bar").style.width = percentage + "%";
    document.getElementById("xp-current").innerText = player.currentXP;
    document.getElementById("xp-max").innerText = maxXP;
}

function updateHintButton() {
    const btn = document.getElementById("btn-hint");
    if (player.freeHints > 0) {
        btn.innerHTML = "🎟️ 免費提示 (剩" + player.freeHints + ")";
        btn.classList.add("use-ticket");
    } else {
        btn.innerHTML = "💡 偷看一眼 (-0.5❤)";
        btn.classList.remove("use-ticket");
    }
}

function showHint() {
    // 檢查是否有免費券
    if (player.freeHints > 0) {
        player.freeHints--;
        hasUsedHint = true; // 還是算用過提示，XP會變少
        updateHUD();
        updateHintButton();
    } else {
        // 沒券扣血
        if (player.hp <= HINT_HP_COST) { alert("血量不足！"); return; }
        player.hp -= HINT_HP_COST;
        hasUsedHint = true;
        updateHUD();
    }

    const hintBox = document.getElementById("hint-overlay");
    const hintBtn = document.getElementById("btn-hint");
    hintBox.classList.add("visible");
    let utterance = new SpeechSynthesisUtterance(currentQ.word.toLowerCase());
    setVoice(utterance); utterance.rate = 0.5;
    window.speechSynthesis.speak(utterance);
    
    hintBtn.disabled = true;
    setTimeout(() => {
        hintBox.classList.remove("visible");
        if (document.getElementById("next-btn").style.display === "none") hintBtn.disabled = false;
    }, 2000);
}

function gainXP(amount) {
    if (isReviewMode) return;
    player.currentXP += amount;
    const reqXP = getRequiredXP(player.level);
    if (player.currentXP >= reqXP) { checkLevelUpCondition(); } 
    else { updateHUD(); }
}

function levelUp() {
    isReviewMode = false;
    player.level++;
    player.currentXP = 0;
    player.hp = MAX_HP; // 補滿血
    player.freeHints++; // ★ 獎勵：送一張券
    
    updateHUD();
    speak("Level Up!");
    fireConfetti();
    
    const modal = document.getElementById("levelup-modal");
    document.getElementById("levelup-title").innerText = `升到 Lv. ${player.level}！`;
    
    // 顯示下一階房屋
    let nextStageIndex = player.level - 1;
    if (nextStageIndex >= HOUSE_STAGES.length) nextStageIndex = HOUSE_STAGES.length - 1;
    document.getElementById("levelup-house").innerText = HOUSE_STAGES[nextStageIndex].icon;
    
    modal.style.display = "flex";
    updateHouse();
    cheerHouse("太棒了！我們搬新家囉！🎉");
}

function updateHouse() {
    let stageIndex = player.level - 1;
    if (stageIndex >= HOUSE_STAGES.length) stageIndex = HOUSE_STAGES.length - 1;
    const stage = HOUSE_STAGES[stageIndex];
    document.getElementById("my-house-icon").innerText = stage.icon;
    document.getElementById("house-name").innerText = stage.name;
}

// ... (以下為標準邏輯：registerMistake, handleVictory, speak 等) ...
function cheerHouse(message) {
    const bubble = document.getElementById("house-msg");
    bubble.innerText = message;
    bubble.classList.add("show");
    setTimeout(() => { bubble.classList.remove("show"); }, 3000);
}

function closeLevelUpModal() {
    document.getElementById("levelup-modal").style.display = "none";
    nextQuestion();
}

function registerMistake(wordObj) {
    if (!mistakeRegistry[wordObj.word]) { mistakeRegistry[wordObj.word] = { wordObj: wordObj, wins: 0 }; } 
    else { mistakeRegistry[wordObj.word].wins = 0; }
}

function handleNormalVictory() {
    let gainedXP = XP_PER_WIN;
    if (hasUsedHint || errorCount > 0) gainedXP = 5; 
    player.combo++;
    if (player.combo > 1) gainedXP += (player.combo * 2);
    gainXP(gainedXP);
    fireConfetti();
}

function handleReviewVictory() {
    const wordKey = currentQ.word;
    if (mistakeRegistry[wordKey]) {
        mistakeRegistry[wordKey].wins++;
        if (mistakeRegistry[wordKey].wins >= REQUIRED_REVIEW_WINS) {
            delete mistakeRegistry[wordKey];
        }
    }
    if (Object.keys(mistakeRegistry).length === 0) { levelUp(); } 
    else { fireConfetti(); }
}

function checkLevelUpCondition() {
    if (Object.keys(mistakeRegistry).length === 0) { levelUp(); } 
    else { startReviewMode(); }
}

function startReviewMode() {
    if (isReviewMode) return;
    isReviewMode = true; 
    player.currentXP = getRequiredXP(player.level); 
    updateHUD();
    speak("Boss Battle!");
    alert(`🚨 升級檢定！\n需複習 ${Object.keys(mistakeRegistry).length} 個錯字。`);
    nextQuestion(); 
}

function handleDamage() {
    player.hp--; player.combo = 0;
    document.body.classList.add("shake-screen");
    setTimeout(() => document.body.classList.remove("shake-screen"), 500);
    updateHUD();
    if (player.hp <= 0) setTimeout(gameOver, 500);
}

function speak(text) {
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

function playCurrentWord() { speak(currentQ.word); }
function gameOver() { speak("Game Over"); alert("💀 血量歸零！請重新挑戰！"); location.reload(); }
function fireConfetti() { if (typeof confetti === 'function') confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } }); }