// 檔案名稱：game.js (錯題複習機制版)

// ===================================================
// 1. 遊戲參數與狀態設定
// ===================================================
const MAX_HP = 10;          // 最大血量提升到 10
const XP_PER_LEVEL = 100;   // 升級所需經驗
const XP_PER_WIN = 20;      // 答對基礎經驗
const HINT_HP_COST = 0.5;   // 偷看一眼扣 0.5 顆心
const REQUIRED_REVIEW_WINS = 3; // 錯題必須答對幾次才能消除

// 玩家狀態
let player = {
    hp: MAX_HP,
    level: 1,
    currentXP: 0,
    combo: 0
};

// 遊戲局狀態
let currentQ = {};      
let currentInput = [];  
let errorCount = 0;     
let questionCount = 0;  
let hasUsedHint = false;

// === 核心：錯題記錄系統 ===
// 格式: { "CAT": { wordObj: object, wins: 0 }, ... }
let mistakeRegistry = {}; 
let isReviewMode = false; // 是否處於「升級前的魔王挑戰」狀態

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
// 3. 遊戲初始化
// ===================================================
window.onload = function() {
    updateHUD();
    nextQuestion();
};

// ===================================================
// 4. 出題邏輯 (包含複習模式判斷)
// ===================================================

function nextQuestion() {
    // 重置單題狀態
    if (!isReviewMode) {
        questionCount++;
        document.getElementById("q-count").innerText = questionCount;
    } else {
        document.getElementById("q-count").innerText = "🔥魔王關"; // 複習模式顯示
    }
    
    errorCount = 0;
    currentInput = [];
    hasUsedHint = false;
    
    // UI 重置
    document.getElementById("message-area").innerText = "";
    document.getElementById("next-btn").style.display = "none";
    document.getElementById("btn-hint").disabled = false;
    const hintBox = document.getElementById("hint-overlay");
    hintBox.classList.remove("visible");
    
    // --- 選題邏輯 ---
    if (isReviewMode) {
        // [複習模式] 從錯題本中選題
        const mistakes = Object.keys(mistakeRegistry);
        if (mistakes.length === 0) {
            // 萬一發生錯誤沒題目了，直接升級
            levelUp();
            return;
        }
        // 隨機選一個還沒通過複習的字
        const randomKey = mistakes[Math.floor(Math.random() * mistakes.length)];
        currentQ = mistakeRegistry[randomKey].wordObj;
        
        // 提示玩家還剩多少字
        speak("Review time! " + currentQ.word);
        document.getElementById("message-area").innerHTML = `<span style='color:#e91e63'>🔥 複習挑戰：這個字還要答對 ${REQUIRED_REVIEW_WINS - mistakeRegistry[randomKey].wins} 次</span>`;
    } else {
        // [一般模式] 隨機選題
        const randomIndex = Math.floor(Math.random() * questionBank.length);
        currentQ = questionBank[randomIndex];
    }
    
    // --- 渲染畫面 ---
    document.getElementById("image-area").innerText = currentQ.icon;
    hintBox.innerText = currentQ.word;

    // 建立底線
    const slotsDiv = document.getElementById("answer-slots");
    slotsDiv.innerHTML = "";
    for (let i = 0; i < currentQ.word.length; i++) {
        let slot = document.createElement("div");
        slot.className = "slot";
        slot.id = "slot-" + i;
        if (currentQ.word[i] === " ") {
            slot.style.borderBottom = "none";
            slot.innerHTML = "&nbsp;";
            currentInput.push(" ");
        }
        slotsDiv.appendChild(slot);
    }

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
        poolDiv.appendChild(btn);
    });
    
    // 一般模式才自動發音，複習模式讓孩子先看圖想一下，增加難度 (或保留發音皆可，這裡保留發音)
    setTimeout(() => {
        speak(currentQ.word);
    }, 500);
}

function selectLetter(char, btnElement) {
    if (currentInput.length >= currentQ.word.length) return;
    speak(char);
    currentInput.push(char);
    
    const slotIndex = currentInput.length - 1;
    const slot = document.getElementById("slot-" + slotIndex);
    if (slot) slot.innerText = char;
    
    btnElement.classList.add("used");
    btnElement.disabled = true;

    if (currentInput.length === currentQ.word.length) {
        checkAnswer();
    }
}

// ===================================================
// 5. 檢查答案
// ===================================================

function checkAnswer() {
    const playerAnswer = currentInput.join("");
    const msgDiv = document.getElementById("message-area");

    if (playerAnswer === currentQ.word) {
        // --- 答對 ---
        if (isReviewMode) {
            handleReviewVictory(); // 處理複習模式的勝利
        } else {
            handleNormalVictory(); // 處理一般模式的勝利
        }
        
        msgDiv.innerHTML += " <span style='color:green; font-size:24px;'>⚔️ Correct!</span>";
        speak("Correct! " + currentQ.word);
        
        document.getElementById("next-btn").style.display = "inline-block";
        document.getElementById("btn-hint").disabled = true;

    } else {
        // --- 答錯 ---
        handleDamage();
        msgDiv.innerHTML = "<span style='color:red'>🛡️ Wrong!</span>";
        speak("Try again");

        // 記錄錯題 (不管是不是複習模式，錯了都要加進去/重置次數)
        registerMistake(currentQ);
        
        errorCount++;
        if (errorCount >= 2) {
             msgDiv.innerHTML += "<br><span style='color:#e91e63; font-size:0.9rem'>💡 用提示吧！(扣 0.5 愛心)</span>";
             const hintBtn = document.getElementById("btn-hint");
             hintBtn.style.transform = "scale(1.2)";
             setTimeout(() => hintBtn.style.transform = "scale(1)", 300);
        }
        
        setTimeout(() => resetCurrentLevel(), 1200);
    }
}

// 記錄錯題的函式
function registerMistake(wordObj) {
    if (!mistakeRegistry[wordObj.word]) {
        // 如果是新錯題，加入名單
        mistakeRegistry[wordObj.word] = {
            wordObj: wordObj,
            wins: 0 // 累積勝利次數歸零
        };
    } else {
        // 如果已經在名單裡又錯了，勝利次數歸零 (嚴格制)
        mistakeRegistry[wordObj.word].wins = 0;
    }
}

// ===================================================
// 6. 勝利與升級邏輯
// ===================================================

function handleNormalVictory() {
    // 計算經驗
    let gainedXP = XP_PER_WIN;
    if (hasUsedHint || errorCount > 0) gainedXP = 5; 
    
    player.combo++;
    showCombo(player.combo);
    if (player.combo > 1) gainedXP += (player.combo * 2);

    gainXP(gainedXP);
    fireConfetti();
}

function handleReviewVictory() {
    // 複習模式下，不給經驗值，而是累積「通過次數」
    const wordKey = currentQ.word;
    if (mistakeRegistry[wordKey]) {
        mistakeRegistry[wordKey].wins++;
        
        // 檢查是否達成 3 次
        if (mistakeRegistry[wordKey].wins >= REQUIRED_REVIEW_WINS) {
            delete mistakeRegistry[wordKey]; // 移除這題
            alert(`恭喜！你已經完全學會 ${wordKey} 了！`);
        }
    }
    
    // 檢查是否還有剩餘錯題
    if (Object.keys(mistakeRegistry).length === 0) {
        // 全部複習完畢！
        levelUp(); 
    } else {
        fireConfetti(); // 小慶祝
    }
}

function gainXP(amount) {
    if (isReviewMode) return; // 複習模式不加經驗

    player.currentXP += amount;
    
    // 檢查是否滿足升級條件
    if (player.currentXP >= XP_PER_LEVEL) {
        checkLevelUpCondition();
    } else {
        updateHUD();
    }
}

function checkLevelUpCondition() {
    const mistakeCount = Object.keys(mistakeRegistry).length;
    
    if (mistakeCount === 0) {
        // 沒有錯題，直接升級
        levelUp();
    } else {
        // 有錯題，進入複習模式
        startReviewMode();
    }
}

function startReviewMode() {
    if (isReviewMode) return; // 已經在裡面了
    isReviewMode = true;
    
    player.currentXP = XP_PER_LEVEL; // 鎖定經驗條在滿的狀態
    updateHUD();
    
    speak("Boss Battle!");
    alert(`🚨 升級檢定！\n\n你有 ${Object.keys(mistakeRegistry).length} 個單字還不熟。\n\n請通過魔王複習挑戰才能升級！\n(每個字要答對 3 次)`);
    
    // 強制重新整理介面顯示下一題
    nextQuestion(); 
}

function levelUp() {
    isReviewMode = false; // 解除複習模式
    player.level++;
    player.currentXP = 0;
    player.hp = MAX_HP;   // 補滿血
    
    updateHUD();
    
    speak("Level Up! Congratulations!");
    fireConfetti();
    
    // 升級大獎勵提示
    setTimeout(() => {
        alert(`🎉 LEVEL UP! 恭喜升到 Lv. ${player.level}！\n\n🎁 獎勵：血量完全恢復！\n繼續挑戰吧！`);
        nextQuestion();
    }, 500);
}

// ===================================================
// 7. 受傷與提示
// ===================================================

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
    // 檢查血量是否足夠
    if (player.hp <= HINT_HP_COST) {
        alert("血量不足，不能偷看！加油！");
        return;
    }

    // 扣除 0.5 血量
    player.hp -= HINT_HP_COST;
    hasUsedHint = true;
    updateHUD(); // 更新血條顯示

    const hintBox = document.getElementById("hint-overlay");
    const hintBtn = document.getElementById("btn-hint");
    
    hintBox.classList.add("visible");
    let utterance = new SpeechSynthesisUtterance(currentQ.word);
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
// 8. 介面更新 (HUD) - 支援 0.5 顆心
// ===================================================

function updateHUD() {
    document.getElementById("level-display").innerText = player.level;
    
    // 血量顯示邏輯 (支援半顆心)
    let hearts = "";
    const fullHearts = Math.floor(player.hp);
    const hasHalfHeart = (player.hp % 1 !== 0);
    
    // 畫全心
    for(let i=0; i<fullHearts; i++) {
        hearts += "❤️";
    }
    // 畫半心 (用破碎的心或特殊符號代替，這裡用 💔 表示受傷/半心，或者用 🌗)
    if (hasHalfHeart) {
        hearts += "💔"; 
    }
    // 畫空心
    const emptyHearts = MAX_HP - Math.ceil(player.hp);
    for(let i=0; i<emptyHearts; i++) {
        hearts += "🖤";
    }
    
    document.getElementById("hp-display").innerText = hearts;

    // 經驗條
    let percentage = (player.currentXP / XP_PER_LEVEL) * 100;
    if (percentage > 100) percentage = 100;
    document.getElementById("xp-bar").style.width = percentage + "%";
}

// ... (以下保留通用的輔助函式：speak, fireConfetti, resetCurrentLevel, gameOver 等) ...
// 為了程式碼完整性，這裡補上必要的輔助函式

function gameOver() {
    speak("Game Over");
    alert("💀 Game Over! 血量歸零了！\n\n別灰心，重新挑戰吧！");
    // 重置
    player.hp = MAX_HP;
    player.level = 1;
    player.currentXP = 0;
    player.combo = 0;
    mistakeRegistry = {}; // 錯題本清空 (或是選擇保留讓孩子繼續練，這裡先清空重來)
    isReviewMode = false;
    
    updateHUD();
    nextQuestion();
}

function resetCurrentLevel() {
    currentInput = [];
    if (currentQ.word.includes(" ")) currentInput.push(" ");
    document.getElementById("message-area").innerText = "";
    
    const slots = document.getElementsByClassName("slot");
    for(let s of slots) if(s.innerHTML !== "&nbsp;") s.innerText = "";
    
    const btns = document.getElementsByClassName("letter-btn");
    for(let b of btns) {
        b.classList.remove("used");
        b.disabled = false;
    }
    speak(currentQ.word);
}

function speak(text) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.8; 
    window.speechSynthesis.speak(utterance);
}

function playCurrentWord() {
    speak(currentQ.word);
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

function fireConfetti() {
    if (typeof