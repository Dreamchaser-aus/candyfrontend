import React from 'react';
import { Game } from './components/Game';
const tg = (window as any).Telegram?.WebApp;
const telegramId = tg?.initDataUnsafe?.user?.id;


function App() {
  return <Game />;
}

export default App;
