import React, { useEffect, useState } from 'react';
import { Game } from './components/Game';
import { API_BASE_URL } from './config/gameConfig';

function App() {
  const [telegramUser, setTelegramUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isBound, setIsBound] = useState<boolean | null>(null);

  useEffect(() => {
    // 1. 尝试从 Telegram WebApp 读取用户身份
    const tg = (window as any).Telegram?.WebApp;
    const user = tg?.initDataUnsafe?.user;

    console.log('Telegram WebApp:', tg);
    console.log('Telegram initDataUnsafe:', tg?.initDataUnsafe);
    console.log('Detected Telegram user:', user);

    setTelegramUser(user || null);

    if (user && user.id) {
      // 2. 检查后端绑定（只要不是 200，都视为未绑定）
      fetch(`${API_BASE_URL}/api/check_bind?user_id=${user.id}`)
        .then(res => setIsBound(res.ok))
        .catch(() => setIsBound(false))
        .finally(() => setLoading(false));
    } else {
      setIsBound(false);
      setLoading(false);
    }
  }, []);

  // Loading 状态
  if (loading || isBound === null) {
    return <div style={{ color: '#fff', textAlign: 'center', marginTop: 80 }}>加载中...</div>;
  }

  // 非 WebApp 环境（user 信息没有获取到）
  if (!telegramUser) {
    return (
      <div style={{ color: '#fff', textAlign: 'center', marginTop: 80 }}>
        <div style={{ fontSize: 22, marginBottom: 16 }}>请在 <b>Telegram 客户端</b> 内通过 Bot 按钮进入游戏</div>
        <div>不能直接浏览器访问！</div>
      </div>
    );
  }

  // 未绑定手机号
  if (isBound === false) {
    return (
      <div style={{ color: '#fff', textAlign: 'center', marginTop: 80 }}>
        <div style={{ fontSize: 22, marginBottom: 16 }}>请先在 Telegram Bot 绑定手机号！</div>
        <a
          href="https://t.me/candycrushvite_bot?start=bind"
          target="_blank"
          style={{ color: '#3cf', fontSize: 20, fontWeight: 'bold', textDecoration: 'none' }}
          rel="noopener noreferrer"
        >
          👉 点此去绑定
        </a>
      </div>
    );
  }

  // 已通过所有检查，渲染游戏
  return <Game telegramUser={telegramUser} />;
}

export default App;
