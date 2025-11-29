// ===================================================
// 1. 遊戲參數 (新規則)
// ===================================================
const XP_WIN = 50;      // 答對 +50
const XP_LOSE = 30;     // 答錯 -30
const HINT_COST = 20;   // 偷看 -20 (取代扣血)

// 房屋進化表 (20階段：樹林 -> 整地 -> 建築 -> 城堡)
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

// 玩家狀態 (移除 HP)
let player = { name: "Player", level: 1, currentXP: 0, combo: 0, freeHints: 0 };
let voiceSettings = { gender: 'female', pitch: 1.1, rate: 0.8 };

let currentCategory = "ALL";
let filteredQuestions = [];
let currentQ = {};      
let currentInput = [];  
let isFrozen = false; 

// ===================================================
// 2. 單字庫
// ===================================================
const questionBank = [
    { word: "CAT", icon: "🐱", cn: "貓咪", cat: "animal" }, { word: "DOG", icon: "🐶", cn: "狗狗", cat: "animal" },
    { word: "PIG", icon: "🐷", cn: "豬", cat: "animal" }, { word: "BIRD", icon: "🐦", cn: "鳥", cat: "animal" },
    { word: "FISH", icon: "🐟", cn: "魚", cat: "animal" }, { word: "DUCK", icon: "🦆", cn: "鴨子", cat: "animal" },
    { word: "LION", icon: "🦁", cn: "獅子", cat: "animal" }, { word: "TIGER", icon: "🐯", cn: "老虎", cat: "animal" },
    { word: "BEAR", icon: "🐻", cn: "熊", cat: "animal" }, { word: "RABBIT", icon: "🐰", cn: "兔子", cat: "animal" },
    { word: "MONKEY", icon: "🐵", cn: "猴子", cat: "animal" }, { word: "ELEPHANT", icon: "🐘", cn: "大象", cat: "animal" },
    { word: "ZEBRA", icon: "🦓", cn: "斑馬", cat: "animal" }, { word: "ANT", icon: "🐜", cn: "螞蟻", cat: "animal" },
    { word: "RED", icon: "🔴", cn: "紅色", cat: "color" }, { word: "BLUE", icon: "🔵", cn: "藍色", cat: "color" },
    { word: "YELLOW", icon: "🟡", cn: "黃色", cat: "color" }, { word: "GREEN", icon: "🟢", cn: "綠色", cat: "color" },
    { word: "ORANGE", icon: "🟠", cn: "橘色", cat: "color" }, { word: "PURPLE", icon: "🟣", cn: "紫色", cat: "color" },
    { word: "BLACK", icon: "⚫", cn: "黑色", cat: "color" }, { word: "WHITE", icon: "⚪", cn: "白色", cat: "color" },
    { word: "PINK", icon: "🩷", cn: "粉紅色", cat: "color" },
    { word: "ONE", icon: "1️⃣", cn: "一", cat: "number" }, { word: "TWO", icon: "2️⃣", cn: "二", cat: "number" },
    { word: "THREE", icon: "3️⃣", cn: "三", cat: "number" }, { word: "FOUR", icon: "4️⃣", cn: "四", cat: "number" },
    { word: "FIVE", icon: "5️⃣", cn: "五", cat: "number" }, { word: "SIX", icon: "6️⃣", cn: "六", cat: "number" },
    { word: "SEVEN", icon: "7️⃣", cn: "七", cat: "number" }, { word: "EIGHT", icon: "8️⃣", cn: "八", cat: "number" },
    { word: "NINE", icon: "9️⃣", cn: "九", cat: "number" }, { word: "TEN", icon: "🔟", cn: "十", cat: "number" },
    { word: "APPLE", icon: "🍎", cn: "蘋果", cat: "food" }, { word: "BANANA", icon: "🍌", cn: "香蕉", cat: "food" },
    { word: "ORANGE", icon: "🍊", cn: "柳橙", cat: "food" }, { word: "LEMON", icon: "🍋", cn: "檸檬", cat: "food" },
    { word: "EGG", icon: "🥚", cn: "蛋", cat: "food" }, { word: "MILK", icon: "🥛", cn: "牛奶", cat: "food" },
    { word: "CAKE", icon: "🍰", cn: "蛋糕", cat: "food" }, { word: "ICE CREAM", icon: "🍦", cn: "冰淇淋", cat: "food" },
    { word: "RICE", icon: "🍚", cn: "米飯", cat: "food" }, { word: "WATER", icon: "💧", cn: "水", cat: "food" },
    { word: "PIZZA", icon: "🍕", cn: "披薩", cat: "food" }, { word: "HAMBURGER", icon: "🍔", cn: "漢堡", cat: "food" },
    { word: "HEAD", icon: "🗣️", cn: "頭", cat: "body" }, { word: "EYE", icon: "👁️", cn: "眼睛", cat: "body" },
    { word: "EAR", icon: "👂", cn: "耳朵", cat: "body" }, { word: "NOSE", icon: "👃", cn: "鼻子", cat: "body" },
    { word: "MOUTH", icon: "👄", cn: "嘴巴", cat: "body" }, { word: "HAND", icon: "🖐️", cn: "手", cat: "body" },
    { word: "LEG", icon: "🦵", cn: "腿", cat: "body" }, { word: "ARM", icon: "💪", cn: "手臂", cat: "body" },
    { word: "FOOT", icon: "🦶", cn: "腳", cat: "body" }, { word: "FACE", icon: "😀", cn: "臉", cat: "body" },
    { word: "PEN", icon: "🖊️", cn: "原子筆", cat: "item" }, { word: "PENCIL", icon: "✏️", cn: "鉛筆", cat: "item" },
    { word: "BOOK", icon: "📖", cn: "書", cat: "item" }, { word: "BAG", icon: "🎒", cn: "書包", cat: "item" },
    { word: "RULER", icon: "📏", cn: "尺", cat: "item" }, { word: "BOX", icon: "📦", cn: "箱子", cat: "item" },
    { word: "CHAIR", icon: "🪑", cn: "椅子", cat: "item" }, { word: "DESK", icon: "✍️", cn: "書桌", cat: "item" },
    { word: "CAR", icon: "🚗", cn: "車子", cat: "item" }, { word: "BUS", icon: "🚌", cn: "公車", cat: "item" },
    { word: "BIKE", icon: "🚲", cn: "腳踏車", cat: "item" }, { word: "BALL", icon: "⚽", cn: "球", cat: "item" },
    { word: "HAT", icon: "👒", cn: "帽子", cat: "item" },
    { word: "DAD", icon: "👨", cn: "爸爸" }, { word: "MOM", icon: "👩", cn: "媽媽" },
    { word: "BOY", icon: "👦", cn: "男孩" }, { word: "GIRL", icon: "👧", cn: "女孩" },
    { word: "BABY", icon: "👶", cn: "嬰兒" }, { word: "KING", icon: "👑", cn: "國王" }
];

window.onload = function() { 
    if('speechSynthesis' in window) window.speechSynthesis.getVoices(); 
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
    questionCount++;
    document.getElementById("q-count").innerText = questionCount;
    currentInput = [];
    
    document.getElementById("message-area").innerText = "";
    document.getElementById("next-btn").style.display = "none";
    document.getElementById("btn-hint").disabled = false;
    document.getElementById("btn-clear").disabled = false;
    document.getElementById("hint-overlay").classList.remove("visible");
    updateHintButton();

    // 隨機選題
    const randomIndex = Math.floor(Math.random() * filteredQuestions.length);
    currentQ = filteredQuestions[randomIndex];
    
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
        // --- 答對：加經驗 (50) ---
        document.getElementById("next-btn").style.display = "inline-block";
        document.getElementById("btn-clear").disabled = true;
        document.getElementById("btn-hint").disabled = true;
        msgDiv.innerHTML = "<span style='color:green; font-size:24px;'>🎉 Correct!</span>";

        gainXP(XP_WIN); // +50

        try {
            const randomCheer = HOUSE_CHEERS[Math.floor(Math.random() * HOUSE_CHEERS.length)];
            cheerHouse(randomCheer);
            const houseIcon = document.getElementById("my-house-icon");
            houseIcon.classList.add("bounce");
            setTimeout(() => houseIcon.classList.remove("bounce"), 1000);
            fireConfetti();
            speak("Correct! " + currentQ.word);
        } catch(e) {}

    } else {
        // --- 答錯：扣經驗 (30) ---
        loseXP(XP_LOSE); // -30
        
        msgDiv.innerHTML = "<span style='color:red'>❌ Wrong!</span>";
        try { speak("Try again"); cheerHouse("哎呀！扣分了！🛡️"); } catch(e){}
        
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
// 4. XP 系統 (核心邏輯重寫)
// ===================================================

// 計算升級所需經驗值 (20級曲線)
function getRequiredXP(level) {
    // Lv1: 100, Lv2: 150 ... Lv10: 550
    return 100 + (level - 1) * 50; 
}

// 獲得經驗
function gainXP(amount) {
    player.currentXP += amount;
    showXPGainEffect(amount, true); // 飄字 +50
    
    const required = getRequiredXP(player.level);
    
    // 檢查是否升級
    if (player.currentXP >= required) {
        player.currentXP = 0; // 歸零 (或保留溢出：player.currentXP -= required)
        levelUp();
    } else {
        updateHUD();
    }
}

// 失去經驗
function loseXP(amount) {
    player.currentXP -= amount;
    if (player.currentXP < 0) player.currentXP = 0; // 最低 0
    showXPGainEffect(amount, false); // 飄字 -30
    
    // 震動特效
    try {
        document.body.classList.add("shake-screen");
        setTimeout(() => document.body.classList.remove("shake-screen"), 500);
    } catch(e){}
    
    updateHUD();
}

// 飄字特效
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

function updateHUD() {
    document.getElementById("level-display").innerText = player.level;
    document.getElementById("ticket-count").innerText = player.freeHints;
    
    const maxXP = getRequiredXP(player.level);
    let percentage = (player.currentXP / maxXP) * 100;
    if (percentage > 100) percentage = 100;
    
    document.getElementById("xp-bar").style.width = percentage + "%";
    document.getElementById("xp-current").innerText = player.currentXP;
    document.getElementById("xp-max").innerText = maxXP;
}

function levelUp() {
    player.level++;
    if (player.level > 20) player.level = 20; // 最高 20 級
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

// ===================================================
// 5. 提示與聲音
// ===================================================
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
        updateHintButton();
        updateHUD();
    } else {
        // 沒券扣經驗
        if (player.currentXP < HINT_COST) {
            // 經驗不夠也能看，但扣到0 (寬容模式)
            player.currentXP = 0;
        } else {
            player.currentXP -= HINT_COST;
        }
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
