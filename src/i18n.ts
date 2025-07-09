import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

i18n.use(initReactI18next).init({
  lng: 'en',           // 默认语言，可切换为 'en'
  fallbackLng: 'en',   // 找不到时的备用语言
  interpolation: { escapeValue: false },
  resources: {
    zh: {
      translation: {
        loading: '加载中...',
        not_in_telegram: '请在 <b>Telegram 客户端</b> 内通过 Bot 按钮进入游戏',
        not_browser: '不能直接浏览器访问！',
        not_bound: '请先在 Telegram Bot 绑定手机号！',
        go_bind: '👉 点此去绑定'
      }
    },
    en: {
      translation: {
        loading: 'Loading...',
        not_in_telegram: 'Please enter the game through the Bot button in <b>Telegram client</b>',
        not_browser: 'Cannot access directly via browser!',
        not_bound: 'Please bind your phone number in the Telegram Bot first!',
        go_bind: '👉 Click here to bind'
      }
    }
  }
});

export default i18n;
