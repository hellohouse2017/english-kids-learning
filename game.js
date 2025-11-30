// ===================================================
// game.js - V58 (修復升級失效與票券不增加問題)
// ===================================================

// 1. 遊戲參數
const XP_WIN = 50;
const XP_LOSE = 30;
const HINT_COST = 20;

// 成長稱號
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

let player = { name: "Player", level: 1, xp: 0, hints: 0 };
let currentQ = null;
let currentInput = [];
let gameData = [];
let isFrozen = false;
let isTyping = false;
let nextQTimer = null;

// 2. 初始化
window.onload = function() {
    if (typeof window.VOCAB_LIST === 'undefined') {
        alert("Error: data.js not found"); return;
    }
    if (document.getElementById('typing-input')) isTyping = true;

    const startBtn = document.getElementById('btn-start-game');
    if (startBtn) startBtn.onclick = showCategorySelect;
};

// 3. 流程控制
function showCategorySelect() {
    const nameInput = document.getElementById('player-name');
    const name = nameInput.value.trim() || "勇者 Hero";
    player.name = name;
    const displayName = document.getElementById('display-name');
    if(displayName) displayName.innerText = name;
    
    document.getElementById('screen-start').style.display = 'none';
    document.getElementById('screen-category').style.display = 'flex';
}

function startGame(category) {
    if (category === 'ALL') {
        gameData = window.VOCAB_LIST;
    } else {
        gameData = window.VOCAB_LIST.filter(item => item.cat.includes(category));
    }
    if (!gameData || gameData.length === 0) gameData = window.VOCAB_LIST; 

    document.getElementById('screen-category').style.display = 'none';
    document.getElementById('hud').style.display = 'block'; // 顯示 HUD
    document.getElementById('screen-game').style.display = 'flex';

    const overlay = document.getElementById('ready-overlay');
    if (overlay) overlay.style.display = 'flex';
    else nextQuestion();

    updateHUD();
    updateGrowth("準備開始！ Ready!");
}

function realStartGame() {
    const overlay = document.getElementById('ready-overlay');
    if(overlay) overlay.style.display = 'none';
    nextQuestion();
}

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

    const rnd = Math.floor(Math.random() * gameData.length);
    currentQ = gameData[rnd];

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

// 4. 拼字介面
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

// 5. 打字模式
function checkTyping() {
    const input = document.getElementById('typing-input');
    const val = input.value.toUpperCase(); 
    if (val.length === currentQ.word.length) {
        checkAnswer(val);
    }
}

// 6. 核心判定 (★ 重要修正：先加分，再發音)
function checkAnswer(ans) {
    if (ans.toUpperCase() === currentQ.word.toUpperCase()) {
        isFrozen = true;
        const msgArea = document.getElementById('msg-area');
        if(msgArea) msgArea.innerHTML = "<span style='color:green'>🎉 答對了！ Correct!</span>";
        
        if (isTyping) {
            const input = document.getElementById('typing-input');
            if(input) input.disabled = true;
        }
        
        // 1. 先執行加分邏輯 (確保升級視窗會出來)
        gainXP(XP_WIN);
        updateGrowth("很棒！ Great Job!");

        // 2. 再嘗試發音 (就算發音失敗也不會卡住加分)
        try {
            speak(currentQ.word);
        } catch (e) { console.error("Audio Error:", e); }

        // 3. 設定下一題計時器
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
    }
}

// 7. 系統 (★ 修正升級邏輯與顯示)
function getLevelReq(lv) {
    // 為了測試方便，Lv.1 只要 50xp 就能升級 (答對1題)
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
    if (ticketNum) ticketNum.innerText = player.hints; // 確保這裡有更新
}

function gainXP(amount) {
    player.xp += amount;
    let req = getLevelReq(player.level);
    
    // 升級檢查
    if (player.xp >= req) {
        player.level++;
        player.hints++; // 增加票券
        
        // ★ 強制畫面重繪：先更新數字，再跳視窗
        updateHUD();
        updateGrowth("升級啦！ Level Up!");

        // 使用 requestAnimationFrame 確保 UI 渲染完畢後再彈窗
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

// 語音
function speak(txt) {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        let u = new SpeechSynthesisUtterance(txt.toLowerCase());
        u.lang = 'en-US';
        u.rate = 0.8; 

        let voices = window.speechSynthesis.getVoices();
        if (voices.length === 0) {
            window.speechSynthesis.onvoiceschanged = function() {
                voices = window.speechSynthesis.getVoices();
                setVoiceAndSpeak(u, voices);
            };
        } else {
            setVoiceAndSpeak(u, voices);
        }
    }
}

function setVoiceAndSpeak(u, voices) {
    const preferredVoice = voices.find(v => v.name.includes("Google US English")) || 
                           voices.find(v => v.name.includes("Google")) ||
                           voices.find(v => v.name.includes("Samantha"));

    if (preferredVoice) {
        u.voice = preferredVoice;
        if (preferredVoice.name.includes("Google")) {
            u.rate = 0.9; 
        }
    }
    window.speechSynthesis.speak(u);
}
