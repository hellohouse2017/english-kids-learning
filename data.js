// data.js - 獨立單字資料庫
const VOCAB_DB = {
    // === 三年級單字 (Grade 3) ===
    "grade3": [
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

        // 用品與其他
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
        { word: "ROBOT", icon: "🤖", cn: "機器人", cat: "item" },
        
        // 家庭
        { word: "DAD", icon: "👨", cn: "爸爸", cat: "family" }, 
        { word: "MOM", icon: "👩", cn: "媽媽", cat: "family" },
        { word: "BOY", icon: "👦", cn: "男孩", cat: "family" }, 
        { word: "GIRL", icon: "👧", cn: "女孩", cat: "family" },
        { word: "BABY", icon: "👶", cn: "嬰兒", cat: "family" }, 
        { word: "KING", icon: "👑", cn: "國王", cat: "family" }
    ],

    // === 未來可擴充四年級 (Grade 4) ===
    "grade4": [
        // 這裡可以放四年級的單字...
    ]
};