// 檔案名稱：game.js (完整 RPG 版)

// ===================================================
// 1. 遊戲參數與狀態設定
// ===================================================
const MAX_HP = 3;           // 最大血量 (3顆心)
const XP_PER_LEVEL = 100;   // 升級所需經驗值
const XP_PER_WIN = 20;      // 答對基礎經驗值
let comboMultiplier = 2;    // 連擊加成係數

// 玩家狀態
let player = {
    hp: MAX_HP,
    level: 1,
    currentXP: 0,
    combo: 0
};

// 當前局狀態
let currentQ = {};      // 目前題目
let currentInput = [];  // 玩家拼的字
let errorCount = 0;     // 這題錯幾次
let questionCount = 0;  // 總題數計數
let hasUsedHint = false; // 是否偷看過答案

// ===================================================
// 2. 完整單字庫 (國小三年級程度)
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
    updateHUD(); // 更新介面數據
    nextQuestion(); // 開始第一題
};

// ===================================================
// 4. 核心流程：出題與互動
// ===================================================

function nextQuestion() {
    // 1. 重置單題變數
    questionCount++;
    document.getElementById("q-count").innerText = questionCount;
    errorCount = 0;
    currentInput = [];
    hasUsedHint = false;
    
    // 2. 重置介面元素
    document.getElementById("message-area").innerText = "";
    document.getElementById("next-btn").style.display = "none";
    document.getElementById("btn-hint").disabled = false;
    
    const hintBox = document.getElementById("hint-overlay");
    hintBox.classList.remove("visible");
    
    // 3. 隨機選題
    const randomIndex = Math.floor(Math.random() * questionBank.length);
    currentQ = questionBank[randomIndex];
    
    // 4. 更新畫面 (圖片 & 隱藏提示)
    document.getElementById("image-area").innerText = currentQ.icon;
    hintBox.innerText = currentQ.word;

    // 5. 建立底線 (Slots)
    const slotsDiv = document.getElementById("answer-slots");
    slotsDiv.innerHTML = "";
    for (let i = 0; i < currentQ.word.length; i++) {
        let slot = document.createElement("div");
        slot.className = "slot";
        slot.id = "slot-" + i;
        
        // 處理空格 (如 ICE CREAM)
        if (currentQ.word[i] === " ") {
            slot.style.borderBottom = "none";
            slot.innerHTML = "&nbsp;";
            currentInput.push(" "); // 自動填入空格
        }
        
        slotsDiv.appendChild(slot);
    }

    // 6. 建立字母按鈕 (Pool)
    const poolDiv = document.getElementById("letter-pool");
    poolDiv.innerHTML = "";
    
    let letters = currentQ.word.replace(/ /g, "").split(''); // 去掉空格後打散
    letters.sort(() => Math.random() - 0.5); // 洗牌

    letters.forEach((char) => {
        let btn = document.createElement("button");
        btn.innerText = char;
        btn.className = "letter-btn";
        btn.onclick = function() { selectLetter(char, this); };
        poolDiv.appendChild(btn);
    });
    
    // 7. 自動發音 (延遲 0.5秒)
    setTimeout(() => {
        speak(currentQ.word);
    }, 500);
}

function selectLetter(char, btnElement) {
    if (currentInput.length >= currentQ.word.length) return;

    speak(char); // 唸出字母
    currentInput.push(char);
    
    // 找到下一個還沒填的格子
    const slotIndex = currentInput.length - 1;
    const slot = document.getElementById("slot-" + slotIndex);
    
    if (slot) {
        slot.innerText = char;
    }
    
    // 停用按鈕
    btnElement.classList.add("used");
    btnElement.disabled = true;

    // 檢查是否拼完
    if (currentInput.length === currentQ.word.length) {
        checkAnswer();
    }
}

// ===================================================
// 5. 核心流程：檢查答案與結果
// ===================================================

function checkAnswer() {
    const playerAnswer = currentInput.join("");
    const msgDiv = document.getElementById("message-area");

    if (playerAnswer === currentQ.word) {
        // --- 答對了 (Victory) ---
        handleVictory();
        
        msgDiv.innerHTML = "<span style='color:green; font-size:24px;'>⚔️ Nice Hit! 答對了！</span>";
        speak("Correct! " + currentQ.word);
        
        document.getElementById("next-btn").style.display = "inline-block";
        document.getElementById("btn-hint").disabled = true;

    } else {
        // --- 答錯了 (Damage) ---
        handleDamage();
        
        msgDiv.innerHTML = "<span style='color:red'>🛡️ Blocked! 錯囉！</span>";
        speak("Try again");
        
        // 錯誤累計與提示引導
        errorCount++;
        if (errorCount >= 2) {
            msgDiv.innerHTML += "<br><span style='color:#e91e63; font-size:0.9rem'>💡 點上面的按鈕偷看一眼吧！</span>";
            // 震動提示按鈕
            const hintBtn = document.getElementById("btn-hint");
            hintBtn.style.transform = "scale(1.2)";
            setTimeout(() => hintBtn.style.transform = "scale(1)", 300);
        }

        // 1秒後重置這一題 (讓小孩重拼)
        setTimeout(() => {
            resetCurrentLevel();
        }, 1200);
    }
}

// ===================================================
// 6. RPG 系統 (XP, HP, Level, Combo)
// ===================================================

function handleVictory() {
    // 1. 計算經驗值
    // 如果用過提示或錯太多次，經驗值減少 (但至少給 5 分鼓勵)
    let gainedXP = XP_PER_WIN;
    if (hasUsedHint || errorCount > 0) {
        gainedXP = 5; 
    }

    // 2. 連擊系統
    player.combo++;
    showCombo(player.combo);
    
    // 連擊加成：每多 1 Combo 多送 XP
    if (player.combo > 1) {
        gainedXP += (player.combo * comboMultiplier);
    }

    // 3. 給予經驗並檢查升級
    gainXP(gainedXP);
    
    // 4. 特效
    fireConfetti();
}

function handleDamage() {
    // 1. 扣血
    player.hp--;
    
    // 2. 連擊中斷
    player.combo = 0;
    hideCombo();

    // 3. 畫面震動特效
    document.body.classList.add("shake-screen");
    setTimeout(() => document.body.classList.remove("shake-screen"), 500);

    // 4. 更新介面
    updateHUD();

    // 5. 檢查 Game Over
    if (player.hp <= 0) {
        setTimeout(gameOver, 500);
    }
}

function gainXP(amount) {
    player.currentXP += amount;
    
    // 檢查是否升級
    if (player.currentXP >= XP_PER_LEVEL) {
        levelUp();
    }
    updateHUD();
}

function levelUp() {
    player.level++;
    player.currentXP = 0; // 歸零 (或是保留溢出的 XP: player.currentXP -= XP_PER_LEVEL)
    player.hp = MAX_HP;   // 升級補滿血！
    
    speak("Level Up!");
    alert(`🎉 LEVEL UP! 恭喜升到 Lv. ${player.level}！\n血量補滿了！`);
}

function gameOver() {
    speak("Game Over");
    alert("💀 Game Over! 血量歸零了！\n別灰心，按確定重新挑戰！");
    
    // 重置所有數值
    player.hp = MAX_HP;
    player.level = 1;
    player.currentXP = 0;
    player.combo = 0;
    questionCount = 0;
    
    updateHUD();
    nextQuestion();
}

function updateHUD() {
    // 更新等級
    document.getElementById("level-display").innerText = player.level;
    
    // 更新血量 (愛心)
    let hearts = "";
    for(let i=0; i<MAX_HP; i++) {
        if (i < player.hp) hearts += "❤️";
        else hearts += "🖤"; // 空心
    }
    document.getElementById("hp-display").innerText = hearts;

    // 更新經驗條長度
    let percentage = (player.currentXP / XP_PER_LEVEL) * 100;
    if (percentage > 100) percentage = 100;
    document.getElementById("xp-bar").style.width = percentage + "%";
}

// 連擊顯示控制
function showCombo(count) {
    if (count < 2) return;
    const comboDiv = document.getElementById("combo-display");
    comboDiv.innerText = `Combo x${count}!`;
    comboDiv.classList.add("show");
}

function hideCombo() {
    document.getElementById("combo-display").classList.remove("show");
}

// ===================================================
// 7. 輔助功能 (重置、發音、提示)
// ===================================================

function resetCurrentLevel() {
    // 只重置輸入與按鈕，不換題目
    currentInput = [];
    
    // 如果單字原本有空格，先填回去
    if (currentQ.word.includes(" ")) {
        currentInput.push(" ");
    }

    document.getElementById("message-area").innerText = "";
    
    // 清空格子
    const slots = document.getElementsByClassName("slot");
    for(let s of slots) {
        if(s.innerHTML !== "&nbsp;") s.innerText = "";
    }
    
    // 恢復按鈕
    const btns = document.getElementsByClassName("letter-btn");
    for(let b of btns) {
        b.classList.remove("used");
        b.disabled = false;
    }
    
    playCurrentWord();
}

function playCurrentWord() {
    speak(currentQ.word);
    
    // 按鈕特效
    const btn = document.querySelector('.btn-replay');
    if(btn) {
        btn.style.transform = "scale(1.1)";
        setTimeout(() => btn.style.transform = "scale(1)", 200);
    }
}

function showHint() {
    // 標記已使用提示 (會影響得分)
    hasUsedHint = true;
    
    const hintBox = document.getElementById("hint-overlay");
    const hintBtn = document.getElementById("btn-hint");
    
    // 顯示
    hintBox.classList.add("visible");
    
    // 慢速唸
    let utterance = new SpeechSynthesisUtterance(currentQ.word);
    utterance.lang = 'en-US';
    utterance.rate = 0.5;
    window.speechSynthesis.speak(utterance);
    
    // 暫時鎖定
    hintBtn.disabled = true;
    setTimeout(() => {
        hintBox.classList.remove("visible");
        // 如果還沒答對，按鈕恢復可用，讓小孩可以多看幾次
        if (document.getElementById("next-btn").style.display === "none") {
             hintBtn.disabled = false;
        }
    }, 2000); // 2秒後消失
}

function speak(text) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.8; 
    window.speechSynthesis.speak(utterance);
}

function fireConfetti() {
    if (typeof confetti === 'function') {
        confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff']
        });
    }
}