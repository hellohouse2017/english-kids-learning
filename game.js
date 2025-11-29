// 題庫：您可以隨時在這裡增加新單字
const questionBank = [
    { word: "RED", icon: "🔴" },
    { word: "BLUE", icon: "🔵" },
    { word: "CAT", icon: "🐱" },
    { word: "DOG", icon: "🐶" },
    { word: "APPLE", icon: "🍎" },
    { word: "BOOK", icon: "📖" },
    { word: "HAND", icon: "🖐️" }
];

let currentQ = {};
let currentInput = []; // 玩家目前填入的字母
let score = 0;

// 初始化遊戲
window.onload = function() {
    nextQuestion();
};

function nextQuestion() {
    // 1. 重置狀態
    currentInput = [];
    document.getElementById("message-area").innerText = "";
    document.getElementById("next-btn").style.display = "none";
    
    // 2. 隨機選一題
    const randomIndex = Math.floor(Math.random() * questionBank.length);
    currentQ = questionBank[randomIndex];
    
    // 3. 顯示圖片
    document.getElementById("image-area").innerText = currentQ.icon;
    
    // 4. 建立底線 (Slots)
    const slotsDiv = document.getElementById("answer-slots");
    slotsDiv.innerHTML = "";
    for (let i = 0; i < currentQ.word.length; i++) {
        let slot = document.createElement("div");
        slot.className = "slot";
        slot.id = "slot-" + i;
        slotsDiv.appendChild(slot);
    }

    // 5. 建立打散的字母按鈕
    const poolDiv = document.getElementById("letter-pool");
    poolDiv.innerHTML = "";
    
    // 把正確答案的字母打散，並多加幾個干擾字母(可選)
    let letters = currentQ.word.split('');
    // 簡單洗牌演算法
    letters.sort(() => Math.random() - 0.5);

    letters.forEach((char, index) => {
        let btn = document.createElement("button");
        btn.innerText = char;
        btn.className = "letter-btn";
        btn.onclick = function() { selectLetter(char, this); };
        poolDiv.appendChild(btn);
    });
    
    // 唸一次題目單字
    speak(currentQ.word);
}

function selectLetter(char, btnElement) {
    // 如果格子滿了就不動作
    if (currentInput.length >= currentQ.word.length) return;

    // 1. 填入字母
    currentInput.push(char);
    
    // 2. 更新畫面上的底線
    const slotIndex = currentInput.length - 1;
    document.getElementById("slot-" + slotIndex).innerText = char;
    
    // 3. 把按鈕變灰，避免重複按
    btnElement.classList.add("used");
    btnElement.disabled = true;

    // 4. 發出讀音
    speak(char);

    // 5. 檢查是否拼完
    if (currentInput.length === currentQ.word.length) {
        checkAnswer();
    }
}

function checkAnswer() {
    const playerAnswer = currentInput.join("");
    const msgDiv = document.getElementById("message-area");

    if (playerAnswer === currentQ.word) {
        // --- 答對了！ ---
        msgDiv.innerHTML = "<span style='color:green; font-size:24px;'>🎉 Correct! 答對了！</span>";
        score += 10;
        document.getElementById("score-board").innerText = score;
        
        // 播放完整單字
        speak("Correct! " + currentQ.word);
        
        // 觸發彩帶特效 (Confetti)
        fireConfetti();
        
        // 顯示下一題按鈕
        document.getElementById("next-btn").style.display = "inline-block";
        
    } else {
        // --- 答錯了 ---
        msgDiv.innerHTML = "<span style='color:red'>❌ Oops! 錯囉！重新試試</span>";
        speak("Try again");
        
        // 1秒後重置這一題
        setTimeout(() => {
            resetCurrentLevel();
        }, 1500);
    }
}

function resetCurrentLevel() {
    // 清空填寫區，恢復按鈕
    currentInput = [];
    document.getElementById("message-area").innerText = "";
    
    // 清空底線文字
    const slots = document.getElementsByClassName("slot");
    for(let s of slots) s.innerText = "";
    
    // 恢復所有按鈕活性
    const btns = document.getElementsByClassName("letter-btn");
    for(let b of btns) {
        b.classList.remove("used");
        b.disabled = false;
    }
}

// 語音功能 (共用)
function speak(text) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.8;
    window.speechSynthesis.speak(utterance);
}

// 彩帶特效函式
function fireConfetti() {
    confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
    });
}