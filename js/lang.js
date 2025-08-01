/*
  lang.js – 多言語対応スクリプト

  サイト全体で使用するテキストの翻訳辞書を定義し、ユーザーの選択に応じて
  表示言語を切り替える仕組みを提供します。ページ読み込み時に現在の
  言語設定を読み込み、data-i18n-key 属性が指定された要素に翻訳を適用します。
  また、言語切替ボタン（globe アイコン）を使って順番に言語を変更できます。
*/

// 翻訳辞書: 各キーに対して4言語分の翻訳を提供します
const translations = {
  ja: {
    nav_map: 'マップ',
    nav_ai: 'AI',
    nav_favorites: 'お気に入り',
    nav_magazine: '雑誌',
    nav_profile: 'マイページ',
    profile_title: 'マイページ',
    magazine_title: '月間雑誌',
    map_title: 'おでかけマップ',
    ai_title: 'AIアシスタント',
    favorites_title: 'お気に入り',
    profile_edit: 'プロフィール編集',
    label_name: 'お名前',
    label_furigana: 'ふりがな',
    label_email: 'メールアドレス',
    label_phone: '電話番号',
    label_address: '住所',
    label_language: '言語',
    pet_info: 'ペット情報',
    add_pet: 'ペットを追加',
    save: '保存',
    logout: 'ログアウト',
    no_favorites: 'お気に入りがまだありません。',
    delete: '削除',
    ai_intro: '以下のチャットボックスでは、DifyのAIアシスタントと対話することができます。ペットのイベント情報やおすすめスポットなど、気になることを気軽に質問してみましょう。',
    ai_note: '※このチャットはモックアップです。実際のAI連携にはDifyが提供するスクリプトを読み込んでください。',
    send: '送信',
    chat_placeholder: 'メッセージを入力...',
    reset_view: '周辺表示'
  },
  en: {
    nav_map: 'Map',
    nav_ai: 'AI',
    nav_favorites: 'Favorites',
    nav_magazine: 'Magazine',
    nav_profile: 'Profile',
    profile_title: 'My Page',
    magazine_title: 'Monthly Magazine',
    map_title: 'Outing Map',
    ai_title: 'AI Assistant',
    favorites_title: 'Favorites',
    profile_edit: 'Edit Profile',
    label_name: 'Name',
    label_furigana: 'Furigana',
    label_email: 'Email Address',
    label_phone: 'Phone Number',
    label_address: 'Address',
    label_language: 'Language',
    pet_info: 'Pet Info',
    add_pet: 'Add Pet',
    save: 'Save',
    logout: 'Logout',
    no_favorites: 'No favorites yet.',
    delete: 'Remove',
    ai_intro: 'You can chat with our AI assistant. Feel free to ask about pet events and recommended spots.',
    ai_note: '*This chat is a mockup. Please load the official Dify script for real AI integration.',
    send: 'Send',
    chat_placeholder: 'Enter your message...',
    reset_view: 'Reset View'
  },
  zh: {
    nav_map: '地图',
    nav_ai: 'AI',
    nav_favorites: '收藏',
    nav_magazine: '杂志',
    nav_profile: '我的主页',
    profile_title: '我的主页',
    magazine_title: '月刊杂志',
    map_title: '外出地图',
    ai_title: 'AI助手',
    favorites_title: '收藏',
    profile_edit: '编辑个人信息',
    label_name: '姓名',
    label_furigana: '读音',
    label_email: '电子邮件',
    label_phone: '电话号码',
    label_address: '地址',
    label_language: '语言',
    pet_info: '宠物信息',
    add_pet: '添加宠物',
    save: '保存',
    logout: '退出登录',
    no_favorites: '暂无收藏。',
    delete: '删除',
    ai_intro: '您可以在此与AI助手聊天，咨询宠物活动和推荐地点等。',
    ai_note: '*该聊天为模型展示。要启用真正的AI功能，请加载Dify官方脚本。',
    send: '发送',
    chat_placeholder: '输入您的信息...',
    reset_view: '重置视图'
  },
  ko: {
    nav_map: '지도',
    nav_ai: 'AI',
    nav_favorites: '즐겨찾기',
    nav_magazine: '잡지',
    nav_profile: '마이페이지',
    profile_title: '마이페이지',
    magazine_title: '월간 잡지',
    map_title: '나들이 지도',
    ai_title: 'AI 어시스턴트',
    favorites_title: '즐겨찾기',
    profile_edit: '프로필 편집',
    label_name: '이름',
    label_furigana: '후리가나',
    label_email: '이메일',
    label_phone: '전화번호',
    label_address: '주소',
    label_language: '언어',
    pet_info: '반려동물 정보',
    add_pet: '반려동물 추가',
    save: '저장',
    logout: '로그아웃',
    no_favorites: '즐겨찾기가 없습니다.',
    delete: '삭제',
    ai_intro: '이 채팅 박스에서 AI 어시스턴트와 대화할 수 있습니다. 반려동물 이벤트와 추천 장소에 대해 문의하세요.',
    ai_note: '*이 채팅은 목업입니다. 실제 AI 연동은 Dify가 제공하는 스크립트를 로드하세요.',
    send: '보내기',
    chat_placeholder: '메시지를 입력하세요...',
    reset_view: '주변 표시'
  }
};

// 言語設定の取得と保存
function getUserLang() {
  return localStorage.getItem('userLang') || 'ja';
}
function setUserLang(lang) {
  localStorage.setItem('userLang', lang);
}

/**
 * data-i18n-key を持つ要素に翻訳文字列を適用する
 */
function applyTranslations() {
  const lang = getUserLang();
  // テキストコンテンツの翻訳
  document.querySelectorAll('[data-i18n-key]').forEach((el) => {
    const key = el.getAttribute('data-i18n-key');
    if (translations[lang] && translations[lang][key]) {
      el.textContent = translations[lang][key];
    }
  });
  // プレースホルダー属性の翻訳
  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (translations[lang] && translations[lang][key]) {
      el.setAttribute('placeholder', translations[lang][key]);
    }
  });
}

// グローバルから参照できるようにエクスポート
window.translations = translations;
window.getUserLang = getUserLang;
window.applyTranslations = applyTranslations;

/**
 * 現在の言語を順番に切り替える
 */
function cycleLang() {
  const order = ['ja', 'en', 'zh', 'ko'];
  const current = getUserLang();
  const idx = order.indexOf(current);
  const next = order[(idx + 1) % order.length];
  setUserLang(next);
  // プロフィールページの言語選択セレクトにも反映
  const langSelect = document.getElementById('profile-language');
  if (langSelect) {
    langSelect.value = next;
  }
  // ユーザーデータにも保存
  try {
    const userStr = sessionStorage.getItem('user');
    if (userStr) {
      const userObj = JSON.parse(userStr);
      userObj.language = next;
      sessionStorage.setItem('user', JSON.stringify(userObj));
    }
  } catch (err) {
    /* ignore */
  }
  applyTranslations();
}

/**
 * 言語切替ボタンを初期化します
 */
function initLangToggle() {
  const btn = document.getElementById('lang-toggle-btn');
  if (btn) {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      cycleLang();
    });
  }
}

// 初期化: ページ読み込み時に翻訳を適用し、ボタンをセットアップ
document.addEventListener('DOMContentLoaded', () => {
  // セッション内のユーザー情報から言語設定があれば反映
  try {
    const userStr = sessionStorage.getItem('user');
    if (userStr) {
      const userObj = JSON.parse(userStr);
      if (userObj.language) {
        setUserLang(userObj.language);
      }
    }
  } catch (err) {
    /* ignore */
  }
  // プロフィールページの言語選択の同期
  const langSelect = document.getElementById('profile-language');
  if (langSelect) {
    langSelect.value = getUserLang();
    langSelect.addEventListener('change', () => {
      const selected = langSelect.value;
      setUserLang(selected);
      // 更新時にセッションユーザーにも保存
      try {
        const userStr2 = sessionStorage.getItem('user');
        if (userStr2) {
          const userObj2 = JSON.parse(userStr2);
          userObj2.language = selected;
          sessionStorage.setItem('user', JSON.stringify(userObj2));
        }
      } catch (e) {
        /* ignore */
      }
      applyTranslations();
    });
  }
  applyTranslations();
  initLangToggle();
});