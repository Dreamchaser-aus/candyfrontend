import React, { useEffect, useState } from 'react';
import { Game } from './components/Game';
import { API_BASE_URL } from './config/gameConfig';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './components/LanguageSwitcher';

function App() {
  const [telegramUser, setTelegramUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isBound, setIsBound] = useState<boolean | null>(null);
  const [showLangModal, setShowLangModal] = useState(false);

  const { t } = useTranslation();

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

  // 主界面按钮区域，可以把这个放到Settings按钮下方
  const MainButtons = () => (
    <div style={{ textAlign: 'center', margin: '20px 0' }}>
      {/* 你原有的按钮，比如设置/排行榜按钮 */}
      <button
        className="btn"
        onClick={() => setShowLangModal(true)}
        style={{
          marginTop: 12,
          background: '#282c34',
          color: '#fff',
          border: 'none',
          padding: '8px 18px',
          borderRadius: 8,
          cursor: 'pointer'
        }}
      >
        🌏 {t('Choose Language') || 'Choose Language'}
      </button>
    </div>
  );

  // 语言切换弹窗
  const LangModal = () => (
    showLangModal && (
      <div
        style={{
          position: 'fixed',
          left: 0, top: 0, width: '100vw', height: '100vh',
          background: 'rgba(0,0,0,0.4)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}
        onClick={() => setShowLangModal(false)}
      >
        <div
          style={{ background: '#fff', borderRadius: 10, padding: 24, minWidth: 220 }}
          onClick={e => e.stopPropagation()}
        >
          <h3 style={{ marginBottom: 20, color: '#333', textAlign: 'center' }}>
            {t('Choose Language') || 'Choose Language'}
          </h3>
          <LanguageSwitcher />
          <button
            onClick={() => setShowLangModal(false)}
            style={{
              marginTop: 24,
              display: 'block',
              marginLeft: 'auto',
              marginRight: 'auto',
              padding: '6px 18px',
              borderRadius: 6,
              background: '#282c34',
              color: '#fff',
              border: 'none'
            }}
          >
            OK
          </button>
        </div>
      </div>
    )
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
