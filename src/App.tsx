import React, { useEffect, useState } from 'react';
import { Game } from './components/Game';
import { API_BASE_URL } from './config/gameConfig';

const tg = (window as any).Telegram?.WebApp;
const telegramId = tg?.initDataUnsafe?.user?.id;

function App() {
  const [isGuest, setIsGuest] = useState(true);

  useEffect(() => {
    if (!telegramId) {
      alert('请在 Telegram 应用内通过 Bot 按钮打开本游戏！');
      return;
    }
    fetch(`${API_BASE_URL}/api/check_bind?user_id=${telegramId}`)
      .then(res => {
        if (res.status === 200) {
          setIsGuest(false);
        } else {
          setIsGuest(true);
          alert("请先在 Telegram Bot 绑定手机号！");
          window.open('https://t.me/candycrushvite_bot?start=bind', '_blank');
          if ((window as any).Telegram?.WebApp?.close) {
            (window as any).Telegram.WebApp.close();
          }
        }
      });
  }, []);

  return (
    <div>
      {/* 可选：调试用 */}
      <div style={{
        position: "fixed",
        top: 0, left: 0, zIndex: 9999,
        background: "#ffd", color: "#d00", fontSize: 20, padding: "4px 12px"
      }}>
        userId: {telegramId || "无"}
      </div>
      <Game isGuest={isGuest} />
    </div>
  );
}

export default App;
