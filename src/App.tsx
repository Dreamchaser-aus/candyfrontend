import React, { useEffect } from 'react';
import { Game } from './components/Game';
import { API_BASE_URL } from './config/gameConfig'; // 路径没问题

const tg = (window as any).Telegram?.WebApp;
const telegramId = tg?.initDataUnsafe?.user?.id;

// ====== 显示 userId 方便肉眼调试 ======
if (typeof document !== "undefined") {
  document.body.insertAdjacentHTML(
    "afterbegin",
    `<div style="position:fixed;top:0;left:0;z-index:9999;background:#ffd;color:#d00;font-size:20px;padding:4px 12px;">userId: ${telegramId ? telegramId : "无"}</div>`
  );
}
console.log('Telegram WebApp:', tg);
console.log('initDataUnsafe:', tg?.initDataUnsafe);
console.log('userId:', telegramId);

async function checkUserBind(telegramId: string) {
  const res = await fetch(`${API_BASE_URL}/api/check_bind?user_id=${telegramId}`);
  return res.status === 200;
}

function App() {
  useEffect(() => {
    if (!telegramId) {
      alert('请在 Telegram 应用内通过 Bot 按钮打开本游戏！');
      return;
    }
    checkUserBind(telegramId).then(isBound => {
      if (!isBound) {
        alert("请先在 Telegram Bot 绑定手机号！");
        window.open('https://t.me/candycrushvite_bot?start=bind', '_blank');
        if ((window as any).Telegram?.WebApp?.close) {
          (window as any).Telegram.WebApp.close();
        }
      }
    });
  }, []);

  return <Game />;
}

export default App;
