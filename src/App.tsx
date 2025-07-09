import React, { useEffect, useState } from 'react';
import { Game } from './components/Game';
import { API_BASE_URL } from './config/gameConfig';
import { useTranslation } from 'react-i18next'; // 1️⃣ 导入
import LanguageSwitcher from './components/LanguageSwitcher';
// 若未设置请先 npm i react-i18next i18next

function App() {
  const [telegramUser, setTelegramUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isBound, setIsBound] = useState<boolean | null>(null);

  const { t, i18n } = useTranslation(); // 2️⃣ 获取t和i18n对象

  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    const user = tg?.initDataUnsafe?.user;

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

  // 3️⃣ 可选：提供切换按钮
  const LangSwitcher = () => (
    <div style={{ textAlign: 'right', padding: '8px 16px' }}>
      <button onClick={() => i18n.changeLanguage('zh')} style={{ marginRight: 8 }}>中文</button>
      <button onClick={() => i18n.changeLanguage('en')}>English</button>
    </div>
  );

  if (loading) {
    return (
      <div style={{ color: '#fff', textAlign: 'center', marginTop: 50 }}>
        <LangSwitcher />
        {t('loading')}
      </div>
    );
  }

  if (!telegramUser) {
    return (
      <div style={{ color: '#fff', textAlign: 'center', marginTop: 80 }}>
        <LangSwitcher />
        <div style={{ fontSize: 22, marginBottom: 16 }} dangerouslySetInnerHTML={{ __html: t('not_in_telegram') }} />
        <div>{t('not_browser')}</div>
      </div>
    );
  }

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

  return (
    <>
      <LangSwitcher />
      <Game telegramUser={telegramUser} />
    </>
  );
}

export default App;
