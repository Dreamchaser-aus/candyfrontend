import React, { useEffect } from 'react';
import { Game } from './components/Game';
import { API_BASE_URL } from './config/gameConfig'; // 按你的实际路径

const tg = (window as any).Telegram?.WebApp;
const telegramId = tg?.initDataUnsafe?.user?.id;

async function checkUserBind(telegramId: string) {
  const res = await fetch(`${API_BASE_URL}/api/check_bind?user_id=${telegramId}`);
  return res.status === 200;
}

function App() {
  useEffect(() => {
    if (!telegramId) {
      alert('请在 Telegram 应用内打开本游戏。');
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
