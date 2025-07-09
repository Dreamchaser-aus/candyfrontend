import React, { useEffect, useState } from 'react';
import { Game } from './components/Game';
import { API_BASE_URL } from './config/gameConfig';
import { useTranslation } from 'react-i18next';

function App() {
  const [telegramUser, setTelegramUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isBound, setIsBound] = useState<boolean | null>(null);

  const { t } = useTranslation();

  useEffect(() => {
    let tg = undefined, user = undefined;
    try {
      tg = (window as any).Telegram?.WebApp;
      user = tg?.initDataUnsafe?.user;
    } catch (err) {
      //
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

  if (loading) {
    return (
      <div style={{ color: '#fff', textAlign: 'center', marginTop: 50 }}>
        {t('loading')}
      </div>
    );
  }

  if (!telegramUser) {
    return (
      <div style={{ color: '#fff', textAlign: 'center', marginTop: 80 }}>
        <div style={{ fontSize: 22, marginBottom: 16 }} dangerouslySetInnerHTML={{ __html: t('not_in_telegram') }} />
        <div>{t('not_browser')}</div>
      </div>
    );
  }

  if (isBound === false) {
    return (
      <div style={{ color: '#fff', textAlign: 'center', marginTop: 80 }}>
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
    <Game telegramUser={telegramUser} />
  );
}

export default App;
