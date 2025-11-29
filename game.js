// ===================================================
// 1. 遊戲參數與狀態
// ===================================================
const MAX_HP = 8;
const XP_PER_LEVEL = 100;
const XP_PER_WIN = 20;
const HINT_HP_COST = 0.5;
const REQUIRED_REVIEW_WINS = 3;

// 房屋進化表
const HOUSE_STAGES = [
    { icon: "⛺", name: "破舊帳篷" },
    { icon: "🛖", name: "溫馨木屋" },
    { icon: "🏠", name: "堅固磚屋" },
    { icon: "🏡", name: "花園別墅" },
    { icon: "🏰", name: "豪華城堡" },
    { icon: "🏯", name: "東方宮殿" },
    { icon: "🌌", name: "天空之城" },
    { icon: "👑", name: "國王的家" }
];

// 房子加油語錄
const HOUSE_CHEERS = [
    "好棒！磚塊+1 🧱", "離城堡越來越近了！🏰", "哇！你拼對了！✨",
    "房子正在變大喔！🏠", "勇者太強了！⚔️", "我也想變城堡！加油！",
    "Nice Job! 👍", "繼續保持！🔥"
];

let player = {
    name: "Player",
    hp: MAX_HP,
    level: 1,
    currentXP: 0,
    combo: 0
};

let voiceSettings = { gender: 'female', pitch: 1.1, rate: 0.8 };
let currentQ = {};      
let currentInput = [];  
let errorCount = 0;     
let questionCount = 0;  
let hasUsedHint = false;
let mistakeRegistry = {}; 
let isReviewMode = false;
let isFrozen = false; 

// ===================================================
// 2. 完整單字庫 (已修正 Desk/Chair, 增加中文)
// ===================================================
const questionBank = [
    { word: "CAT", icon: "🐱", cn: "貓咪" }, { word: "DOG", icon: "🐶", cn: "狗狗" },
    { word: "PIG", icon: "🐷", cn: "豬" }, { word: "BIRD", icon: "🐦", cn: "鳥" },
    { word: "FISH", icon: "🐟", cn: "魚" }, { word: "DUCK", icon: "🦆", cn: "鴨子" },
    { word: "LION", icon: "🦁", cn: "獅子" }, { word: "TIGER", icon: "🐯", cn: "老虎" },
    { word: "BEAR", icon: "🐻", cn: "熊" }, { word: "RABBIT", icon: "🐰", cn: "兔子" },
    { word: "MONKEY", icon: "🐵", cn: "猴子" }, { word: "ELEPHANT", icon: "🐘", cn: "大象" },
    { word: "ZEBRA", icon: "🦓", cn: "斑馬" }, { word: "ANT", icon: "🐜", cn: "螞蟻" },
    
    { word: "RED", icon: "🔴", cn: "紅色" }, { word: "BLUE", icon: "🔵", cn: "藍色" },
    { word: "YELLOW", icon: "🟡", cn: "黃色" }, { word: "GREEN", icon: "🟢", cn: "綠色" },
    { word: "ORANGE", icon: "🟠", cn: "橘色" }, { word: "PURPLE", icon: "🟣", cn: "紫色" },
    { word: "BLACK", icon: "⚫", cn: "黑色" }, { word: "WHITE", icon: "⚪", cn: "白色" },
    { word: "PINK", icon: "🩷", cn: "粉紅色" },

    { word: "ONE", icon: "1️⃣", cn: "一" }, { word: "TWO", icon: "2️⃣", cn: "二" },
    { word: "THREE", icon: "3️⃣", cn: "三" }, { word: "FOUR", icon: "4️⃣", cn: "四" },
    { word: "FIVE", icon: "5️⃣", cn: "五" }, { word: "SIX", icon: "6️⃣", cn: "六" },
    { word: "SEVEN", icon: "7️⃣", cn: "七" }, { word: "EIGHT", icon: "8️⃣", cn: "八" },
    { word: "NINE", icon: "9️⃣", cn: "九" }, { word: "TEN", icon: "🔟", cn: "十" },

    { word: "APPLE", icon: "🍎", cn: "蘋果" }, { word: "BANANA", icon: "🍌", cn: "香蕉" },
    { word: "ORANGE", icon: "🍊", cn: "柳橙" }, { word: "LEMON", icon: "🍋", cn: "檸檬" },
    { word: "EGG", icon: "🥚", cn: "蛋" }, { word: "MILK", icon: "🥛", cn: "牛奶" },
    { word: "CAKE", icon: "🍰", cn: "蛋糕" }, { word: "ICE CREAM", icon: "🍦", cn: "冰淇淋" },
    { word: "RICE", icon: "🍚", cn: "米飯" }, { word: "WATER", icon: "💧", cn: "水" },
    { word: "PIZZA", icon: "🍕", cn: "披薩" }, { word: "HOT DOG", icon: "🌭", cn: "熱狗" },
    { word: "HAMBURGER", icon: "🍔", cn: "漢堡" },

    { word: "HEAD", icon: "🗣️", cn: "頭" }, { word: "EYE", icon: "👁️", cn: "眼睛" },
    { word: "EAR", icon: "👂", cn: "耳朵" }, { word: "NOSE", icon: "👃", cn: "鼻子" },
    { word: "MOUTH", icon: "👄", cn: "嘴巴" }, { word: "HAND", icon: "🖐️", cn: "手" },
    { word: "LEG", icon: "🦵", cn: "腿" }, { word: "ARM", icon: "💪", cn: "手臂" },
    { word: "FOOT", icon: "🦶", cn: "腳" }, { word: "FACE", icon: "😀", cn: "臉" },

    { word: "PEN", icon: "🖊️", cn: "原子筆" }, { word: "PENCIL", icon: "✏️", cn: "鉛筆" },
    { word: "BOOK", icon: "📖", cn: "書" }, { word: "BAG", icon: "🎒", cn: "書包" },
    { word: "RULER", icon: "📏", cn: "尺" }, { word: "BOX", icon: "📦", cn: "箱子" },
    { word: "CHAIR", icon: "🪑", cn: "椅子" }, { word: "DESK", icon: "✍️", cn: "書桌" },
    { word: "CAR", icon: "🚗", cn: "車子" }, { word: "BUS", icon: "🚌", cn: "公車" },
    { word: "BIKE", icon: "🚲", cn: "腳踏車" }, { word: "BALL", icon: "⚽", cn: "球" },
    { word: "ROBOT", icon: "🤖", cn: "機器人" }, { word: "HAT", icon: "👒", cn: "帽子" },
    
    { word: "DAD", icon: "👨", cn: "爸爸" }, { word: "MOM", icon: "👩", cn: "媽媽" },
    { word: "BOY", icon: "👦", cn: "男孩" }, { word: "GIRL", icon: "👧", cn: "女孩" },
    { word: "BABY", icon: "👶", cn: "嬰兒" }, { word: "KING", icon: "👑", cn: "國王" }
];

window.onload = function() { window.speechSynthesis.getVoices(); };

// ===================================================
// 3. 遊戲流程
// ===================================================
function startGame(gender) {
    const nameInput = document.getElementById('player-name-input').value.trim();
    player.name = nameInput || "勇者";
    document.getElementById('player-name-display').innerText = player.name;

    voiceSettings.gender = gender;
    voiceSettings.pitch = (gender === 'male') ? 0.8 : 1.2;

    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('hud').style.display = 'block';
    document.getElementById('game-container').style.display = 'block';

    updateHUD();
    updateHouse();
    cheerHouse(`你好，${player.name}！我們來蓋房子吧！`);
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
    document.getElementById("next-btn").style.display = "none";
    document.getElementById("btn-hint").disabled = false;
    document.getElementById("btn-clear").disabled = false;
    document.getElementById("hint-overlay").classList.remove("visible");
    
    if (isReviewMode) {
        const mistakes = Object.keys(mistakeRegistry);
        if (mistakes.length === 0) { levelUp(); return; }
        const randomKey = mistakes[Math.floor(Math.random() * mistakes.length)];
        currentQ = mistakeRegistry[randomKey].wordObj;
        document.getElementById("message-area").innerHTML = `<span style='color:#e91e63'>🔥 複習剩餘：${REQUIRED_REVIEW_WINS - mistakeRegistry[randomKey].wins} 次</span>`;
    } else {
        const randomIndex = Math.floor(Math.random() * questionBank.length);
        currentQ = questionBank[randomIndex];
    }
    
    document.getElementById("image-area").innerText = currentQ.icon;
    document.getElementById("hint-overlay").innerText = currentQ.word;
    document.getElementById("cn-meaning").innerText = currentQ.cn;

    renderSlots();

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
    
    setTimeout(() => { speak(currentQ.word); }, 500);
}

function renderSlots() {
    const slotsDiv = document.getElementById("answer-slots");
    slotsDiv.innerHTML = "";
    for (let i = 0; i < currentQ.word.length; i++) {
        let slot = document.createElement("div");
        slot.className = "slot";
        slot.id = "slot-" + i;
        if (currentQ.word[i] === " ") {
            slot.style.borderBottom = "none";
            slot.innerHTML = "&nbsp;";
        }
        slotsDiv.appendChild(slot);
    }
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

    if (currentInput.length === cleanWord.length) {
        checkAnswer();
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
        // --- 答錯 ---
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
             setTimeout(() => {
                 msgDiv.innerHTML += "<br><span style='color:#e91e63; font-size:0.9rem'>💡 用提示吧！(-0.5❤)</span>";
             }, 1500);
        }
    }
}

function cheerHouse(message) {
    const bubble = document.getElementById("house-msg");
    bubble.innerText = message;
    bubble.classList.add("show");
    setTimeout(() => { bubble.classList.remove("show"); }, 3000);
}

function updateHouse() {
    let stageIndex = player.level - 1;
    if (stageIndex >= HOUSE_STAGES.length) stageIndex = HOUSE_STAGES.length - 1;
    
    const stage = HOUSE_STAGES[stageIndex];
    document.getElementById("my-house-icon").innerText = stage.icon;
    document.getElementById("house-name").innerText = stage.name;
}

function levelUp() {
    isReviewMode = false;
    player.level++;
    player.currentXP = 0;
    player.hp = MAX_HP;
    
    updateHUD();
    speak("Level Up!");
    fireConfetti();
    
    const modal = document.getElementById("levelup-modal");
    document.getElementById("levelup-title").innerText = `恭喜 ${player.name} 升到 Lv. ${player.level}！`;
    
    let nextStageIndex = player.level - 1;
    if (nextStageIndex >= HOUSE_STAGES.length) nextStageIndex = HOUSE_STAGES.length - 1;
    document.getElementById("levelup-house").innerText = HOUSE_STAGES[nextStageIndex].icon;
    
    modal.style.display = "flex";
    updateHouse();
    cheerHouse("太棒了！我們搬新家囉！🎉");
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

function gainXP(amount) {
    if (isReviewMode) return;
    player.currentXP += amount;
    if (player.currentXP >= XP_PER_LEVEL) { checkLevelUpCondition(); } 
    else { updateHUD(); }
}

function checkLevelUpCondition() {
    if (Object.keys(mistakeRegistry).length === 0) { levelUp(); } 
    else { startReviewMode(); }
}

function startReviewMode() {
    if (isReviewMode) return;
    isReviewMode = true; player.currentXP = XP_PER_LEVEL; updateHUD();
    speak("Boss Battle!");
    alert(`🚨 升級檢定！\n有 ${Object.keys(mistakeRegistry).length} 個錯字要複習。\n通過才能升級！`);
    nextQuestion(); 
}

function handleDamage() {
    player.hp--; player.combo = 0;
    document.body.classList.add("shake-screen");
    setTimeout(() => document.body.classList.remove("shake-screen"), 500);
    updateHUD();
    if (player.hp <= 0) setTimeout(gameOver, 500);
}

function showHint() {
    if (player.hp <= HINT_HP_COST) { alert("血量不足！"); return; }
    player.hp -= HINT_HP_COST; hasUsedHint = true; updateHUD();
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

function updateHUD() {
    document.getElementById("level-display").innerText = player.level;
    let hearts = "";
    const fullHearts = Math.floor(player.hp);
    const hasHalfHeart = (player.hp % 1 !== 0);
    for(let i=0; i<fullHearts; i++) hearts += "❤️";
    if (hasHalfHeart) hearts += "💔";
    const emptyHearts = MAX_HP - Math.ceil(player.hp);
    for(let i=0; i<emptyHearts; i++) hearts += "🖤";
    document.getElementById("hp-display").innerText = hearts;
    let percentage = (player.currentXP / XP_PER_LEVEL) * 100;
    if (percentage > 100) percentage = 100;
    document.getElementById("xp-bar").style.width = percentage + "%";
}

function gameOver() {
    speak("Game Over"); alert("💀 血量歸零了！請重新挑戰！");
    location.reload(); 
}

function fireConfetti() { if (typeof confetti === 'function') confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } }); }