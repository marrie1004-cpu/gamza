/**
 * 감자(Gamza) 중고 거래 웹 서비스 - [화면 1: 상품 목록] 모듈
 * 파일: screen1_list.js
 */

(function () {
  'use strict';

  // 귀여운 감자 감성 아바타 SVG Data URI 생성 헬퍼
  function createPotatoAvatar(bgColor, emoji) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80">
      <rect width="80" height="80" rx="40" fill="${bgColor}"/>
      <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" font-size="38">${emoji}</text>
    </svg>`;
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
  }

  // 카테고리 목록 (7개)
  const CATEGORIES = [
    '전체',
    '디지털기기',
    '가구/인테리어',
    '의류',
    '생활가전',
    '도서/티켓',
    '기타'
  ];

  // 가짜 상품 6개 기본 데이터 (3개 화면 공통 스키마 준수, 3가지 판매 상태 골고루 포함)
  const INITIAL_PRODUCTS = [
    {
      id: 1,
      title: '아이패드 에어 5세대 64GB 스타라이트 (애플펜슬 2세대 포함)',
      category: '디지털기기',
      price: 580000,
      location: '서울 마포구 연남동',
      timeAgo: '10분 전',
      status: '판매중',
      image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=800&q=80',
      description: '자격증 공부용으로 구매했다가 합격 후 모셔만 두어 판매합니다.\n구매 직후 종이질감 필름 붙여두었고 케이스 끼고 사용해서 찍힘이나 기스 전혀 없는 S급 상태예요.\n배터리 효율 96%이며, 애플펜슬 2세대와 정품 박스 모두 함께 드립니다. 연남동 직거래 선호해요!',
      seller: {
        nickname: '포슬감자',
        avatar: createPotatoAvatar('#EFE6DD', '🥔'),
        region: '서울 마포구 연남동'
      }
    },
    {
      id: 2,
      title: '원목 반타원형 2인용 카페 테이블 & 라탄 의자 세트',
      category: '가구/인테리어',
      price: 85000,
      location: '경기 성남시 분당구 정자동',
      timeAgo: '35분 전',
      status: '예약중',
      image: 'https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?auto=format&fit=crop&w=800&q=80',
      description: '거실 창가에 두고 홈카페용으로 예쁘게 사용하던 원목 테이블과 라탄 의자 1점 세트입니다.\n따뜻한 우드 톤이라 어떤 인테리어에도 감성 있게 잘 어울려요.\n이사로 인해 큰 식탁을 들이게 되어 아쉽게 내놓습니다. 하단 다리 분리 가능해서 일반 승용차 뒷좌석에도 충분히 실립니다.',
      seller: {
        nickname: '버터구이감자',
        avatar: createPotatoAvatar('#FEF3C7', '🧈'),
        region: '경기 성남시 분당구 정자동'
      }
    },
    {
      id: 3,
      title: '발뮤다 더 토스터 프로 베이지 (박스 풀구성)',
      category: '생활가전',
      price: 160000,
      location: '서울 강남구 역삼동',
      timeAgo: '1시간 전',
      status: '판매중',
      image: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=800&q=80',
      description: '선물 받아서 주말 브런치 먹을 때만 가끔 사용하던 발뮤다 토스터입니다.\n내부 그릴망과 물 주입구까지 베이킹소다로 깔끔하게 세척해 두었습니다.\n5cc 전용 미니 컵과 설명서, 순정 박스까지 그대로 보관 중입니다. 역삼역 인근 직거래 가능합니다.',
      seller: {
        nickname: '왕감자상점',
        avatar: createPotatoAvatar('#E6F4EA', '🌱'),
        region: '서울 강남구 역삼동'
      }
    },
    {
      id: 4,
      title: '코스(COS) 오버핏 울 블렌드 가디건 크림 베이지 M사이즈',
      category: '의류',
      price: 62000,
      location: '서울 성동구 성수동',
      timeAgo: '2시간 전',
      status: '판매중',
      image: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=800&q=80',
      description: '작년 가을 한남동 코스 매장에서 정가 19만 원대에 구매한 울 가디건입니다.\n포근한 크림 베이지 컬러라 청바지나 슬랙스에 툭 걸치기 정말 좋아요.\n드라이클리닝 완료 후 보관 중이며 보풀이나 늘어남 없이 깔끔합니다. 평소 95~100 입으시는 분들께 예쁜 루즈핏으로 맞아요.',
      seller: {
        nickname: '햇감자바구니',
        avatar: createPotatoAvatar('#F4EFE6', '🧺'),
        region: '서울 성동구 성수동'
      }
    },
    {
      id: 5,
      title: '모던 자바스크립트 Deep Dive + 리액트 실전 기술 도서 일괄',
      category: '도서/티켓',
      price: 32000,
      location: '강원도 춘천시 온의동',
      timeAgo: '4시간 전',
      status: '거래 완료',
      image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
      description: '프론트엔드 개발 공부하면서 참고했던 필독서 2권 일괄 판매합니다.\n책 표지 변색 없고 내부 밑줄이나 필기 전혀 없이 깨끗하게 읽었습니다.\n입문자나 기본기 다지고 싶으신 분께 추천드려요. 춘천 온의동 직거래 또는 반값택배 거래 모두 가능합니다!',
      seller: {
        nickname: '강원도감자칩',
        avatar: createPotatoAvatar('#E5E7EB', '📚'),
        region: '강원도 춘천시 온의동'
      }
    },
    {
      id: 6,
      title: '감성 캠핑용 우드 롤테이블 + 수납 가방 풀세트',
      category: '기타',
      price: 45000,
      location: '서울 송파구 잠실동',
      timeAgo: '어제',
      status: '예약중',
      image: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=800&q=80',
      description: '피크닉과 감성 캠핑 갈 때 3번 정도 들고 나간 우드 롤테이블입니다.\n조립이 1분도 안 걸릴 만큼 간편하고 전용 파우치에 넣으면 부피도 작아서 보관하기 편해요.\n상판 생활 기스 거의 없고 다리 고무캡도 깨끗합니다. 이번 주말 한강 피크닉 준비하시는 분이 데려가시면 좋겠네요!',
      seller: {
        nickname: '모닥불군감자',
        avatar: createPotatoAvatar('#EFE6DD', '⛺'),
        region: '서울 송파구 잠실동'
      }
    }
  ];

  // 내부 필터 상태
  const filterState = {
    searchQuery: '',
    selectedCategory: '전체',
    availableOnly: false
  };

  // 가격 포맷 헬퍼 (예: 45000 -> "45,000원")
  function formatPrice(price) {
    if (price === 0) return '무료나눔';
    return Number(price).toLocaleString('ko-KR') + '원';
  }

  // 판매 상태에 따른 배지 클래스 반환 (3개 화면 공통 클래스)
  function getStatusBadgeClass(status) {
    const raw = String(status || '판매중').trim();
    if (raw === '예약중' || raw.toLowerCase() === 'reserved') {
      return 'status-badge status-reserved';
    }
    if (
      raw === '거래 완료' ||
      raw === '거래완료' ||
      raw === '판매완료' ||
      raw === '판매 완료' ||
      raw.toLowerCase() === 'completed' ||
      raw.toLowerCase() === 'sold'
    ) {
      return 'status-badge status-done';
    }
    return 'status-badge status-sale';
  }

  // 주소에서 동네 이름(마지막 토큰 또는 간략 주소) 표시를 깔끔하게 유지하되 전체 주소도 검색되도록 처리
  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // 토스트 메시지 표시
  let toastTimer = null;
  function showToast(message) {
    let toastEl = document.getElementById('gamza-toast');
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.id = 'gamza-toast';
      toastEl.className = 'gamza-toast';
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = message;
    toastEl.classList.add('show');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastEl.classList.remove('show');
    }, 2400);
  }

  // 현재 필터 조건에 맞는 상품 배열 반환
  function getFilteredProducts(products) {
    const query = filterState.searchQuery.trim().toLowerCase();
    return products.filter((item) => {
      // 1. 카테고리 필터
      if (filterState.selectedCategory !== '전체' && item.category !== filterState.selectedCategory) {
        return false;
      }
      // 2. 거래 가능만 보기 필터 ("거래 완료"된 글은 확실히 제외)
      if (filterState.availableOnly) {
        const rawStatus = String(item.status || '').trim();
        if (
          rawStatus === '거래 완료' ||
          rawStatus === '거래완료' ||
          rawStatus === '판매완료' ||
          rawStatus === '판매 완료' ||
          rawStatus.toLowerCase() === 'completed' ||
          rawStatus.toLowerCase() === 'sold'
        ) {
          return false;
        }
      }
      // 3. 검색어 필터 (상품명, 판매 위치, 카테고리)
      if (query) {
        const matchTitle = (item.title || '').toLowerCase().includes(query);
        const matchLocation = (item.location || '').toLowerCase().includes(query);
        const matchCategory = (item.category || '').toLowerCase().includes(query);
        if (!matchTitle && !matchLocation && !matchCategory) {
          return false;
        }
      }
      return true;
    });
  }

  // 상품 카드 1개 HTML 생성
  function createProductCardHTML(product) {
    const badgeClass = getStatusBadgeClass(product.status);
    const rawStatus = String(product.status || '').trim();
    const isDone = (
      rawStatus === '거래 완료' ||
      rawStatus === '거래완료' ||
      rawStatus === '판매완료' ||
      rawStatus === '판매 완료' ||
      rawStatus.toLowerCase() === 'completed' ||
      rawStatus.toLowerCase() === 'sold'
    );
    const isDoneClass = isDone ? 'is-done' : '';
    const sellerNickname =
      (product.seller && typeof product.seller === 'object' && product.seller.nickname)
        ? product.seller.nickname
        : (typeof product.seller === 'string' && product.seller
          ? product.seller
          : (product.sellerNickname || '감자이웃'));
    const sellerAvatar =
      (product.seller && typeof product.seller === 'object' && product.seller.avatar)
        ? product.seller.avatar
        : createPotatoAvatar('#EFE6DD', '🥔');
    const timeAgoText = product.timeAgo || product.createdAt || '방금 전';

    return `
      <article class="product-card ${isDoneClass}" data-product-id="${escapeHtml(product.id)}" tabindex="0" role="button" aria-label="${escapeHtml(product.title)} 상세 보기">
        <div class="card-img-wrap">
          <img src="${escapeHtml(product.image || product.imageUrl)}" alt="${escapeHtml(product.title)}" loading="lazy" />
          <span class="card-category-tag">${escapeHtml(product.category)}</span>
        </div>
        <div class="card-body">
          <div class="card-top-row">
            <span class="${badgeClass}">${escapeHtml(product.status)}</span>
          </div>
          <h3 class="card-title">${escapeHtml(product.title)}</h3>
          <div class="card-meta">
            <span>${escapeHtml(product.location)}</span>
            <span>·</span>
            <span>${escapeHtml(timeAgoText)}</span>
          </div>
          <div class="card-bottom-row">
            <div class="card-price">${formatPrice(product.price)}</div>
            <div class="card-seller-mini">
              <img src="${escapeHtml(sellerAvatar)}" alt="${escapeHtml(sellerNickname)}" />
              <span>${escapeHtml(sellerNickname)}</span>
            </div>
          </div>
        </div>
      </article>
    `;
  }

  // 상품 그리드 영역만 다시 렌더링
  function renderProductGrid(products) {
    const gridEl = document.getElementById('product-grid');
    const countEl = document.getElementById('product-count-num');
    if (!gridEl) return;

    const listData = Array.isArray(products) ? products : (window.gamzaProducts || INITIAL_PRODUCTS);
    const filtered = getFilteredProducts(listData);

    if (countEl) {
      countEl.textContent = filtered.length;
    }

    if (filtered.length === 0) {
      gridEl.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🥔</div>
          <h3>조건에 맞는 감자 매물이 없어요</h3>
          <p>다른 검색어를 입력하거나 필터 조건을 초기화해 보세요.</p>
          <button type="button" class="btn btn-outline" id="btn-reset-filters">필터 초기화</button>
        </div>
      `;
      const resetBtn = document.getElementById('btn-reset-filters');
      if (resetBtn) {
        resetBtn.addEventListener('click', () => {
          resetFilters(listData);
        });
      }
      return;
    }

    gridEl.innerHTML = filtered.map(createProductCardHTML).join('');

    // 카드 클릭 이벤트 바인딩
    const cardEls = gridEl.querySelectorAll('.product-card');
    cardEls.forEach((card) => {
      const handleCardActivate = () => {
        const rawId = card.getAttribute('data-product-id');
        if (typeof window.onProductCardClick === 'function') {
          window.onProductCardClick(rawId);
        }
      };
      card.addEventListener('click', handleCardActivate);
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleCardActivate();
        }
      });
    });
  }

  // 필터 초기화
  function resetFilters(products) {
    filterState.searchQuery = '';
    filterState.selectedCategory = '전체';
    filterState.availableOnly = false;

    const searchInput = document.getElementById('search-input');
    const clearBtn = document.getElementById('btn-clear-search');
    if (searchInput) searchInput.value = '';
    if (clearBtn) clearBtn.classList.remove('visible');

    const categoryBtns = document.querySelectorAll('.category-btn');
    categoryBtns.forEach((btn) => {
      btn.classList.toggle('active', btn.getAttribute('data-category') === '전체');
    });

    const toggleBtn = document.getElementById('toggle-available-only');
    if (toggleBtn) {
      toggleBtn.setAttribute('aria-pressed', 'false');
    }

    renderProductGrid(products);
  }

  // 전체 화면 1 (헤더 + 배너 + 필터 + 상품 그리드) 렌더링
  function renderListScreen(containerSelectorOrElement, productsData) {
    const container = typeof containerSelectorOrElement === 'string'
      ? document.querySelector(containerSelectorOrElement)
      : containerSelectorOrElement;

    if (!container) return;

    if (Array.isArray(productsData)) {
      window.gamzaProducts = productsData;
    } else if (!Array.isArray(window.gamzaProducts)) {
      window.gamzaProducts = [...INITIAL_PRODUCTS];
    }

    const categoryButtonsHTML = CATEGORIES.map((cat) => {
      const activeClass = filterState.selectedCategory === cat ? 'active' : '';
      return `<button type="button" class="category-btn ${activeClass}" data-category="${escapeHtml(cat)}">${escapeHtml(cat)}</button>`;
    }).join('');

    container.innerHTML = `
      <header class="gamza-header">
        <div class="header-inner">
          <a class="brand-logo" id="brand-home-link" role="button" tabindex="0">
            <span class="logo-icon">🥔</span>
            <span>감자 마켓</span>
            <span class="logo-sub">동네 중고거래</span>
          </a>

          <div class="header-search">
            <span class="search-icon">🔍</span>
            <input
              type="search"
              id="search-input"
              placeholder="상품명이나 동네 이름(예: 연남동, 아이패드)을 검색해 보세요"
              value="${escapeHtml(filterState.searchQuery)}"
              autocomplete="off"
            />
            <button type="button" class="btn-clear-search ${filterState.searchQuery ? 'visible' : ''}" id="btn-clear-search" aria-label="검색어 지우기">✕</button>
          </div>

          <div class="header-actions" id="header-actions">
            <button type="button" class="btn btn-primary" id="btn-open-write">
              <span>+ 글쓰기</span>
            </button>
            <div class="header-auth-group" id="header-auth-group">
              <button type="button" class="btn btn-outline" id="btn-login">
                <span>로그인</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main class="gamza-main-container" id="screen1-main">
        <section class="hero-banner">
          <div class="hero-text">
            <h1>포근하고 든든한 우리 동네 중고장터, 감자 마켓 🥔</h1>
            <p>이웃과 함께 햇감자처럼 신선한 중고 물품을 안전하고 따뜻하게 거래해 보세요.</p>
          </div>
          <div class="hero-badge">✨ 직거래 · 따뜻한 이웃 장터</div>
        </section>

        <section class="filter-section" aria-label="상품 필터">
          <div class="category-list" role="tablist" aria-label="카테고리 선택">
            ${categoryButtonsHTML}
          </div>

          <div class="available-toggle-wrap">
            <button
              type="button"
              class="toggle-btn"
              id="toggle-available-only"
              aria-pressed="${filterState.availableOnly ? 'true' : 'false'}"
            >
              <span class="toggle-switch-track">
                <span class="toggle-switch-thumb"></span>
              </span>
              <span>거래 가능만 보기</span>
            </button>
          </div>
        </section>

        <div class="list-summary-bar">
          <span>전체 매물 <strong id="product-count-num">0</strong>개</span>
          <span>최신 등록순</span>
        </div>

        <section id="product-grid" aria-live="polite"></section>
      </main>
    `;

    // 이벤트 연결: 로고 클릭 시 필터 초기화
    const brandLink = document.getElementById('brand-home-link');
    if (brandLink) {
      brandLink.addEventListener('click', (e) => {
        e.preventDefault();
        resetFilters(window.gamzaProducts);
      });
    }

    // 이벤트 연결: 실시간 검색창
    const searchInput = document.getElementById('search-input');
    const clearSearchBtn = document.getElementById('btn-clear-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        filterState.searchQuery = e.target.value;
        if (clearSearchBtn) {
          clearSearchBtn.classList.toggle('visible', filterState.searchQuery.trim().length > 0);
        }
        renderProductGrid(window.gamzaProducts);
      });
    }

    if (clearSearchBtn) {
      clearSearchBtn.addEventListener('click', () => {
        filterState.searchQuery = '';
        if (searchInput) {
          searchInput.value = '';
          searchInput.focus();
        }
        clearSearchBtn.classList.remove('visible');
        renderProductGrid(window.gamzaProducts);
      });
    }

    // 이벤트 연결: 카테고리 버튼 (7개)
    const categoryBtns = container.querySelectorAll('.category-btn');
    categoryBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const selected = btn.getAttribute('data-category') || '전체';
        filterState.selectedCategory = selected;
        categoryBtns.forEach((b) => b.classList.toggle('active', b === btn));
        renderProductGrid(window.gamzaProducts);
      });
    });

    // 이벤트 연결: 거래 가능만 보기 토글
    const toggleAvailableBtn = document.getElementById('toggle-available-only');
    if (toggleAvailableBtn) {
      toggleAvailableBtn.addEventListener('click', () => {
        filterState.availableOnly = !filterState.availableOnly;
        toggleAvailableBtn.setAttribute('aria-pressed', String(filterState.availableOnly));
        renderProductGrid(window.gamzaProducts);
      });
    }

    // 이벤트 연결: [글쓰기] 버튼
    const writeBtn = document.getElementById('btn-open-write');
    if (writeBtn) {
      writeBtn.addEventListener('click', () => {
        if (typeof window.onOpenWriteModal === 'function') {
          window.onOpenWriteModal();
        } else {
          showToast('글쓰기 화면을 여는 중입니다.');
        }
      });
    }

    // 이벤트 연결: [로그인] 버튼
    const loginBtn = document.getElementById('btn-login');
    if (loginBtn) {
      loginBtn.addEventListener('click', () => {
        if (typeof window.onOpenAuthModal === 'function') {
          window.onOpenAuthModal('login');
        } else if (window.GamzaAuthModal && typeof window.GamzaAuthModal.open === 'function') {
          window.GamzaAuthModal.open('login');
        } else {
          showToast('🥔 로그인 모달을 불러오는 중입니다.');
        }
      });
    }

    // 초기 그리드 렌더링
    renderProductGrid(window.gamzaProducts);
  }

  // 상단 헤더의 인증 상태 UI 갱신 (로그인 <-> 비로그인)
  // 로그인 전: [로그인] 버튼만 표시
  // 로그인 후: [로그인] 버튼 숨김 처리, [닉네임]과 [로그아웃] 버튼만 표시
  function updateHeaderAuthUI(profile, isLoggedIn) {
    const authGroupEl = document.getElementById('header-auth-group');
    if (!authGroupEl) return;

    if (isLoggedIn && profile && profile.nickname) {
      const avatarSrc = profile.avatar || profile.avatar_url || createPotatoAvatar('#EFE6DD', '🥔');
      const nickname = profile.nickname;
      authGroupEl.innerHTML = `
        <div class="header-user-profile" id="header-user-profile" title="로그인된 사용자: ${escapeHtml(nickname)}">
          <img src="${escapeHtml(avatarSrc)}" alt="${escapeHtml(nickname)}" />
          <span class="header-user-name">${escapeHtml(nickname)}님</span>
        </div>
        <button type="button" class="btn-logout" id="btn-logout" title="로그아웃">
          로그아웃
        </button>
      `;

      // [로그아웃] 버튼 바인딩
      const logoutBtn = document.getElementById('btn-logout');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
          if (typeof window.onLogoutClick === 'function') {
            await window.onLogoutClick();
          }
        });
      }
    } else {
      authGroupEl.innerHTML = `
        <button type="button" class="btn btn-outline" id="btn-login">
          <span>로그인</span>
        </button>
      `;

      // [로그인] 버튼 바인딩
      const loginBtn = document.getElementById('btn-login');
      if (loginBtn) {
        loginBtn.addEventListener('click', () => {
          if (typeof window.onOpenAuthModal === 'function') {
            window.onOpenAuthModal('login');
          } else if (window.GamzaAuthModal && typeof window.GamzaAuthModal.open === 'function') {
            window.GamzaAuthModal.open('login');
          }
        });
      }
    }
  }

  // 전역 모듈 노출 (부모 에이전트 통합용)
  window.Screen1List = {
    INITIAL_PRODUCTS,
    CATEGORIES,
    filterState,
    formatPrice,
    getStatusBadgeClass,
    createPotatoAvatar,
    showToast,
    renderListScreen,
    renderProductGrid,
    resetFilters,
    updateHeaderAuthUI
  };
})();
