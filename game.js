// ===================================================
// 1. 遊戲參數與狀態
// ===================================================
const MAX_HP = 8;
const XP_WIN = 50;      // 答對 +50 XP
const XP_LOSE = 30;     // 答錯 -30 XP
const HINT_COST = 20;   // 偷看 -20 XP
const REQUIRED_REVIEW_WINS = 3;
const MASTERY_THRESHOLD = 5;

// 房屋進化表 (20階段)
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

// 玩家狀態
let player = { name: "Player", level: 1, currentXP: 0, combo: 0, freeHints: 0 };
let voiceSettings = { gender: 'female', pitch: 1.1, rate: 0.8 };

// 遊戲局狀態
let currentCategory = "ALL";
let filteredQuestions = []; // 題目池
let currentQ = {};      
let currentInput = [];  
let isFrozen = false;
let isReviewMode = false;
let mistakeRegistry = {}; 
let learningProgress = JSON.parse(localStorage.getItem('english_rpg_progress')) || {};

// 偵測打字模式
const isTypingMode = () => document.getElementById('typing-input') !== null;

// ===================================================
// 2. ★ 單字庫 (直接內建，確保絕對不會讀不到)
// ===================================================
const questionBank = [
    // 動物
    { word: "CAT", icon: "🐱", cn: "貓咪", cat: "animal" }, 
    { word: "DOG", icon: "🐶", cn: "狗狗", cat: "animal" },
    { word: "PIG", icon: "🐷", cn: "豬", cat: "animal" }, 
    { word: "BIRD", icon: "🐦", cn: "鳥", cat: "animal" },
    { word: "FISH", icon: "🐟", cn: "魚", cat: "animal" }, 
    { word: "DUCK", icon: "🦆", cn: "鴨子", cat: "animal" },
    { word: "LION", icon: "🦁", cn: "獅子", cat: "animal" }, 
    { word: "TIGER", icon: "🐯", cn: "老虎", cat: "animal" },
    { word: "BEAR", icon: "🐻", cn: "熊", cat: "animal" }, 
    { word: "RABBIT", icon: "🐰", cn: "兔子", cat: "animal" },
    { word: "MONKEY", icon: "🐵", cn: "猴子", cat: "animal" }, 
    { word: "ELEPHANT", icon: "🐘", cn: "大象", cat: "animal" },
    { word: "ZEBRA", icon: "🦓", cn: "斑馬", cat: "animal" }, 
    { word: "ANT", icon: "🐜", cn: "螞蟻", cat: "animal" },
    // 顏色
    { word: "RED", icon: "🔴", cn: "紅色", cat: "color" }, 
    { word: "BLUE", icon: "🔵", cn: "藍色", cat: "color" },
    { word: "YELLOW", icon: "🟡", cn: "黃色", cat: "color" }, 
    { word: "GREEN", icon: "🟢", cn: "綠色", cat: "color" },
    { word: "ORANGE", icon: "🟠", cn: "橘色", cat: "color" }, 
    { word: "PURPLE", icon: "🟣", cn: "紫色", cat: "color" },
    { word: "BLACK", icon: "⚫", cn: "黑色", cat: "color" }, 
    { word: "WHITE", icon: "⚪", cn: "白色", cat: "color" },
    { word: "PINK", icon: "🩷", cn: "粉紅色", cat: "color" },
    // 數字
    { word: "ONE", icon: "1️⃣", cn: "一", cat: "number" }, 
    { word: "TWO", icon: "2️⃣", cn: "二", cat: "number" },
    { word: "THREE", icon: "3️⃣", cn: "三", cat: "number" }, 
    { word: "FOUR", icon: "4️⃣", cn: "四", cat: "number" },
    { word: "FIVE", icon: "5️⃣", cn: "五", cat: "number" }, 
    { word: "SIX", icon: "6️⃣", cn: "六", cat: "number" },
    { word: "SEVEN", icon: "7️⃣", cn: "七", cat: "number" }, 
    { word: "EIGHT", icon: "8️⃣", cn: "八", cat: "number" },
    { word: "NINE", icon: "9️⃣", cn: "九", cat: "number" }, 
    { word: "TEN", icon: "🔟", cn: "十", cat: "number" },
    // 食物
    { word: "APPLE", icon: "🍎", cn: "蘋果", cat: "food" }, 
    { word: "BANANA", icon: "🍌", cn: "香蕉", cat: "food" },
    { word: "ORANGE", icon: "🍊", cn: "柳橙", cat: "food" }, 
    { word: "LEMON", icon: "🍋", cn: "檸檬", cat: "food" },
    { word: "EGG", icon: "🥚", cn: "蛋", cat: "food" }, 
    { word: "MILK", icon: "🥛", cn: "牛奶", cat: "food" },
    { word: "CAKE", icon: "🍰", cn: "蛋糕", cat: "food" }, 
    { word: "ICE CREAM", icon: "🍦", cn: "冰淇淋", cat: "food" },
    { word: "RICE", icon: "🍚", cn: "米飯", cat: "food" }, 
    { word: "WATER", icon: "💧", cn: "水", cat: "food" },
    { word: "PIZZA", icon: "🍕", cn: "披薩", cat: "food" }, 
    { word: "HAMBURGER", icon: "🍔", cn: "漢堡", cat: "food" },
    // 身體
    { word: "HEAD", icon: "🗣️", cn: "頭", cat: "body" }, 
    { word: "EYE", icon: "👁️", cn: "眼睛", cat: "body" },
    { word: "EAR", icon: "👂", cn: "耳朵", cat: "body" }, 
    { word: "NOSE", icon: "👃", cn: "鼻子", cat: "body" },
    { word: "MOUTH", icon: "👄", cn: "嘴巴", cat: "body" }, 
    { word: "HAND", icon: "🖐️", cn: "手", cat: "body" },
    { word: "LEG", icon: "🦵", cn: "腿", cat: "body" }, 
    { word: "ARM", icon: "💪", cn: "手臂", cat: "body" },
    { word: "FOOT", icon: "🦶", cn: "腳", cat: "body" }, 
    { word: "FACE", icon: "😀", cn: "臉", cat: "body" },
    // 用品
    { word: "PEN", icon: "🖊️", cn: "原子筆", cat: "item" }, 
    { word: "PENCIL", icon: "✏️", cn: "鉛筆", cat: "item" },
    { word: "BOOK", icon: "📖", cn: "書", cat: "item" }, 
    { word: "BAG", icon: "🎒", cn: "書包", cat: "item" },
    { word: "RULER", icon: "📏", cn: "尺", cat: "item" }, 
    { word: "BOX", icon: "📦", cn: "箱子", cat: "item" },
    { word: "CHAIR", icon: "🪑", cn: "椅子", cat: "item" }, 
    { word: "DESK", icon: "✍️", cn: "書桌", cat: "item" },
    { word: "CAR", icon: "🚗", cn: "車子", cat: "item" }, 
    { word: "BUS", icon: "🚌", cn: "公車", cat: "item" },
    { word: "BIKE", icon: "🚲", cn: "腳踏車", cat: "item" }, 
    { word: "BALL", icon: "⚽", cn: "球", cat: "item" },
    { word: "HAT", icon: "👒", cn: "帽子", cat: "item" },
    // 家庭
    { word: "DAD", icon: "👨", cn: "爸爸" }, 
    { word: "MOM", icon: "👩", cn: "媽媽" },
    { word: "BOY", icon: "👦", cn: "男孩" }, 
    { word: "GIRL", icon: "👧", cn: "女孩" },
    { word: "BABY", icon: "👶", cn: "嬰兒" }, 
    { word: "KING", icon: "👑", cn: "國王" }
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
    if(document.getElementById('player-name-display')) {
        document.getElementById('player-name-display').innerText = player.name;
    }

    voiceSettings.gender = gender;
    voiceSettings.pitch = (gender === 'male') ? 0.8 : 1.2;

    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('category-screen').style.display = 'flex';
}

function startGame(category) {
    currentCategory = category;
    
    // 過濾題目
    if (category === 'ALL') {
        filteredQuestions = questionBank;
        if(document.getElementById('category-tag')) document.getElementById('category-tag').innerText = "隨機挑戰";
    } else {
        filteredQuestions = questionBank.filter(q => q.cat === category);
        const map = { 'animal': "動物園", 'food': "美食街", 'color': "顏色館", 'number': "數字谷", 'body': "身體檢查", 'item': "生活用品" };
        if(document.getElementById('category-tag')) document.getElementById('category-tag').innerText = map[category] || category;
    }

    // ★ 防呆機制：如果該類別沒有題目，就載入全部
    if (filteredQuestions.length === 0) {
        console.warn("Category empty, fallback to ALL");
        filteredQuestions = questionBank;
    }

    document.getElementById('category-screen').style.display = 'none';
    document.getElementById('hud').style.display = 'block';
    document.getElementById('game-container').style.display = 'block';
    
    // 綁定打字輸入事件 (如果有的話)
    if(isTypingMode()) {
        const input = document.getElementById('typing-input');
        input.addEventListener('input', handleTypingInput);
        input.addEventListener('click', () => speak(currentQ.word));
    }

    updateHUD();
    updateHouse();
    cheerHouse(`你好，${player.name}！開始蓋房子囉！`);
    nextQuestion();
}

function nextQuestion() {
    isFrozen = false;
    
    // 1. 更新題號
    if (!isReviewMode) {
        questionCount++;
        document.getElementById("q-count").innerText = questionCount;
    } else {
        document.getElementById("q-count").innerText = "🔥魔王關";
    }
    
    errorCount = 0; currentInput = []; hasUsedHint = false;
    
    // 2. UI 重置
    document.getElementById("message-area").innerText = "";
    document.getElementById("next-btn").style.display = "none";
    document.getElementById("btn-hint").disabled = false;
    if(!isTypingMode()) document.getElementById("btn-clear").disabled = false;
    document.getElementById("hint-overlay").classList.remove("visible");
    document.getElementById("freeze-overlay").style.display = "none"; // 確保遮罩消失
    updateHintButton();

    if(isTypingMode()) {
        const input = document.getElementById('typing-input');
        input.value = "";
        input.disabled = false;
        input.classList.remove('correct-anim', 'wrong-anim');
        input.focus();
    } else {
        // ★ 確保容器被清空
        document.getElementById("answer-slots").innerHTML = "";
        document.getElementById("letter-pool").innerHTML = "";
    }

    // 3. 選題
    currentQ = getWeightedQuestion();
    
    // 4. 渲染畫面
    document.getElementById("image-area").innerText = currentQ.icon;
    document.getElementById("hint-overlay").innerText = currentQ.word;
    document.getElementById("cn-meaning").innerText = currentQ.cn;

    // ★ 關鍵：只有在非打字模式才產生按鈕
    if(!isTypingMode()) {
        renderSlots();
        renderLetterPool(); // 這裡產生按鈕！
    }
    
    setTimeout(() => { try { speak(currentQ.word); } catch(e){} }, 500);
}

// 智慧選題演算法
function getWeightedQuestion() {
    if (isReviewMode) {
        const mistakes = Object.keys(mistakeRegistry);
        if (mistakes.length === 0) { levelUp(); return filteredQuestions[0]; }
        const randomKey = mistakes[Math.floor(Math.random() * mistakes.length)];
        return mistakeRegistry[randomKey].wordObj;
    }

    // 簡單隨機 fallback (以防萬一)
    if (!filteredQuestions || filteredQuestions.length === 0) return questionBank[0];

    // 加權隨機
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

// ===================================================
// 4. 輸入處理 (UI Logic)
// ===================================================
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
    
    // 取得字母並打散
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
    
    // 恢復按鈕
    const btns = document.getElementsByClassName("letter-btn");
    for (let i = 0; i < btns.length; i++) {
        if (btns[i].innerText === lastChar && btns[i].classList.contains("used")) {
            btns[i].classList.remove("used");
            btns[i].disabled = false;
            break; 
        }
    }
    
    // 清除格子
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
// 5. 判斷對錯與XP
// ===================================================
function checkAnswer(playerAnswer) {
    // 若是按鈕模式，組成字串
    if (!playerAnswer && !isTypingMode()) {
        playerAnswer = currentInput.join("");
    }

    const cleanWord = currentQ.word.replace(/ /g, "");
    const cleanPlayerAns = playerAnswer.replace(/ /g, "").toUpperCase();
    const msgDiv = document.getElementById("message-area");

    if (cleanPlayerAns === cleanWord) {
        // --- 答對 ---
        if(isTypingMode()) {
            document.getElementById('typing-input').classList.add('correct-anim');
            document.getElementById('typing-input').disabled = true;
        } else {
            document.getElementById("btn-clear").disabled = true;
        }
        document.getElementById("btn-hint").disabled = true;
        msgDiv.innerHTML = "<span style='color:green; font-size:24px;'>🎉 Correct!</span>";

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

        // 自動跳轉
        if (!document.getElementById("levelup-modal").style.display || document.getElementById("levelup-modal").style.display === "none") {
            setTimeout(nextQuestion, 1500); 
        }

    } else {
        // --- 答錯 ---
        loseXP(XP_LOSE);
        updateLearningProgress(currentQ.word, false);
        msgDiv.innerHTML = "<span style='color:red'>❌ Wrong!</span>";
        try { speak("Try again"); cheerHouse("哎呀！扣分了！🛡️"); } catch(e){}
        
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
// 6. XP 系統 (累加制)
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
    document.getElementById("level-display").innerText = player.level;
    document.getElementById("ticket-count").innerText = player.freeHints;
    
    const nextLevelTotal = getLevelThreshold(player.level);
    const prevLevelTotal = getPrevLevelThreshold(player.level);
    const levelRange = nextLevelTotal - prevLevelTotal;
    const currentProgress = player.currentXP - prevLevelTotal;
    
    let percentage = (currentProgress / levelRange) * 100;
    if (percentage < 0) percentage = 0;
    if (percentage > 100) percentage = 100;
    
    document.getElementById("xp-bar").style.width = percentage + "%";
    
    // 顯示文字
    const displayStr = `${player.currentXP} / ${nextLevelTotal} XP`;
    if(document.getElementById("xp-display-text")) {
        document.getElementById("xp-display-text").innerText = displayStr;
    } else {
        const overlay = document.querySelector(".xp-text-overlay");
        if(overlay) overlay.innerText = displayStr;
    }
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
    
    const threshold = getLevelThreshold(player.level);
    if (player.currentXP >= threshold) {
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

function updateHintButton() {
    const btn = document.getElementById("btn-hint");
    if(!btn) return;
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
        const minXP = getPrevLevelThreshold(player.level);
        if (player.currentXP - HINT_COST >= minXP) {
            player.currentXP -= HINT_COST;
            hasUsedHint = true;
            updateHUD();
        } else {
            alert("經驗值不足，無法偷看！加油再試試！");
            return;
        }
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

function closeLevelUpModal() { document.getElementById("levelup-modal").style.display = "none"; nextQuestion(); }
function registerMistake(wordObj) { if (!mistakeRegistry[wordObj.word]) { mistakeRegistry[wordObj.word] = { wordObj: wordObj, wins: 0 }; } else { mistakeRegistry[wordObj.word].wins = 0; } }
function handleNormalVictory() {}
function handleReviewVictory() { const wordKey = currentQ.word; if (mistakeRegistry[wordKey]) { mistakeRegistry[wordKey].wins++; if (mistakeRegistry[wordKey].wins >= REQUIRED_REVIEW_WINS) delete mistakeRegistry[wordKey]; } if (Object.keys(mistakeRegistry).length === 0) { levelUp(); } else { try{ fireConfetti(); }catch(e){} setTimeout(nextQuestion, 1500); } }
function checkLevelUpCondition() { if (Object.keys(mistakeRegistry).length === 0) { levelUp(); } else { startReviewMode(); } }
function startReviewMode() { if (isReviewMode) return; isReviewMode = true; updateHUD(); try{ speak("Boss Battle!"); }catch(e){} alert(`🚨 升級檢定！\n需複習 ${Object.keys(mistakeRegistry).length} 個錯字。`); nextQuestion(); }
function handleDamage() { try { document.body.classList.add("shake-screen"); setTimeout(() => document.body.classList.remove("shake-screen"), 500); } catch(e){} }
function speak(text) { if (!('speechSynthesis' in window)) return; window.speechSynthesis.cancel(); const utterance = new SpeechSynthesisUtterance(text.toLowerCase()); setVoice(utterance); window.speechSynthesis.speak(utterance); }
function setVoice(utterance) { utterance.lang = 'en-US'; utterance.rate = voiceSettings.rate; utterance.pitch = voiceSettings.pitch; const voices = window.speechSynthesis.getVoices(); let targetVoice = (voiceSettings.gender === 'male') ? voices.find(v => v.name.includes('Male') && v.lang.includes('en')) : voices.find(v => v.name.includes('Female') && v.lang.includes('en')); if (targetVoice) utterance.voice = targetVoice; }
function playCurrentWord() { try{ speak(currentQ.word); }catch(e){} }
function fireConfetti() { if (typeof confetti === 'function') confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } }); }
