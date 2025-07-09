import React, { useEffect, useState } from 'react';
import { Game } from './components/Game';
import { API_BASE_URL } from './config/gameConfig';
import { useTranslation } from 'react-i18next';

function App() {
  const [telegramUser, setTelegramUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isBound, setIsBound] = useState<boolean | null>(null);

  const { t, i18n } = useTranslation();

  useEffect(() => {
    // Telegram WebApp 取用户
    let tg = undefined, user = undefined;
    try {
      tg = (window as any).Telegram?.WebApp;
      user = tg?.initDataUnsafe?.user;
      console.log('Telegram WebApp:', tg);
      console.log('telegramUser:', user);
    } catch (err) {
      console.error('Telegram WebApp 获取异常', err);
    }

    setTelegramUser(user || null);
    setLoading(false);

    if (user && user.id) {
      fetch(`${API_BASE_URL}/api/check_bind?user_id=${user.id}`)
        .then(res => setIsBound(res.status === 200))
        .catch(() => setIsBound(false));
    } else {
      setIsBound(false);
    }
  }, []);

  // 加载中
  if (loading) {
    return (
      <div style={{ color: '#fff', textAlign: 'center', marginTop: 50 }}>
        <LangSwitcher />
        {t('loading')}
      </div>
    );
  }

  // 未在 Telegram 客户端打开
  if (!telegramUser) {
    return (
      <div style={{ color: '#fff', textAlign: 'center', marginTop: 80 }}>
        <LangSwitcher />
        <div style={{ fontSize: 22, marginBottom: 16 }} dangerouslySetInnerHTML={{ __html: t('not_in_telegram') }} />
        <div>{t('not_browser')}</div>
        <div style={{ marginTop: 30, fontSize: 14, color: '#aaa' }}>
          Debug: 无 Telegram WebApp 用户信息，请通过 Bot 按钮进入
        </div>
      </div>
    );
  }

  // 未绑定手机号
  if (isBound === false) {
    return (
      <div style={{ color: '#fff', textAlign: 'center', marginTop: 80 }}>
        <LangSwitcher />
        <div style={{ fontSize: 22, marginBottom: 16 }}>{t('not_bound')}</div>
        <a
          href="https://t.me/candycrushvite_bot?start=bind"
          target="_blank"
          style={{ color: '#3cf', fontSize: 20, fontWeight: 'bold' }}
          rel="noopener noreferrer"
        >
          {t('go_bind')}
        </a>
      </div>
    );
  }

  // 游戏主界面
  return (
    <>
      <LangSwitcher />
      <Game telegramUser={telegramUser} />
    </>
  );
}

export default App;
