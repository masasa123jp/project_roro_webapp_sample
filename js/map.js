/*
  map.js – イベントマップ描画

  CSVから生成したJSONファイルを読み込み、Google Maps上にマーカーを表示します。
  各マーカーにはイベント情報を表示するInfoWindowを紐付け、お気に入り登録
  ボタンでローカルストレージへの保存が行えます。
*/

// グローバル変数
let map;
let infoWindow;
// 全マーカーリストとカテゴリ状態
let markersList = [];
// 選択されたカテゴリを管理する集合。空の場合はすべて表示
const selectedCategories = new Set();
// eventsData は data/events.js で定義されるグローバル変数を参照
// eventsData 変数は data/events.js でグローバルに提供されます。

/**
 * Google Mapsの初期化関数。API読み込み時にコールバックされます。
 */
function initMap() {
  // ログイン状態を確認
  requireLogin();
  // デフォルトの中心（東京駅周辺）
  const defaultCenter = { lat: 35.681236, lng: 139.767125 };
  // マップスタイル：ブランドカラーに合わせて淡い配色に
  const styles = [
    { elementType: 'geometry', stylers: [{ color: '#F5F5F5' }] },
    { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#616161' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#F5F5F5' }] },
    {
      featureType: 'administrative.land_parcel',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#BDBDBD' }]
    },
    {
      featureType: 'poi',
      elementType: 'geometry',
      stylers: [{ color: '#eeeeee' }]
    },
    {
      featureType: 'poi',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#757575' }]
    },
    {
      featureType: 'poi.park',
      elementType: 'geometry',
      stylers: [{ color: '#e5f4e8' }]
    },
    {
      featureType: 'poi.park',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#388e3c' }]
    },
    {
      featureType: 'road',
      elementType: 'geometry',
      stylers: [{ color: '#ffffff' }]
    },
    {
      featureType: 'road.arterial',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#757575' }]
    },
    {
      featureType: 'road.highway',
      elementType: 'geometry',
      stylers: [{ color: '#dadada' }]
    },
    {
      featureType: 'road.highway',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#616161' }]
    },
    {
      featureType: 'transit',
      elementType: 'geometry',
      stylers: [{ color: '#f2f2f2' }]
    },
    {
      featureType: 'transit.station',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#9e9e9e' }]
    },
    {
      featureType: 'water',
      elementType: 'geometry',
      stylers: [{ color: '#cddffb' }]
    },
    {
      featureType: 'water',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#9e9e9e' }]
    }
  ];
  // マップオプション
  map = new google.maps.Map(document.getElementById('map'), {
    center: defaultCenter,
    zoom: 6,
    styles: styles,
    mapTypeControl: false,
    fullscreenControl: false
  });
  infoWindow = new google.maps.InfoWindow();
  // data/events.js にて定義された eventsData を利用してマーカーを生成
  const localEvents = Array.isArray(window.eventsData) ? window.eventsData.slice() : [];
  // 池袋4丁目付近にダミーの施設を生成し、マーカーとして表示するために配列に追加
  // 50km 圏内に200件のペット関連施設をランダムに配置する。
  const dummyEvents = generateDummyEvents(200);
  // const 配列は再代入できないが、内容の push は可能
  localEvents.push(...dummyEvents);
  if (localEvents.length === 0) {
    console.warn('イベントデータが空です');
    return;
  }
  const bounds = new google.maps.LatLngBounds();
  // カスタムマーカーの設定：雫型のシンボルを使用してブランドカラーに
  // 雫型パス（上部が丸く、下に尖るデザイン）
  const markerPath = 'M0,0 C8,0 8,-12 0,-20 C-8,-12 -8,0 0,0 Z';
  const markerSymbol = {
    path: markerPath,
    fillColor: '#FFC72C',
    fillOpacity: 0.9,
    strokeColor: '#1F497D',
    strokeWeight: 1,
    scale: 1
  };
  // グローバル変数 "event" との競合を避けるため、コールバックの引数名を
  // eventItem とする。ブラウザによっては window.event が const として
  // 定義されており、再代入しようとすると "Assignment to constant variable"
  // エラーが発生する可能性があるためである。
  localEvents.forEach((eventItem, index) => {
    const position = { lat: eventItem.lat, lng: eventItem.lon };
    // カテゴリを割り当て。既存のイベントには 'event' を設定し、ダミーにはランダムカテゴリを設定
    if (!eventItem.category) {
      if (index < (window.eventsData ? window.eventsData.length : 0)) {
        eventItem.category = 'event';
      } else {
        // ランダムにカテゴリを選択（eventを除外）
        const catOptions = ['restaurant','hotel','activity','museum','transport','pharmacy','atm','facility'];
        eventItem.category = catOptions[Math.floor(Math.random() * catOptions.length)];
      }
    }
    // カテゴリ別アイコン色を決定
    const categoryColors = {
      event: '#FFC72C',
      restaurant: '#E74C3C',
      hotel: '#8E44AD',
      activity: '#3498DB',
      museum: '#27AE60',
      transport: '#2C3E50',
      pharmacy: '#F39C12',
      atm: '#16A085',
      facility: '#95A5A6'
    };
    const iconColor = categoryColors[eventItem.category] || '#FFC72C';
    const markerSymbolForCategory = {
      path: markerPath,
      fillColor: iconColor,
      fillOpacity: 0.9,
      strokeColor: '#1F497D',
      strokeWeight: 1,
      scale: 1
    };
    const marker = new google.maps.Marker({
      position,
      map,
      title: eventItem.name,
      icon: markerSymbolForCategory
    });
    bounds.extend(position);
    // markersList に格納
    markersList.push({ marker, category: eventItem.category });
    marker.addListener('click', () => {
      // InfoWindowの内容を動的に生成
      const dateStr = eventItem.date && eventItem.date !== 'nan' ? `<p>${eventItem.date}</p>` : '';
      const addressStr = eventItem.address && eventItem.address !== 'nan' ? `<p>${eventItem.address}</p>` : '';
      const linkStr = eventItem.url && eventItem.url !== 'nan' ? `<p><a href="${eventItem.url}" target="_blank" rel="noopener">詳細を見る</a></p>` : '';
      // 保存ボタンとメニュー
      const menuHtml = `
        <div class="save-menu" style="display:none;position:absolute;top:110%;left:0;background:#fff;border:1px solid #ccc;border-radius:6px;padding:0.4rem;box-shadow:0 2px 6px rgba(0,0,0,0.2);width:130px;font-size:0.8rem;">
          <div class="save-option" data-list="favorite" style="cursor:pointer;padding:0.2rem 0.4rem;display:flex;align-items:center;gap:0.3rem;"><span>❤️</span><span>お気に入り</span></div>
          <div class="save-option" data-list="want" style="cursor:pointer;padding:0.2rem 0.4rem;display:flex;align-items:center;gap:0.3rem;"><span>🚩</span><span>行ってみたい</span></div>
          <div class="save-option" data-list="plan" style="cursor:pointer;padding:0.2rem 0.4rem;display:flex;align-items:center;gap:0.3rem;"><span>🧳</span><span>旅行プラン</span></div>
          <div class="save-option" data-list="star" style="cursor:pointer;padding:0.2rem 0.4rem;display:flex;align-items:center;gap:0.3rem;"><span>⭐</span><span>スター付き</span></div>
        </div>`;
      const content = `
        <div class="info-content" style="position:relative;">
          <h3 style="margin:0 0 0.2rem 0;">${eventItem.name}</h3>
          ${dateStr}
          ${addressStr}
          ${linkStr}
          <div class="save-wrapper" style="position:relative;display:inline-block;margin-top:0.5rem;">
            <button class="save-btn" data-index="${index}" style="background-color:transparent;border:none;color:#1F497D;font-size:0.9rem;cursor:pointer;display:flex;align-items:center;gap:0.3rem;">
              <span class="save-icon">🔖</span><span>保存</span>
            </button>
            ${menuHtml}
          </div>
        </div>`;
      infoWindow.setContent(content);
      infoWindow.open(map, marker);
      // InfoWindow内のボタンにイベントを付与するため、DOMReadyで監視
      google.maps.event.addListenerOnce(infoWindow, 'domready', () => {
        // 保存ボタンとメニューの操作
        const saveBtn = document.querySelector('.save-btn');
        const saveMenu = document.querySelector('.save-menu');
        if (saveBtn && saveMenu) {
          saveBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            // メニュー表示をトグル
            saveMenu.style.display = saveMenu.style.display === 'none' ? 'block' : 'none';
          });
          saveMenu.querySelectorAll('.save-option').forEach(opt => {
            opt.addEventListener('click', (ev) => {
              const listType = opt.getAttribute('data-list');
              addToFavorites(localEvents[index], listType);
              saveMenu.style.display = 'none';
            });
          });
        }
      });
    });
  });
  // ユーザー住所によって中心とズームを調整
  let userCenter = null;
  let userZoom = 6;
  try {
    const user = JSON.parse(sessionStorage.getItem('user')) || {};
    if (user.address) {
      // 東京都豊島区池袋4丁目付近の住所を検出。"池袋" または "豊島区" を含むかで判定する。
      if (user.address.includes('池袋') || user.address.includes('豊島区')) {
        // 池袋4丁目付近の概算座標
        userCenter = { lat: 35.7303, lng: 139.7099 };
        userZoom = 11; // 約20kmの範囲を表示
      }
    }
  } catch (e) {
    /* ignore */
  }
  if (userCenter) {
    map.setCenter(userCenter);
    map.setZoom(userZoom);
  } else {
    // ユーザーの住所が無い場合、全マーカーが見えるように調整
    map.fitBounds(bounds);
  }

  // 周辺表示ボタンに機能を追加
  const resetBtn = document.getElementById('reset-view-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      // ユーザー住所に基づいて中心とズームを設定する
      let center = null;
      let zoomLevel = 11;
      try {
        const u = JSON.parse(sessionStorage.getItem('user')) || {};
        if (u.address && (u.address.includes('池袋') || u.address.includes('豊島区'))) {
          center = { lat: 35.7303, lng: 139.7099 };
          zoomLevel = 11;
        }
      } catch (err) {
        /* ignore */
      }
      if (center) {
        map.setCenter(center);
        map.setZoom(zoomLevel);
      } else {
        map.setCenter(defaultCenter);
        map.setZoom(6);
      }
    });
  }

  // カテゴリフィルタバーを初期化
  createCategoryButtons();
  // 初期表示は全てのマーカーを表示
  updateMarkerVisibility();
}

/**
 * カテゴリフィルタバーを生成し、ボタンにクリックイベントを設定します。
 */
function createCategoryButtons() {
  const bar = document.getElementById('category-bar');
  if (!bar) return;
  // 定義したカテゴリリスト
  const cats = [
    { key: 'event', label: 'イベント', emoji: '🎪' },
    { key: 'restaurant', label: 'レストラン', emoji: '🍴' },
    { key: 'hotel', label: 'ホテル', emoji: '🏨' },
    { key: 'activity', label: 'アクティビティ', emoji: '🎠' },
    { key: 'museum', label: '美術館・博物館', emoji: '🏛️' },
    { key: 'transport', label: '交通機関', emoji: '🚉' },
    { key: 'pharmacy', label: '薬局', emoji: '💊' },
    { key: 'atm', label: 'ATM', emoji: '🏧' },
    { key: 'facility', label: '施設', emoji: '🏢' }
  ];
  cats.forEach((cat) => {
    const btn = document.createElement('button');
    btn.className = 'filter-btn';
    btn.setAttribute('data-category', cat.key);
    btn.innerHTML = `<span>${cat.emoji}</span><span>${cat.label}</span>`;
    btn.addEventListener('click', () => {
      const key = btn.getAttribute('data-category');
      if (btn.classList.contains('active')) {
        btn.classList.remove('active');
        selectedCategories.delete(key);
      } else {
        btn.classList.add('active');
        selectedCategories.add(key);
      }
      updateMarkerVisibility();
    });
    bar.appendChild(btn);
  });
}

/**
 * 選択されたカテゴリに基づいてマーカーの表示・非表示を更新します。
 */
function updateMarkerVisibility() {
  // selectedCategories が空の場合は全て表示
  markersList.forEach((item) => {
    if (selectedCategories.size === 0) {
      item.marker.setVisible(true);
    } else {
      const visible = selectedCategories.has(item.category);
      item.marker.setVisible(visible);
    }
  });
}

/**
 * 指定されたイベントをお気に入りに追加する。
 * @param {Object} event イベントオブジェクト
 */
function addToFavorites(eventItem, listType = 'favorite') {
  let favorites;
  try {
    favorites = JSON.parse(localStorage.getItem('favorites')) || [];
  } catch (e) {
    favorites = [];
  }
  // 重複チェック（名称と座標で判定）
  const exists = favorites.some((f) => f.name === eventItem.name && f.lat === eventItem.lat && f.lon === eventItem.lon && f.listType === listType);
  if (!exists) {
    const itemToSave = { ...eventItem, listType };
    favorites.push(itemToSave);
    localStorage.setItem('favorites', JSON.stringify(favorites));
    alert('リストに保存しました');
  } else {
    alert('既にこのリストに登録済みです');
  }
}

/**
 * 池袋4丁目付近を中心にランダムなダミーイベントを生成します。
 * @param {number} count 生成するイベント数
 * @returns {Array<Object>} ダミーイベントの配列
 */
function generateDummyEvents(count) {
  const results = [];
  // 基準点：東京都豊島区池袋4丁目付近の概算座標
  const baseLat = 35.7303;
  const baseLng = 139.7099;
  // ランダム生成ポイントの範囲を狭め、海上に表示されないよう調整
  const radiusKm = 20; // 20km 範囲に限定
  for (let i = 0; i < count; i++) {
    // 0〜radiusKm の距離を一様分布にするため sqrt を利用
    const distance = Math.sqrt(Math.random()) * radiusKm;
    const angle = Math.random() * 2 * Math.PI;
    // 地球半径1度あたり約111.32km として換算
    const deltaLat = (distance * Math.cos(angle)) / 111.32;
    const deltaLng = (distance * Math.sin(angle)) / (111.32 * Math.cos(baseLat * Math.PI / 180));
    let lat = baseLat + deltaLat;
    let lng = baseLng + deltaLng;
    // 海上に配置されないよう、大きく逸脱した場合は基準値に近づける
    const latMin = baseLat - 0.15;
    const latMax = baseLat + 0.15;
    const lngMin = baseLng - 0.15;
    const lngMax = baseLng + 0.15;
    if (lat < latMin) lat = latMin + Math.random() * 0.05;
    if (lat > latMax) lat = latMax - Math.random() * 0.05;
    if (lng < lngMin) lng = lngMin + Math.random() * 0.05;
    if (lng > lngMax) lng = lngMax - Math.random() * 0.05;
    results.push({
      name: `ペット関連施設 ${i + 1}`,
      date: '',
      location: 'dummy',
      venue: 'dummy',
      address: '東京都近郊のペット施設',
      prefecture: '東京都',
      city: '',
      lat: lat,
      lon: lng,
      source: 'Dummy',
      url: '#'
    });
  }
  return results;
}