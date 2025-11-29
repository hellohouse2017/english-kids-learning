// ===================================================
// 1. 遊戲參數與狀態設定
// ===================================================
const MAX_HP = 8;           // 最大血量改為 8 顆心
const XP_PER_LEVEL = 100;   // 升級所需經驗
const XP_PER_WIN = 20;      // 答對基礎經驗
const HINT_HP_COST = 0.5;   // 偷看一眼扣 0.5 顆心
const REQUIRED_REVIEW_WINS = 3; // 錯題複習次數

// 玩家狀態
let player = {
    hp: MAX_HP,
    level: 1,
    currentXP: 0,
    combo: 0
};

// 聲音設定
let voiceSettings = {
    gender: 'female', // 預設女生
    pitch: 1.1,       // 預設音調
    rate: 0.8         // 預設語速
};

// 遊戲局狀態
let currentQ = {};      
let currentInput = [];  
let errorCount = 0;     
let questionCount = 0;  
let hasUsedHint = false;

// 錯題記錄
let mistakeRegistry = {}; 
let isReviewMode = false;

// ===================================================
// 2. 完整單字庫
// ===================================================
const questionBank = [
    // === 動物 ===
    { word: "CAT", icon: "🐱" }, { word: "DOG", icon: "🐶" },
    { word: "PIG", icon: "🐷" }, { word: "BIRD", icon: "🐦" },
    { word: "FISH", icon: "🐟" }, { word: "DUCK", icon: "🦆" },
    { word: "LION", icon: "🦁" }, { word: "TIGER", icon: "🐯" },
    { word: "BEAR", icon: "🐻" }, { word: "RABBIT", icon: "🐰" },
    { word: "MONKEY", icon: "🐵" }, { word: "ELEPHANT", icon: "🐘" },
    { word: "ZEBRA", icon: "🦓" }, { word: "ANT", icon: "🐜" },
    // === 顏色 ===
    { word: "RED", icon: "🔴" }, { word: "BLUE", icon: "🔵" },
    { word: "YELLOW", icon: "🟡" }, { word: "GREEN", icon: "🟢" },
    { word: "ORANGE", icon: "🟠" }, { word: "PURPLE", icon: "🟣" },
    { word: "BLACK", icon: "⚫" }, { word: "WHITE", icon: "⚪" },
    { word: "PINK", icon: "🩷" },
    // === 數字 ===
    { word: "ONE", icon: "1️⃣" }, { word: "TWO", icon: "2️⃣" },
    { word: "THREE", icon: "3️⃣" }, { word: "FOUR", icon: "4️⃣" },
    { word: "FIVE", icon: "5️⃣" }, { word: "SIX", icon: "6️⃣" },
    { word: "SEVEN", icon: "7️⃣" }, { word: "EIGHT", icon: "8️⃣" },
    { word: "NINE", icon: "9️⃣" }, { word: "TEN", icon: "🔟" },
    // === 食物 ===
    { word: "APPLE", icon: "🍎" }, { word: "BANANA", icon: "🍌" },
    { word: "ORANGE", icon: "🍊" }, { word: "LEMON", icon: "🍋" },
    { word: "EGG", icon: "🥚" }, { word: "MILK", icon: "🥛" },
    { word: "CAKE", icon: "🍰" }, { word: "ICE CREAM", icon: "🍦" },
    { word: "RICE", icon: "🍚" }, { word: "WATER", icon: "💧" },
    { word: "PIZZA", icon: "🍕" }, { word: "HOT DOG", icon: "🌭" },
    { word: "HAMBURGER", icon: "🍔" },
    // === 身體 ===
    { word: "HEAD", icon: "🗣️" }, { word: "EYE", icon: "👁️" },
    { word: "EAR", icon: "👂" }, { word: "NOSE", icon: "👃" },
    { word: "MOUTH", icon: "👄" }, { word: "HAND", icon: "🖐️" },
    { word: "LEG", icon: "🦵" }, { word: "ARM", icon: "💪" },
    { word: "FOOT", icon: "🦶" }, { word: "FACE", icon: "😀" },
    // === 文具與生活 ===
    { word: "PEN", icon: "🖊️" }, { word: "PENCIL", icon: "✏️" },
    { word: "BOOK", icon: "📖" }, { word: "BAG", icon: "🎒" },
    { word: "RULER", icon: "📏" }, { word: "BOX", icon: "📦" },
    { word: "DESK", icon: "🏫" }, { word: "CHAIR", icon: "🪑" },
    { word: "CAR", icon: "🚗" }, { word: "BUS", icon: "🚌" },
    { word: "BIKE", icon: "🚲" }, { word: "BALL", icon: "⚽" },
    { word: "ROBOT", icon: "🤖" }, { word: "HAT", icon: "👒" },
    // === 家庭 ===
    { word: "DAD", icon: "👨" }, { word: "MOM", icon: "👩" },
    { word: "BOY", icon: "👦" }, { word: "GIRL", icon: "👧" },
    { word: "BABY", icon: "👶" }, { word: "KING", icon: "👑" }
];

// ===================================================
// 3. 遊戲初始化 (選聲音)
// ===================================================

// 網頁載入時不直接開始，等待使用者選聲音
window.onload = function() {
    // 預先載入聲音列表 (Chrome 需要)
    window.speechSynthesis.getVoices();
};

function startGame(gender) {
    // 1. 設定聲音參數
    voiceSettings.gender = gender;
    
    if (gender === 'male') {
        voiceSettings.pitch = 0.8; // 男生音調低
    } else {
        voiceSettings.pitch = 1.2; // 女生音調高
    }

    // 2. 切換介面
    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('hud').style.display = 'block'; // 顯示血條
    document.getElementById('game-container').style.display = 'block'; // 顯示遊戲區

    // 3. 開始遊戲
    updateHUD();
    nextQuestion();
}

// ===================================================
// 4. 出題邏輯
// ===================================================
function nextQuestion() {
    // 重置單題狀態
    if (!isReviewMode) {
        questionCount++;
        document.getElementById("q-count").innerText = questionCount;
    } else {
        document.getElementById("q-count").innerText = "🔥魔王關";
    }
    
    errorCount = 0;
    currentInput = [];
    hasUsedHint = false;
    
    // UI 重置
    document.getElementById("message-area").innerText = "";
    document.getElementById("next-btn").style.display = "none";
    document.getElementById("btn-hint").disabled = false;
    document.getElementById("btn-clear").disabled = false; // 啟用重寫按鈕
    
    const hintBox = document.getElementById("hint-overlay");
    hintBox.classList.remove("visible");
    
    // 選題邏輯
    if (isReviewMode) {
        const mistakes = Object.keys(mistakeRegistry);
        if (mistakes.length === 0) { levelUp(); return; }
        const randomKey = mistakes[Math.floor(Math.random() * mistakes.length)];
        currentQ = mistakeRegistry[randomKey].wordObj;
        document.getElementById("message-area").innerHTML = `<span style='color:#e91e63'>🔥 複習挑戰：剩 ${REQUIRED_REVIEW_WINS - mistakeRegistry[randomKey].wins} 次</span>`;
    } else {
        const randomIndex = Math.floor(Math.random() * questionBank.length);
        currentQ = questionBank[randomIndex];
    }
    
    // 渲染畫面
    document.getElementById("image-area").innerText = currentQ.icon;
    hintBox.innerText = currentQ.word;

    // 建立底線
    renderSlots();

    // 建立字母
    const poolDiv = document.getElementById("letter-pool");
    poolDiv.innerHTML = "";
    let letters = currentQ.word.replace(/ /g, "").split('');
    letters.sort(() => Math.random() - 0.5);

    letters.forEach((char) => {
        let btn = document.createElement("button");
        btn.innerText = char;
        btn.className = "letter-btn";
        btn.onclick = function() { selectLetter(char, this); };
        // 把按鈕物件存起來方便之後「重寫」時恢復
        btn.dataset.char = char; 
        poolDiv.appendChild(btn);
    });
    
    setTimeout(() => { speak(currentQ.word); }, 500);
}

// 渲染底線的函式 (獨立出來給重寫用)
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
            // 空格不推入 currentInput，由邏輯自動判斷忽略
        }
        slotsDiv.appendChild(slot);
    }
}

function selectLetter(char, btnElement) {
    // 注意：這裡不計算空格，直接比對實際長度
    const cleanWord = currentQ.word.replace(/ /g, "");
    if (currentInput.length >= cleanWord.length) return;
    
    speak(char);
    currentInput.push(char);
    
    // 填入底線 (要跳過空格)
    // 邏輯：我們要算出現在填的是第幾個「非空格」位置，然後對應到正確的 slot ID
    let fillIndex = 0; // 目前要填的 slot 索引
    let inputCount = 0; // 已經填入的字母數
    
    // 尋找下一個空的 slot
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

// ===================================================
// 5. 新增：重寫功能 (Reset Input)
// ===================================================
function resetInput() {
    // 1. 清空玩家輸入陣列
    currentInput = [];
    
    // 2. 清空底線顯示
    const slots = document.getElementsByClassName("slot");
    for(let s of slots) {
        if(s.innerHTML !== "&nbsp;") s.innerText = "";
    }
    
    // 3. 恢復所有按鈕狀態
    const btns = document.getElementsByClassName("letter-btn");
    for(let b of btns) {
        b.classList.remove("used");
        b.disabled = false;
    }
    
    // 4. (選用) 播放一個擦除的音效或提示音
    // speak("Clear"); 
}

// ===================================================
// 6. 檢查答案
// ===================================================
function checkAnswer() {
    // 比對時要把題目的空格拿掉
    const cleanWord = currentQ.word.replace(/ /g, "");
    const playerAnswer = currentInput.join("");
    const msgDiv = document.getElementById("message-area");

    if (playerAnswer === cleanWord) {
        // 禁用重寫按鈕，避免答對後還按到
        document.getElementById("btn-clear").disabled = true;
        
        if (isReviewMode) handleReviewVictory();
        else handleNormalVictory();
        
        msgDiv.innerHTML += " <span style='color:green; font-size:24px;'>⚔️ Correct!</span>";
        speak("Correct! " + currentQ.word);
        
        document.getElementById("next-btn").style.display = "inline-block";
        document.getElementById("btn-hint").disabled = true;

    } else {
        handleDamage();
        msgDiv.innerHTML = "<span style='color:red'>🛡️ Wrong!</span>";
        speak("Try again");

        registerMistake(currentQ);
        
        errorCount++;
        if (errorCount >= 2) {
             msgDiv.innerHTML += "<br><span style='color:#e91e63; font-size:0.9rem'>💡 用提示吧！(-0.5❤)</span>";
             const hintBtn = document.getElementById("btn-hint");
             hintBtn.style.transform = "scale(1.2)";
             setTimeout(() => hintBtn.style.transform = "scale(1)", 300);
        }
        
        // 答錯自動重置，給予 1.2 秒反應時間
        setTimeout(() => resetInput(), 1200);
    }
}

// ... (registerMistake, handleNormalVictory, handleReviewVictory 等邏輯維持不變) ...
// 為了程式碼完整性，以下重複必要邏輯

function registerMistake(wordObj) {
    if (!mistakeRegistry[wordObj.word]) {
        mistakeRegistry[wordObj.word] = { wordObj: wordObj, wins: 0 };
    } else {
        mistakeRegistry[wordObj.word].wins = 0;
    }
}

function handleNormalVictory() {
    let gainedXP = XP_PER_WIN;
    if (hasUsedHint || errorCount > 0) gainedXP = 5; 
    player.combo++;
    showCombo(player.combo);
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
            alert(`恭喜！你已經完全學會 ${wordKey} 了！`);
        }
    }
    if (Object.keys(mistakeRegistry).length === 0) {
        levelUp(); 
    } else {
        fireConfetti();
    }
}

function gainXP(amount) {
    if (isReviewMode) return;
    player.currentXP += amount;
    if (player.currentXP >= XP_PER_LEVEL) {
        checkLevelUpCondition();
    } else {
        updateHUD();
    }
}

function checkLevelUpCondition() {
    const mistakeCount = Object.keys(mistakeRegistry).length;
    if (mistakeCount === 0) {
        levelUp();
    } else {
        startReviewMode();
    }
}

function startReviewMode() {
    if (isReviewMode) return;
    isReviewMode = true;
    player.currentXP = XP_PER_LEVEL;
    updateHUD();
    speak("Boss Battle!");
    alert(`🚨 魔王挑戰！\n\n有 ${Object.keys(mistakeRegistry).length} 個錯字要複習。\n通過才能升級！`);
    nextQuestion(); 
}

function levelUp() {
    isReviewMode = false;
    player.level++;
    player.currentXP = 0;
    player.hp = MAX_HP;
    updateHUD();
    speak("Level Up! Congratulations!");
    fireConfetti();
    setTimeout(() => {
        alert(`🎉 LEVEL UP! 升到 Lv. ${player.level}！\n🎁 血量補滿！`);
        nextQuestion();
    }, 500);
}

function handleDamage() {
    player.hp--;
    player.combo = 0;
    hideCombo();
    document.body.classList.add("shake-screen");
    setTimeout(() => document.body.classList.remove("shake-screen"), 500);
    updateHUD();
    if (player.hp <= 0) {
        setTimeout(gameOver, 500);
    }
}

function showHint() {
    if (player.hp <= HINT_HP_COST) {
        alert("血量不足，不能偷看！加油！");
        return;
    }
    player.hp -= HINT_HP_COST;
    hasUsedHint = true;
    updateHUD();
    const hintBox = document.getElementById("hint-overlay");
    const hintBtn = document.getElementById("btn-hint");
    hintBox.classList.add("visible");
    
    // 提示時也轉成小寫，確保發音正確
    let utterance = new SpeechSynthesisUtterance(currentQ.word.toLowerCase());
    setVoice(utterance);
    utterance.rate = 0.5;
    window.speechSynthesis.speak(utterance);
    
    hintBtn.disabled = true;
    setTimeout(() => {
        hintBox.classList.remove("visible");
        if (document.getElementById("next-btn").style.display === "none") {
             hintBtn.disabled = false;
        }
    }, 2000);
}

// ===================================================
// 7. 語音功能 (關鍵修正：小寫 + 聲音選擇)
// ===================================================
function speak(text) {
    window.speechSynthesis.cancel();
    // ★ 關鍵修正：將文字轉為小寫 (.toLowerCase())
    // 這樣瀏覽器就會把它當成單字唸，而不是拼字母 (dog vs D-O-G)
    const utterance = new SpeechSynthesisUtterance(text.toLowerCase());
    
    setVoice(utterance);
    
    window.speechSynthesis.speak(utterance);
}

function setVoice(utterance) {
    utterance.lang = 'en-US';
    utterance.rate = voiceSettings.rate;
    utterance.pitch = voiceSettings.pitch;
    
    // 嘗試尋找對應性別的聲音 (這部分取決於瀏覽器支援度)
    // 如果找不到特定性別，我們主要依賴上面的 pitch (音調) 來區分
    const voices = window.speechSynthesis.getVoices();
    let targetVoice = null;

    if (voiceSettings.gender === 'male') {
        // 嘗試找名字裡有 Male 的聲音 (如 Google US English Male)
        targetVoice = voices.find(v => v.name.includes('Male') && v.lang.includes('en'));
    } else {
        // 嘗試找名字裡有 Female 的聲音
        targetVoice = voices.find(v => v.name.includes('Female') && v.lang.includes('en'));
    }

    // 如果找到了就設定，沒找到就用系統預設 (但音調 pitch 已經有調整了)
    if (targetVoice) {
        utterance.voice = targetVoice;
    }
}

function playCurrentWord() {
    speak(currentQ.word);
}

// ===================================================
// 8. 介面更新
// ===================================================
function updateHUD() {
    document.getElementById("level-display").innerText = player.level;
    
    let hearts = "";
    const fullHearts = Math.floor(player.hp);
    const hasHalfHeart = (player.hp % 1 !== 0);
    
    for(let i=0; i<fullHearts; i++) hearts += "❤️";
    if (hasHalfHeart) hearts += "💔";
    
    // 計算空心 (總共 8 顆)
    const emptyHearts = MAX_HP - Math.ceil(player.hp);
    for(let i=0; i<emptyHearts; i++) hearts += "🖤";
    
    document.getElementById("hp-display").innerText = hearts;

    let percentage = (player.currentXP / XP_PER_LEVEL) * 100;
    if (percentage > 100) percentage = 100;
    document.getElementById("xp-bar").style.width = percentage + "%";
}

function showCombo(count) {
    if (count < 2) return;
    const comboDiv = document.getElementById("combo-display");
    comboDiv.innerText = `Combo x${count}!`;
    comboDiv.classList.add("show");
}

function hideCombo() {
    document.getElementById("combo-display").classList.remove("show");
}

function gameOver() {
    speak("Game Over");
    alert("💀 Game Over! 血量歸零了！\n\n請重新挑戰！");
    // 重置
    player.hp = MAX_HP;
    player.level = 1;
    player.currentXP = 0;
    player.combo = 0;
    mistakeRegistry = {}; 
    isReviewMode = false;
    updateHUD();
    nextQuestion();
}

function fireConfetti() {
    if (typeof confetti === 'function') {
        confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
    }
}