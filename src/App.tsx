import React, { useEffect, useState } from 'react';
import { Game } from './components/Game';
import { API_BASE_URL } from './config/gameConfig';

// --- 调试信息显示组件 ---
function DebugInfo({ info }: { info: string }) {
  return (
    <pre style={{
      background: "#222", color: "#0ff", padding: 10, fontSize: 12, borderRadius: 4, margin: 10, wordBreak: "break-all"
    }}>
      {info}
    </pre>
  );
}

function App() {
  const [telegramUser, setTelegramUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isBound, setIsBound] = useState<boolean | null>(null);
  const [debug, setDebug] = useState(''); // 保存调试信息

  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    const user = tg?.initDataUnsafe?.user;

    // 记录调试信息
    let info = `[TG] user: ${JSON.stringify(user)}\n`;

    setTelegramUser(user || null);
    setLoading(false);

    if (user && user.id) {
     fetch(`${API_BASE_URL}/api/check_bind?user_id=${user.id}`)
        .then(async res => {
          const text = await res.text();
          info += `[CHECK_BIND] Status: ${res.status}, Body: ${text}\n`;
          setDebug(info);
          setIsBound(res.status === 200);
        })
        .catch((e) => {
          info += `[CHECK_BIND] Error: ${e}\n`;
          setDebug(info);
          setIsBound(false);
        });
    } else {
      info += `[CHECK_BIND] No user.id\n`;
      setDebug(info);
      setIsBound(false);
    }
  }, []);

  if (loading) {
    return (
      <div>
        <DebugInfo info={debug} />
        <div style={{ color: '#fff', textAlign: 'center', marginTop: 50 }}>加载中...</div>
      </div>
    );
  }

  if (!telegramUser) {
    return (
      <div>
        <DebugInfo info={debug} />
        <div style={{ color: '#fff', textAlign: 'center', marginTop: 80 }}>
          <div style={{ fontSize: 22, marginBottom: 16 }}>请在 <b>Telegram 客户端</b> 内通过 Bot 按钮进入游戏</div>
          <div>不能直接浏览器访问！</div>
        </div>
      </div>
    );
  }

  if (isBound === false) {
    return (
      <div>
        <DebugInfo info={debug} />
        <div style={{ color: '#fff', textAlign: 'center', marginTop: 80 }}>
          <div style={{ fontSize: 22, marginBottom: 16 }}>请先在 Telegram Bot 绑定手机号！</div>
          <a
            href="https://t.me/candycrushvite_bot?start=bind"
            target="_blank"
            style={{ color: '#3cf', fontSize: 20, fontWeight: 'bold' }}
            rel="noopener noreferrer"
          >
            👉 点此去绑定
          </a>
        </div>
      </div>
    );
  }

  return (
    <div>
      <DebugInfo info={debug} />
      <Game telegramUser={telegramUser} />
    </div>
  );
}

export default App;
