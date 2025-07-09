import { useTranslation } from 'react-i18next';

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  return (
    <div style={{ textAlign: 'center', padding: 20 }}>
      <button
        onClick={() => i18n.changeLanguage('zh')}
        style={{
          margin: '0 8px',
          fontWeight: i18n.language === 'zh' ? 'bold' : 'normal',
          color: i18n.language === 'zh' ? '#3cf' : '#333',
        }}
      >
        中文
      </button>
      <button
        onClick={() => i18n.changeLanguage('en')}
        style={{
          margin: '0 8px',
          fontWeight: i18n.language === 'en' ? 'bold' : 'normal',
          color: i18n.language === 'en' ? '#3cf' : '#333',
        }}
      >
        English
      </button>
    </div>
  );
}
