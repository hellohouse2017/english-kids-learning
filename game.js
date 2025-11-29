// game.js - 進階版

// 題庫 (您可以繼續擴充)
const questionBank = [
    { word: "RED", icon: "🔴" },
    { word: "BLUE", icon: "🔵" },
    { word: "YELLOW", icon: "🟡" },
    { word: "GREEN", icon: "🟢" },
    { word: "CAT", icon: "🐱" },
    { word: "DOG", icon: "🐶" },
    { word: "PIG", icon: "🐷" },
    { word: "APPLE", icon: "🍎" },
    { word: "BANANA", icon: "🍌" },
    { word: "BOOK", icon: "📖" },
    { word: "HAND", icon: "🖐️" }
];

let currentQ = {};
let currentInput = [];
let score = 0;
let questionCount = 0; // 目前題數

// 網頁載入後馬上開始
window.onload = function() {
    nextQuestion();
};

function nextQuestion() {
    questionCount++;
    document.getElementById("q-count").innerText = questionCount;

    // 1. 重置介面
    currentInput = [];
    document.getElementById("message-area").innerText = "";
    document.getElementById("next-btn").style.display = "none";
    
    // 2. 隨機選題 (避免連續重複，簡單邏輯先略過)
    const randomIndex = Math.floor(Math.random() * questionBank.length);
    currentQ = questionBank[randomIndex];
    
    // 3. 顯示圖片
    document.getElementById("image-area").innerText = currentQ.icon;
    
    // 4. 建立答案底線
    const slotsDiv = document.getElementById("answer-slots");
    slotsDiv.innerHTML = "";
    for (let i = 0; i < currentQ.word.length; i++) {
        let slot = document.createElement("div");
        slot.className = "slot";
        slot.id = "slot-" + i;
        slotsDiv.appendChild(slot);
    }

    // 5. 建立打散字母 (包含正確字母 + 1~2個干擾字母，增加一點難度)
    const poolDiv = document.getElementById("letter-pool");
    poolDiv.innerHTML = "";
    
    // 取得正確字母
    let letters = currentQ.word.split('');
    
    // 簡易洗牌
    letters.sort(() => Math.random() - 0.5);

    letters.forEach((char) => {
        let btn = document.createElement("button");
        btn.innerText = char;
        btn.className = "letter-btn";
        btn.onclick = function() { selectLetter(char, this); };
        poolDiv.appendChild(btn);
    });
    
    // 6. 關鍵修改：自動播放聲音 (延遲 0.5 秒，避免跟切換畫面衝突)
    setTimeout(() => {
        speak(currentQ.word);
    }, 500);
}

// 玩家主動點擊「再唸一次」
function playCurrentWord() {
    // 加上一點特效，例如 "Listen!"
    speak(currentQ.word);
    
    // 按鈕稍微動一下的回饋 (Optional)
    const btn = document.querySelector('.btn-replay');
    btn.style.transform = "scale(1.1)";
    setTimeout(() => btn.style.transform = "scale(1)", 200);
}

function selectLetter(char, btnElement) {
    if (currentInput.length >= currentQ.word.length) return;

    // 唸出字母音 (Phonics)
    speak(char);

    currentInput.push(char);
    
    // 更新底線
    const slotIndex = currentInput.length - 1;
    document.getElementById("slot-" + slotIndex).innerText = char;
    
    // 停用該按鈕
    btnElement.classList.add("used");
    btnElement.disabled = true;

    // 檢查答案
    if (currentInput.length === currentQ.word.length) {
        checkAnswer();
    }
}

function checkAnswer() {
    const playerAnswer = currentInput.join("");
    const msgDiv = document.getElementById("message-area");

    if (playerAnswer === currentQ.word) {
        // --- 答對 ---
        score += 10;
        updateScoreEffect(score); // 分數跳動特效
        
        msgDiv.innerHTML = "<span style='color:green; font-size:24px;'>🎉 Perfect!</span>";
        speak("Yes! " + currentQ.word);
        
        fireConfetti(); // 噴彩帶
        document.getElementById("next-btn").style.display = "inline-block";
        
    } else {
        // --- 答錯 ---
        msgDiv.innerHTML = "<span style='color:red'>❌ Try again!</span>";
        speak("Oh no, try again.");
        
        // 扣分機制 (可選，這裡先不扣分以免打擊信心)
        
        // 1.5秒後重置該題
        setTimeout(() => {
            resetCurrentLevel();
        }, 1500);
    }
}

function resetCurrentLevel() {
    currentInput = [];
    document.getElementById("message-area").innerText = "";
    
    // 清空底線
    const slots = document.getElementsByClassName("slot");
    for(let s of slots) s.innerText = "";
    
    // 恢復按鈕
    const btns = document.getElementsByClassName("letter-btn");
    for(let b of btns) {
        b.classList.remove("used");
        b.disabled = false;
    }
    
    // 重置時也再唸一次，提示答案
    playCurrentWord();
}

function updateScoreEffect(newScore) {
    const board = document.getElementById("score-board");
    board.innerText = newScore;
    board.style.color = "red";
    board.style.fontSize = "1.5em";
    setTimeout(() => {
        board.style.color = "#ff9800";
        board.style.fontSize = "1em";
    }, 300);
}

// 語音合成
function speak(text) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.8; 
    window.speechSynthesis.speak(utterance);
}

// 彩帶特效
function fireConfetti() {
    if (typeof confetti === 'function') {
        confetti({
            particleCount: 120,
            spread: 80,
            origin: { y: 0.6 }
        });
    }
}