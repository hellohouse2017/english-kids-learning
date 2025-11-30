// ===================================================
// game.js - V68 (防重複選題修正)
// ===================================================

// 1. 遊戲參數
const XP_WIN = 50;
const XP_LOSE = 30;
const HINT_COST = 20;

const GROWTH_STAGES = [
    { icon: "👶", name: "Lv.1 新生兒 (Newborn)" }, { icon: "🍼", name: "Lv.2 嬰兒 (Baby)" }, 
    { icon: "🚼", name: "Lv.3 學步兒 (Toddler)" }, { icon: "🧸", name: "Lv.4 幼兒園 (Preschooler)" }, 
    { icon: "🎒", name: "Lv.5 小學生 (Student)" }, { icon: "🚲", name: "Lv.6 國中生 (Junior)" }, 
    { icon: "🎧", name: "Lv.7 高中生 (Senior)" }, { icon: "🎓", name: "Lv.8 大學生 (Undergrad)" }, 
    { icon: "💼", name: "Lv.9 實習生 (Intern)" }, { icon: "👔", name: "Lv.10 上班族 (Worker)" }, 
    { icon: "💻", name: "Lv.11 工程師 (Engineer)" }, { icon: "🧑‍🏫", name: "Lv.12 組長 (Leader)" }, 
    { icon: "🕶️", name: "Lv.13 經理 (Manager)" }, { icon: "📈", name: "Lv.14 處長 (Director)" }, 
    { icon: "🤵", name: "Lv.15 總經理 (GM)" }, { icon: "🚗", name: "Lv.16 董事長 (Chairman)" }, 
    { icon: "🛥️", name: "Lv.17 企業大亨 (Tycoon)" }, { icon: "🚀", name: "Lv.18 慈善家 (Philanthropist)" }, 
    { icon: "👑", name: "Lv.19 世界首富 (Richest)" }, { icon: "🦸", name: "Lv.20 傳奇人物 (Legend)" }
];

// 分類設定
const CAT_CONFIG = {
    'animal': { icon: '🦁', cn: '動物', en: 'Animals', color: 'green' },
    'food':   { icon: '🍎', cn: '食物', en: 'Food', color: 'red' },
    'fruit':  { icon: '🍌', cn: '水果', en: 'Fruit', color: 'orange' },
    'color':  { icon: '🎨', cn: '顏色', en: 'Color', color: 'purple' },
    'body':   { icon: '👀', cn: '身體', en: 'Body', color: 'yellow' },
    'school': { icon: '🎒', cn: '學校', en: 'School', color: 'blue' },
    'people': { icon: '👶', cn: '人物', en: 'People', color: 'pink' },
    'nature': { icon: '🌳', cn: '自然', en: 'Nature', color: 'emerald' },
    'action': { icon: '🏃', cn: '動作', en: 'Action', color: 'indigo' },
    'number': { icon: '🔢', cn: '數字', en: 'Number', color: 'cyan' },
    'default': { icon: '📦', cn: '其他', en: 'Other', color: 'gray' } // 預設防呆
};

let player = { name: "Player", level: 1, xp: 0, hints: 0, grade: 1, category: "ALL", voice: "female" };
let currentQ = null;
let currentInput = [];
let gameData = [];
let isFrozen = false;
let isTyping = false;
let nextQTimer = null;

// ★ 新增：追蹤上一個單字，用於防重複
let lastWord = null; 

// 2. 初始化
window.onload = function() {
    if (typeof window.VOCAB_LIST === 'undefined') {
        alert("Error: data.js not found"); return;
    }
    // 檢查是否為 typing 模式
    if (document.getElementById('typing-input')) isTyping = true;
    
    const startBtn = document.getElementById('btn-start-game');
    if (startBtn) startBtn.onclick = showGradeSelect;

    const gradeScreen = document.getElementById('screen-grade');
    if (gradeScreen && gradeScreen.style.display !== 'none') {
        setVoice('female'); // 預設女聲
    }
};

// Step 1: 顯示年級選擇
function showGradeSelect() {
    document.getElementById('screen-start').style.display = 'none';
    document.getElementById('screen-grade').style.display = 'flex';
}

// Step 2: 選擇年級 -> 動態生成分類按鈕
function selectGrade(grade) {
    player.grade = parseInt(grade);
    
    const gradeWords = window.VOCAB_LIST.filter(w => w.grade === player.grade);
    
    if (gradeWords.length === 0) {
        alert(`Grade ${grade} 目前沒有單字資料，請檢查 data.js！`);
        return;
    }

    const categories = [...new Set(gradeWords.map(w => w.cat))].sort();
    
    const container = document.getElementById('dynamic-category-box');
    
    document.getElementById('screen-grade').style.display = 'none';
    document.getElementById('screen-category').style.display = 'flex';

    if(container) {
        container.innerHTML = ''; 
        // 增加全部單字按鈕
        container.appendChild(createCatBtn('ALL', { icon: '🔥', cn: '全部單字', en: 'All Words', color: 'indigo' }));

        // 增加其他分類按鈕
        categories.forEach(cat => {
            const config = CAT_CONFIG[cat] || CAT_CONFIG['default'];
            container.appendChild(createCatBtn(cat, config));
        });
    }

    const badge = document.getElementById('grade-badge');
    if(badge) badge.innerText = `Grade ${grade}`;
}

// 輔助：建立分類按鈕 HTML
function createCatBtn(catKey, config) {
    const btn = document.createElement('button');
    const colorClass = `hover:border-${config.color}-500`;
    
    btn.className = `bg-white p-4 rounded-xl shadow-sm border-2 border-transparent ${colorClass} transition flex items-center gap-4 group w-full text-left`;
    btn.onclick = () => selectCategory(catKey);
    
    btn.innerHTML = `
        <div class="w-10 h-10 bg-${config.color}-100 rounded-full flex items-center justify-center text-xl group-hover:scale-110 transition">${config.icon}</div>
        <div class="flex-grow">
            <h3 class="font-bold text-gray-700">${config.cn} <span class="text-xs font-normal text-gray-400">${config.en}</span></h3>
        </div>
        <i class="fas fa-chevron-right text-gray-300 group-hover:text-${config.color}-500"></i>
    `;
    return btn;
}

// Step 3: 選擇分類 -> 設定
function selectCategory(cat) {
    player.category = cat;
    document.getElementById('screen-category').style.display = 'none';
    document.getElementById('screen-settings').style.display = 'flex';
}

// 設定聲音
function setVoice(gender) {
    player.voice = gender;
    document.getElementById('btn-voice-male').classList.remove('ring-4', 'ring-primary');
    document.getElementById('btn-voice-female').classList.remove('ring-4', 'ring-primary');
    
    if(gender === 'male') {
        document.getElementById('btn-voice-male').classList.add('ring-4', 'ring-primary');
        speakTest("Hello");
    } else {
        document.getElementById('btn-voice-female').classList.add('ring-4', 'ring-primary');
        speakTest("Hello");
    }
}

// Step 4: 完成設定 -> 開始遊戲
function finishSettingsAndStart() {
    const nameInput = document.getElementById('player-name');
    const name = nameInput.value.trim();
    if(!name) {
        alert("請輸入名字！ Please enter your name.");
        nameInput.focus();
        return;
    }
    player.name = name;

    filterGameData();

    if (!gameData || gameData.length === 0) {
        alert("⚠️ 錯誤：此分類沒有單字。請重選年級或分類。");
        document.getElementById('screen-settings').style.display = 'none';
        document.getElementById('screen-category').style.display = 'flex';
        return;
    }

    document.getElementById('screen-settings').style.display = 'none';
    document.getElementById('hud').style.display = 'block';
    document.getElementById('screen-game').style.display = 'flex';

    const overlay = document.getElementById('ready-overlay');
    if (overlay) overlay.style.display = 'flex';

    updateHUD();
    updateGrowth(`Hi, ${player.name}!`);
}

// 資料篩選邏輯
function filterGameData() {
    if (player.category === 'ALL') {
        gameData = window.VOCAB_LIST.filter(i => i.grade === player.grade);
    } else {
        gameData = window.VOCAB_LIST.filter(i => i.grade === player.grade && i.cat === player.category);
    }
}

function realStartGame() {
    document.getElementById('ready-overlay').style.display = 'none';
    nextQuestion();
}

// === 遊戲邏輯 (核心) ===
function nextQuestion() {
    if (nextQTimer) clearTimeout(nextQTimer);
    isFrozen = false;
    currentInput = [];
    
    document.getElementById('msg-area').innerText = "";
    document.getElementById('hint-text').classList.remove('visible');
    
    if(!isTyping) {
        const slotsBox = document.getElementById('slots-box');
        if(slotsBox) slotsBox.innerHTML = ""; 
        const poolBox = document.getElementById('pool-box');
        if(poolBox) poolBox.innerHTML = ""; 
    }

    // ★ V68 修正：防重複選題邏輯
    let rnd;
    let newQ;
    let attempts = 0;
    
    // 確保新單字不等於上一個單字 (除非單字庫只有一個)
    do {
        rnd = Math.floor(Math.random() * gameData.length);
        newQ = gameData[rnd];
        attempts++;
        if (gameData.length === 1 || attempts > gameData.length * 2) break; // 防止死循環
    } while (newQ.word === lastWord); 

    currentQ = newQ;
    lastWord = currentQ.word; // 更新上一個單字為當前單字

    document.getElementById('q-icon').innerText = currentQ.icon;
    document.getElementById('q-cn').innerText = currentQ.cn;
    document.getElementById('hint-text').innerText = currentQ.word;

    if (isTyping) {
        const input = document.getElementById('typing-input');
        if (input) {
            input.value = "";
            input.disabled = false;
            setTimeout(() => input.focus(), 100);
            input.oninput = checkTyping;
        }
    } else {
        renderSlots();
        renderButtons();
    }
    speak(currentQ.word);
}

// 拼字渲染
function renderSlots() {
    const box = document.getElementById('slots-box');
    if (!box) return;
    for (let i = 0; i < currentQ.word.length; i++) {
        let div = document.createElement('div');
        div.className = 'slot';
        div.id = 'slot-' + i;
        box.appendChild(div);
    }
}

function renderButtons() {
    const pool = document.getElementById('pool-box');
    if (!pool) return;
    
    let chars = currentQ.word.split(''); 
    if (player.level >= 7) {
        const isAllSame = chars.every(c => c === chars[0]);
        if (chars.length > 1 && !isAllSame) {
            let shuffledStr = "";
            do {
                chars.sort(() => Math.random() - 0.5);
                shuffledStr = chars.join('');
            } while (shuffledStr === currentQ.word);
        }
    }
    
    chars.forEach((char, index) => {
        let btn = document.createElement('button');
        btn.className = 'btn-char';
        btn.innerText = char;
        btn.dataset.char = char;
        btn.dataset.index = index; 
        btn.onclick = function() { clickLetter(char, this); };
        pool.appendChild(btn);
    });
}

function clickLetter(char, btn) {
    if (isFrozen) return;
    if (currentInput.length >= currentQ.word.length) return;

    speak(char);
    currentInput.push(char);
    
    for (let i = 0; i < currentQ.word.length; i++) {
        let slot = document.getElementById('slot-' + i);
        if (slot && slot.innerText === "") {
            slot.innerText = char;
            break;
        }
    }
    
    btn.classList.add('used');
    btn.onclick = null;

    if (currentInput.length === currentQ.word.length) {
        checkAnswer(currentInput.join(""));
    }
}

function resetCurrentQuestion() {
    if (isFrozen) return;
    currentInput = [];
    const slots = document.getElementsByClassName('slot');
    for (let s of slots) s.innerText = "";
    const btns = document.getElementsByClassName('btn-char');
    for (let btn of btns) {
        btn.classList.remove('used');
        btn.onclick = function() { clickLetter(btn.innerText, this); };
    }
}

function backspace() {
    if (isFrozen || currentInput.length === 0) return;
    let lastChar = currentInput.pop();
    let slots = document.getElementsByClassName('slot');
    for (let i = slots.length - 1; i >= 0; i--) {
        if (slots[i].innerText !== "") {
            slots[i].innerText = "";
            break;
        }
    }
    let btns = document.getElementsByClassName('btn-char');
    for (let i = btns.length - 1; i >= 0; i--) {
        let btn = btns[i];
        if (btn.innerText === lastChar && btn.classList.contains('used')) {
            btn.classList.remove('used');
            btn.onclick = function() { clickLetter(lastChar, this); };
            break; 
        }
    }
}

function checkTyping() {
    const input = document.getElementById('typing-input');
    const val = input.value.toUpperCase(); 
    if (val.length === currentQ.word.length) {
        checkAnswer(val);
    }
}

function checkAnswer(ans) {
    if (ans.toUpperCase() === currentQ.word.toUpperCase()) {
        isFrozen = true;
        const msgArea = document.getElementById('msg-area');
        if(msgArea) msgArea.innerHTML = "<span style='color:green'>🎉 答對了！ Correct!</span>";
        
        if (isTyping) {
            const input = document.getElementById('typing-input');
            if(input) input.disabled = true;
        }
        
        gainXP(XP_WIN);
        updateGrowth("很棒！ Great Job!");

        try { speak(currentQ.word); } catch (e) {}

        nextQTimer = setTimeout(() => {
            nextQuestion();
        }, 1500);

    } else {
        isFrozen = true;
        const msgArea = document.getElementById('msg-area');
        if(msgArea) msgArea.innerHTML = "<span style='color:red'>❌ 再試一次 Try Again</span>";
        
        loseXP(XP_LOSE);
        updateGrowth("哎呀！ Oops!");
        
        setTimeout(() => {
            isFrozen = false;
            if(msgArea) msgArea.innerText = "";
            if (isTyping) {
                const input = document.getElementById('typing-input');
                if(input) { input.value = ""; input.disabled = false; input.focus(); }
            } else {
                resetCurrentQuestion();
            }
        }, 1000);
        
        // 答錯時，保持 lastWord 不變，這樣下次 nextQuestion() 就不會觸發防重複檢查，等於允許重新出現同一個單字（就是當前這個）
        if (currentQ) lastWord = currentQ.word; 
    }
}

function getLevelReq(lv) {
    if (lv === 1) return 50;
    let req = 0;
    for (let i = 1; i <= lv; i++) req += (50 * (i + 1));
    return req;
}

function updateHUD() {
    if (player.level > 20) player.level = 20;
    let nextReq = getLevelReq(player.level);
    let pct = (player.xp / nextReq) * 100;
    if (pct < 0) pct = 0; if (pct > 100) pct = 100;

    const xpBar = document.getElementById('xp-bar');
    if (xpBar) xpBar.style.width = pct + "%";
    const xpText = document.getElementById('xp-text');
    if (xpText) xpText.innerText = `${player.xp} / ${nextReq} XP`;
    const lvNum = document.getElementById('lv-num');
    if (lvNum) lvNum.innerText = player.level;
    const ticketNum = document.getElementById('ticket-num');
    if (ticketNum) ticketNum.innerText = player.hints;
}

function gainXP(amount) {
    player.xp += amount;
    let req = getLevelReq(player.level);
    
    if (player.xp >= req) {
        player.level++;
        player.hints++;
        updateHUD();
        updateGrowth("升級啦！ Level Up!");
        requestAnimationFrame(() => {
            setTimeout(() => {
                alert(`🎉 恭喜升級！Level Up!\n\n現在是 Lv.${player.level}\n獲得提示券 +1 (Get Hint +1)`);
            }, 50);
        });
    } else {
        updateHUD();
    }
}

function loseXP(amount) {
    player.xp -= amount;
    let min = (player.level === 1) ? 0 : getLevelReq(player.level - 1);
    if (player.xp < min) player.xp = min;
    updateHUD();
}

function updateGrowth(msg) {
    let idx = player.level - 1;
    if (idx >= GROWTH_STAGES.length) idx = GROWTH_STAGES.length - 1;
    
    const icon = document.getElementById('role-icon');
    const name = document.getElementById('role-name');
    if (icon) icon.innerText = GROWTH_STAGES[idx].icon;
    if (name) name.innerText = GROWTH_STAGES[idx].name;
    
    if (msg) {
        let bub = document.getElementById('role-msg');
        if(bub) {
            bub.innerText = msg;
            bub.classList.add('show');
            setTimeout(() => bub.classList.remove('show'), 2000);
        }
    }
}

function useHint() {
    if (player.hints > 0) {
        player.hints--;
    } else {
        let min = (player.level === 1) ? 0 : getLevelReq(player.level - 1);
        if (player.xp - HINT_COST < min) {
            alert("經驗值不足！ Not enough XP!"); return;
        }
        player.xp -= HINT_COST;
    }
    updateHUD();
    document.getElementById('hint-text').classList.add('visible');
    speak(currentQ.word);
}

function speak(txt) {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        let u = new SpeechSynthesisUtterance(txt.toLowerCase());
        u.lang = 'en-US';
        u.rate = 0.8; 
        assignVoice(u, player.voice);
        window.speechSynthesis.speak(u);
    }
}

function speakTest(txt) {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        let u = new SpeechSynthesisUtterance(txt);
        u.lang = 'en-US';
        assignVoice(u, player.voice);
        window.speechSynthesis.speak(u);
    }
}

function assignVoice(u, gender) {
    const voices = window.speechSynthesis.getVoices();
    let preferredVoice = null;
    if (gender === 'male') {
        preferredVoice = voices.find(v => v.name.includes("Daniel")) || 
                         voices.find(v => v.name.includes("David")) || 
                         voices.find(v => v.name.includes("Male"));
    } else {
        preferredVoice = voices.find(v => v.name.includes("Google US English")) || 
                         voices.find(v => v.name.includes("Samantha")) || 
                         voices.find(v => v.name.includes("Zira")) ||
                         voices.find(v => v.name.includes("Female"));
    }
    if (preferredVoice) u.voice = preferredVoice;
}
