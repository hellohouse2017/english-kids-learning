// 檔案名稱： script.js

// 1. 通用發音功能
function speak(text) {
    window.speechSynthesis.cancel(); // 先停止之前的聲音
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US'; // 美式英文
    utterance.rate = 0.8;     // 速度慢一點適合小孩
    window.speechSynthesis.speak(utterance);
}

// ==========================================
// 2. 聽力遊戲邏輯
// ==========================================
let currentTargetColor = "";
const colors = ["Red", "Blue", "Yellow", "Green"];

function playGameSound() {
    // 隨機選一個顏色
    const randomIndex = Math.floor(Math.random() * colors.length);
    currentTargetColor = colors[randomIndex];
    
    // 播放題目 (例如: "Find Red!")
    speak("Find " + currentTargetColor);
    document.getElementById("game-result").innerHTML = "👂 正在播放...請選出顏色";
}

function checkAnswer(selectedColor) {
    const resultBox = document.getElementById("game-result");
    
    if (currentTargetColor === "") {
        resultBox.innerHTML = "請先按「播放題目」按鈕喔！";
        return;
    }

    if (selectedColor === currentTargetColor) {
        resultBox.innerHTML = "✅ CORRECT! 答對了！";
        resultBox.style.color = "green";
        speak("Great! It is " + selectedColor);
        currentTargetColor = ""; // 重置題目
    } else {
        resultBox.innerHTML = "❌ Try again! 再試一次";
        resultBox.style.color = "red";
        speak("Try again");
    }
}

// ==========================================
// 3. 句子重組邏輯
// ==========================================
let currentSentence = [];
const correctSentence = "It is red ."; // 注意這裡我留了空格方便比對

function addWord(word) {
    currentSentence.push(word);
    updateSentenceBoard();
    speak(word); // 點選時順便唸出來
}

function updateSentenceBoard() {
    const board = document.getElementById("sentence-board");
    // 把陣列變成字串顯示，中間加空格
    board.innerText = currentSentence.join(" ");
}

function resetSentence() {
    currentSentence = [];
    updateSentenceBoard();
    document.getElementById("sentence-result").innerText = "";
}

function checkSentence() {
    const userAns = currentSentence.join(" ");
    const resultDiv = document.getElementById("sentence-result");

    if (userAns === correctSentence) {
        resultDiv.innerHTML = "🎉 Excellent! 妳好棒！";
        resultDiv.style.color = "green";
        speak("It is red. Good job!");
    } else {
        resultDiv.innerHTML = "🤔 嗯...好像怪怪的？";
        resultDiv.style.color = "orange";
        speak("Oh oh, try again.");
    }
}

/* --- 把這些加到 style.css 的最下面 --- */

.slots-container {
    display: flex;
    justify-content: center;
    gap: 10px;
    margin-bottom: 30px;
    min-height: 60px;
}

.slot {
    width: 40px;
    height: 50px;
    border-bottom: 3px solid #333;
    font-size: 30px;
    font-weight: bold;
    color: #e91e63;
    display: flex;
    align-items: center;
    justify-content: center;
}

.pool-container {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    gap: 10px;
}

.letter-btn {
    width: 50px;
    height: 50px;
    background: #e91e63;
    color: white;
    font-size: 24px;
    border: none;
    border-radius: 10px;
    cursor: pointer;
    box-shadow: 0 4px 0 #ad1457;
    transition: transform 0.1s;
}

.letter-btn:active {
    transform: translateY(4px);
    box-shadow: none;
}

.letter-btn.used {
    background: #ccc;
    box-shadow: none;
    cursor: default;
    opacity: 0.5;
}

.btn-next {
    margin-top: 20px;
    padding: 10px 30px;
    font-size: 20px;
    background-color: #4caf50;
    color: white;
    border: none;
    border-radius: 50px;
    cursor: pointer;
    animation: pop 0.5s infinite alternate; /* 讓按鈕跳動 */
}

@keyframes pop {
    from { transform: scale(1); }
    to { transform: scale(1.1); }
}