# Blackwell 猜硬幣策略互動演示

這是一個用來展示 Blackwell approachability 想法的互動網頁。情境是一個重複猜硬幣遊戲：每一回合，對手先決定硬幣是正面或反面，我們再根據過去紀錄用 Blackwell 策略決定本回合猜正面的機率。

網頁會即時顯示目前的猜測、實際勝率，以及策略軌跡在平面上的移動。圖中的橫軸是目前為止對手出正面的比例，縱軸是策略對應的期望正確率平均。兩條對角線用來輔助觀察目標集合的邊界。

## 怎麼玩

在輸入框中輸入 `正面` 或 `反面`，或直接按快速按鈕。每送出一次，網頁會記錄一回合，更新 Blackwell 策略給出的猜正面機率，並在圖上加入新的軌跡點。

## 背景

如果硬幣每次以固定機率出現正面，合理的策略是猜較常出現的一面。但在這個演示中，對手可以依照過去歷史任意決定下一回合的結果，因此問題不再只是估計一個固定機率。

Blackwell 的想法是把每一回合的結果看成平面上的向量，並設計一個隨機策略，使得平均向量逐漸靠近目標集合。這個例子中，目標集合對應到「表現至少和猜較常出現的一面一樣好」的區域。

## 參考資料

[1] D. Blackwell, *An analog of the minimax theorem for vector payoffs*, Pacific Journal of Mathematics, 6 (1956), 1-6.

[2] N. Cesa-Bianchi and G. Lugosi, *Prediction, Learning, and Games*, Cambridge University Press, 2006.

[3] 李彥寰（2026）。預測、學習、與賽局 [課程]。
