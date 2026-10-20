/**
 * [화면 2: 상세 팝업 (Detail Modal)] - 감자(Gamza) 중고 거래 서비스
 * window.Screen2Detail = { initDetailModal, openDetailModal(product), closeDetailModal() }
 */

(function () {
  'use strict';

  let modalOverlayEl = null;
  let currentProduct = null;
  let toastTimer = null;
  const wishedProductIds = new Set();

  // 기본 폴백 아바타 및 상품 이미지 (SVG Data URI)
  const DEFAULT_AVATAR =
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">
        <rect width="80" height="80" fill="#EFE6DD"/>
        <circle cx="40" cy="30" r="14" fill="#8D5B4C"/>
        <path d="M16 68c0-13.255 10.745-24 24-24s24 10.745 24 24" fill="#8D5B4C"/>
      </svg>`
    );

  const DEFAULT_PRODUCT_IMAGE =
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400">
        <rect width="600" height="400" fill="#F4EFE6"/>
        <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#8D5B4C" font-family="Pretendard, sans-serif" font-size="24" font-weight="700">🥔 감자 마켓 상품 이미지</text>
      </svg>`
    );

  /**
   * 가격 포맷 헬퍼 (예: 45000 -> "45,000원")
   */
  function formatPrice(price) {
    if (price === undefined || price === null || price === '') {
      return '가격 미정';
    }
    if (typeof price === 'number') {
      return price === 0 ? '나눔 🥔' : price.toLocaleString('ko-KR') + '원';
    }
    const rawStr = String(price).trim();
    if (rawStr === '0' || rawStr === '0원' || rawStr === '무료나눔') {
      return '나눔 🥔';
    }
    const numericOnly = rawStr.replace(/[^0-9]/g, '');
    if (numericOnly && !isNaN(Number(numericOnly))) {
      return Number(numericOnly).toLocaleString('ko-KR') + '원';
    }
    return rawStr.endsWith('원') ? rawStr : rawStr + '원';
  }

  /**
   * 판매 상태 정규화 및 배지 클래스 반환
   * - 판매중: 배경 #E6F4EA, 글자 #1E7E34
   * - 예약중: 배경 #FEF3C7, 글자 #D97706
   * - 거래 완료: 배경 #E5E7EB, 글자 #6B7280
   */
  function getStatusMeta(status) {
    const raw = (status || '판매중').trim();
    if (raw === '예약중' || raw.toLowerCase() === 'reserved') {
      return { label: '예약중', className: 'status-reserved' };
    }
    if (
      raw === '거래 완료' ||
      raw === '거래완료' ||
      raw === '판매완료' ||
      raw === '판매 완료' ||
      raw.toLowerCase() === 'completed' ||
      raw.toLowerCase() === 'sold'
    ) {
      return { label: '거래 완료', className: 'status-done' };
    }
    return { label: '판매중', className: 'status-sale' };
  }

  /**
   * 모달 DOM 생성 및 이벤트 바인딩
   */
  function initDetailModal() {
    let existing = document.getElementById('detail-modal-overlay');
    if (existing) {
      modalOverlayEl = existing;
      return modalOverlayEl;
    }

    modalOverlayEl = document.createElement('div');
    modalOverlayEl.id = 'detail-modal-overlay';
    modalOverlayEl.setAttribute('role', 'dialog');
    modalOverlayEl.setAttribute('aria-modal', 'true');
    modalOverlayEl.setAttribute('aria-labelledby', 'detail-modal-title');

    modalOverlayEl.innerHTML = `
      <div class="detail-modal-container">
        <button type="button" id="btn-close-detail" aria-label="상세 창 닫기" title="닫기 (ESC)">✕</button>

        <div class="detail-scroll-area" id="detail-scroll-area">
          <!-- 1. 위쪽 절반: 상품 이미지 섹션 -->
          <div class="detail-image-section">
            <img id="detail-product-image" src="${DEFAULT_PRODUCT_IMAGE}" alt="상품 이미지" />
          </div>

          <div class="detail-body-content">
            <!-- 2. 상품 상세 정보 (위쪽 절반 이미지 바로 아래: 판매 상태, 카테고리, 상품명, 판매 위치, 업로드 시간, 가격, 상품 설명 순서 엄수) -->
            <div class="detail-info-section">
              <!-- (1) 판매 상태 + (2) 카테고리 배지 -->
              <div class="detail-badges-row">
                <span id="detail-status-badge" class="detail-status-badge status-sale">판매중</span>
                <span id="detail-category-badge" class="detail-category-badge">기타 중고물품</span>
              </div>

              <!-- [내가 쓴 글인 경우 전용] 판매 상태 즉시 변경 버튼 그룹 -->
              <div class="detail-status-manage-bar" id="detail-status-manage-bar" style="display: none;">
                <span class="status-manage-label">🏷️ 판매 상태 선택:</span>
                <div class="status-manage-btn-group" role="group" aria-label="판매 상태 선택">
                  <button type="button" class="btn-status-toggle" data-status="판매중">판매중</button>
                  <button type="button" class="btn-status-toggle" data-status="예약중">예약중</button>
                  <button type="button" class="btn-status-toggle" data-status="거래 완료">거래 완료</button>
                </div>
              </div>

              <!-- (3) 상품명 (.detail-title) -->
              <h2 id="detail-modal-title" class="detail-title">상품명이 표시됩니다</h2>

              <!-- (4) 판매 위치 & (5) 업로드 시간 (.detail-meta) -->
              <div class="detail-meta">
                <span id="detail-meta-location" class="detail-meta-item">📍 위치 미지정</span>
                <span class="detail-meta-divider">·</span>
                <span id="detail-meta-time" class="detail-meta-item">방금 전</span>
              </div>

              <!-- (6) 가격 (.detail-price) -->
              <div id="detail-product-price" class="detail-price">0원</div>

              <!-- (7) 상품 설명 (.detail-description) -->
              <p id="detail-product-description" class="detail-description"></p>
            </div>

            <!-- 3. 판매자 정보 카드 (.detail-seller-box: 닉네임, 프로필 이미지, 판매 지역) -->
            <div class="detail-seller-box">
              <div class="detail-seller-left">
                <img id="detail-seller-avatar" class="detail-seller-avatar" src="${DEFAULT_AVATAR}" alt="판매자 프로필" />
                <div class="detail-seller-info">
                  <span id="detail-seller-nickname" class="detail-seller-nickname">감자농부</span>
                  <span id="detail-seller-region" class="detail-seller-region">📍 지역 정보 없음</span>
                </div>
              </div>
              <span class="detail-seller-badge">🥔 포슬포슬 판매자</span>
            </div>
          </div>
        </div>

        <!-- 토스트 알림 -->
        <div id="detail-toast" class="detail-toast" role="status" aria-live="polite"></div>

        <!-- 4. 맨 아래 하단 고정 액션 바 (.detail-footer-actions) -->
        <div class="detail-footer-actions">
          <!-- (1) 일반 구매자 액션 (관심 추가 + 채팅 시작) -->
          <div class="footer-actions-buyer" id="footer-actions-buyer">
            <button type="button" id="btn-wish" aria-pressed="false">
              <span class="wish-icon" id="detail-wish-icon">🤍</span>
              <span id="detail-wish-label">관심 추가</span>
            </button>
            <button type="button" id="btn-chat">
              <span>💬 채팅 시작하기</span>
            </button>
          </div>

          <!-- (2) 작성자(본인) 전용 액션 (수정 + 삭제) -->
          <div class="footer-actions-seller" id="footer-actions-seller" style="display: none;">
            <button type="button" class="btn-seller-manage btn-edit-post" id="btn-edit-post">
              <span>✏️ 게시글 수정</span>
            </button>
            <button type="button" class="btn-seller-manage btn-delete-post" id="btn-delete-post">
              <span>🗑️ 삭제하기</span>
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modalOverlayEl);

    // 닫기 버튼 이벤트
    const closeBtn = modalOverlayEl.querySelector('#btn-close-detail');
    closeBtn.addEventListener('click', closeDetailModal);

    // 배경(오버레이) 클릭 시 닫기
    modalOverlayEl.addEventListener('click', function (e) {
      if (e.target === modalOverlayEl) {
        closeDetailModal();
      }
    });

    // ESC 키로 닫기
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && modalOverlayEl && modalOverlayEl.classList.contains('is-open')) {
        closeDetailModal();
      }
    });

    // [상태 변경] 버튼 클릭 이벤트 (판매중 / 예약중 / 거래 완료)
    const statusToggles = modalOverlayEl.querySelectorAll('.btn-status-toggle');
    statusToggles.forEach((btn) => {
      btn.addEventListener('click', async function () {
        if (!currentProduct) return;
        const newStatus = btn.getAttribute('data-status');
        if (!newStatus || currentProduct.status === newStatus) return;

        const oldStatus = currentProduct.status;
        currentProduct.status = newStatus;

        // 상세 모달 상태 배지 & 토글 버튼 UI 갱신
        updateModalStatusBadge(newStatus);
        statusToggles.forEach((b) => {
          b.classList.toggle('is-active', b.getAttribute('data-status') === newStatus);
        });

        // 전역 상품 목록 배열 동기화
        if (Array.isArray(window.gamzaProducts)) {
          const found = window.gamzaProducts.find((p) => String(p.id) === String(currentProduct.id));
          if (found) {
            found.status = newStatus;
          }
        }

        // 화면 1 목록 그리드 갱신
        if (window.Screen1List && typeof window.Screen1List.renderProductGrid === 'function') {
          window.Screen1List.renderProductGrid(window.gamzaProducts);
        }

        showToast(`🥔 판매 상태를 '${newStatus}'(으)로 변경했어요!`);

        // Supabase DB에 UPDATE
        if (window.GamzaSupabase && typeof window.GamzaSupabase.updateProductStatus === 'function') {
          try {
            await window.GamzaSupabase.updateProductStatus(currentProduct.id, newStatus);
          } catch (err) {
            console.error('상태 변경 DB 저장 오류:', err);
            // 롤백
            currentProduct.status = oldStatus;
            updateModalStatusBadge(oldStatus);
            statusToggles.forEach((b) => {
              b.classList.toggle('is-active', b.getAttribute('data-status') === oldStatus);
            });
            showToast('⚠️ 상태 변경을 DB에 반영하지 못했습니다.');
          }
        }
      });
    });

    // [게시글 수정] 버튼 클릭 이벤트
    const editBtn = modalOverlayEl.querySelector('#btn-edit-post');
    if (editBtn) {
      editBtn.addEventListener('click', function () {
        if (!currentProduct) return;
        const targetToEdit = { ...currentProduct };
        closeDetailModal();
        if (typeof window.onEditProduct === 'function') {
          window.onEditProduct(targetToEdit);
        }
      });
    }

    // [게시글 삭제] 버튼 클릭 이벤트
    const deleteBtn = modalOverlayEl.querySelector('#btn-delete-post');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', async function () {
        if (!currentProduct) return;
        const targetId = currentProduct.id;
        const confirmed = window.confirm(
          '정말 이 감자 매물을 삭제하시겠습니까?\n삭제된 매물은 복구할 수 없습니다.'
        );
        if (!confirmed) return;

        try {
          if (window.GamzaSupabase && typeof window.GamzaSupabase.deleteProduct === 'function') {
            await window.GamzaSupabase.deleteProduct(targetId);
          }

          // 전역 목록에서 제거
          if (Array.isArray(window.gamzaProducts)) {
            window.gamzaProducts = window.gamzaProducts.filter((p) => String(p.id) !== String(targetId));
          }

          closeDetailModal();

          // 화면 1 목록 그리드 갱신
          if (window.Screen1List && typeof window.Screen1List.renderProductGrid === 'function') {
            window.Screen1List.renderProductGrid(window.gamzaProducts);
          }

          if (window.Screen1List && typeof window.Screen1List.showToast === 'function') {
            window.Screen1List.showToast('🥔 게시글이 안전하게 삭제되었습니다.');
          }
        } catch (err) {
          console.error('게시글 삭제 오류:', err);
          showToast('⚠️ 게시글 삭제에 실패했습니다.');
        }
      });
    }

    // [관심 추가] 버튼 클릭 이벤트 (Supabase wishlists 연동)
    const wishBtn = modalOverlayEl.querySelector('#btn-wish');
    wishBtn.addEventListener('click', async function () {
      if (!currentProduct) return;
      const pid = currentProduct.id || currentProduct.title || 'current';
      const wasWished = wishedProductIds.has(pid);

      // 낙관적 UI 업데이트
      if (wasWished) {
        wishedProductIds.delete(pid);
        updateWishButtonUI(false);
        showToast('관심 목록에서 해제했어요.');
      } else {
        wishedProductIds.add(pid);
        updateWishButtonUI(true);
        showToast('❤️ 관심 상품에 추가했어요!');
      }

      // Supabase wishlists DB 동기화
      if (window.GamzaSupabase && typeof window.GamzaSupabase.toggleWishlist === 'function') {
        try {
          const nowWished = await window.GamzaSupabase.toggleWishlist(pid);
          if (nowWished) {
            wishedProductIds.add(pid);
            updateWishButtonUI(true);
          } else {
            wishedProductIds.delete(pid);
            updateWishButtonUI(false);
          }
        } catch (err) {
          console.warn('찜 DB 연동 실패:', err);
        }
      }
    });

    // [채팅 시작하기] 버튼 클릭 이벤트
    const chatBtn = modalOverlayEl.querySelector('#btn-chat');
    chatBtn.addEventListener('click', function () {
      if (!currentProduct) return;
      const sellerName =
        (currentProduct.seller && currentProduct.seller.nickname) ||
        currentProduct.sellerNickname ||
        currentProduct.sellerName ||
        '판매자';
      showToast(`💬 [${sellerName}]님과의 채팅방 연결 준비 중입니다!`);
    });

    return modalOverlayEl;
  }

  /**
   * 관심 추가 버튼 UI 갱신
   */
  function updateWishButtonUI(isWished) {
    if (!modalOverlayEl) return;
    const wishBtn = modalOverlayEl.querySelector('#btn-wish');
    const wishIcon = modalOverlayEl.querySelector('#detail-wish-icon');
    const wishLabel = modalOverlayEl.querySelector('#detail-wish-label');

    if (isWished) {
      wishBtn.classList.add('is-wished');
      wishBtn.setAttribute('aria-pressed', 'true');
      wishIcon.textContent = '❤️';
      wishLabel.textContent = '관심 등록됨';
    } else {
      wishBtn.classList.remove('is-wished');
      wishBtn.setAttribute('aria-pressed', 'false');
      wishIcon.textContent = '🤍';
      wishLabel.textContent = '관심 추가';
    }
  }

  /**
   * 모달 내부 토스트 메시지 표시
   */
  function showToast(message) {
    if (!modalOverlayEl) return;
    const toastEl = modalOverlayEl.querySelector('#detail-toast');
    if (!toastEl) return;

    toastEl.textContent = message;
    toastEl.classList.add('show');

    if (toastTimer) {
      clearTimeout(toastTimer);
    }
    toastTimer = setTimeout(function () {
      toastEl.classList.remove('show');
    }, 2200);
  }

  /**
   * 모달 상단 상태 배지 업데이트 헬퍼
   */
  function updateModalStatusBadge(newStatus) {
    if (!modalOverlayEl) return;
    const badgeEl = modalOverlayEl.querySelector('#detail-status-badge');
    if (!badgeEl) return;
    const meta = getStatusMeta(newStatus);
    badgeEl.textContent = meta.label;
    badgeEl.className = `detail-status-badge ${meta.className}`;
  }

  /**
   * 상품 데이터를 받아 상세 모달 열기
   * @param {Object} product - 상품 객체
   */
  async function openDetailModal(product) {
    if (!product) return;
    initDetailModal();
    currentProduct = product;

    // 데이터 추출 (다양한 필드 네이밍 호환)
    const imageSrc = product.image || product.imageUrl || product.thumbnail || DEFAULT_PRODUCT_IMAGE;
    const title = product.title || product.name || '제목 없음';
    const category = product.category || '생활/가전';
    const statusInfo = getStatusMeta(product.status);
    const location =
      product.location ||
      product.region ||
      (product.seller && product.seller.region) ||
      '감자마을';
    const timeAgo = product.timeAgo || product.createdAt || product.time || '방금 전';
    const priceFormatted = formatPrice(product.price);
    const description =
      product.description ||
      product.content ||
      '상세 설명이 등록되지 않은 상품입니다. 채팅으로 문의해 보세요!';

    const sellerObj = product.seller || {};
    const sellerNickname =
      sellerObj.nickname ||
      sellerObj.name ||
      product.sellerNickname ||
      product.sellerName ||
      '포슬감자 이웃';
    const sellerAvatar =
      sellerObj.avatar ||
      sellerObj.profileImage ||
      product.sellerAvatar ||
      DEFAULT_AVATAR;
    const sellerRegion = sellerObj.region || location;

    // 1. 상품 이미지 반영
    const imgEl = modalOverlayEl.querySelector('#detail-product-image');
    imgEl.src = imageSrc;
    imgEl.alt = title;
    imgEl.onerror = function () {
      imgEl.onerror = null;
      imgEl.src = DEFAULT_PRODUCT_IMAGE;
    };

    // 2. 판매자 프로필 박스 반영
    const avatarEl = modalOverlayEl.querySelector('#detail-seller-avatar');
    avatarEl.src = sellerAvatar;
    avatarEl.alt = `${sellerNickname} 프로필`;
    avatarEl.onerror = function () {
      avatarEl.onerror = null;
      avatarEl.src = DEFAULT_AVATAR;
    };
    modalOverlayEl.querySelector('#detail-seller-nickname').textContent = sellerNickname;
    modalOverlayEl.querySelector('#detail-seller-region').textContent = `📍 ${sellerRegion}`;

    // 3. 상품 상세 정보 순서대로 반영
    // (1) 판매 상태 + 카테고리
    const statusBadgeEl = modalOverlayEl.querySelector('#detail-status-badge');
    statusBadgeEl.textContent = statusInfo.label;
    statusBadgeEl.className = `detail-status-badge ${statusInfo.className}`;

    const categoryBadgeEl = modalOverlayEl.querySelector('#detail-category-badge');
    categoryBadgeEl.textContent = category;

    // (2) 상품명
    modalOverlayEl.querySelector('#detail-modal-title').textContent = title;

    // (3) 판매 위치 & 업로드 시간
    modalOverlayEl.querySelector('#detail-meta-location').textContent = `📍 ${location}`;
    modalOverlayEl.querySelector('#detail-meta-time').textContent = `🕒 ${timeAgo}`;

    // (4) 가격
    modalOverlayEl.querySelector('#detail-product-price').textContent = priceFormatted;

    // (5) 상품 설명
    modalOverlayEl.querySelector('#detail-product-description').textContent = description;

    // [핵심] 내가 작성한 게시글인지 판별하여 버튼 그룹 전환
    let isMyPost = false;
    if (window.GamzaSupabase && typeof window.GamzaSupabase.getLoggedInProfile === 'function') {
      try {
        const loggedInUser = await window.GamzaSupabase.getLoggedInProfile();
        if (loggedInUser) {
          const postSellerId = product.seller_id || (product.seller && product.seller.id) || product.sellerId;
          const postSellerNickname = (product.seller && product.seller.nickname) || product.sellerNickname;

          if (
            (postSellerId && String(postSellerId) === String(loggedInUser.id)) ||
            (postSellerNickname && String(postSellerNickname) === String(loggedInUser.nickname))
          ) {
            isMyPost = true;
          }
        }
      } catch (err) {
        console.warn('작성자 판별 중 오류:', err);
      }
    }

    const manageBar = modalOverlayEl.querySelector('#detail-status-manage-bar');
    const buyerActions = modalOverlayEl.querySelector('#footer-actions-buyer');
    const sellerActions = modalOverlayEl.querySelector('#footer-actions-seller');

    if (isMyPost) {
      if (manageBar) manageBar.style.display = 'flex';
      if (buyerActions) buyerActions.style.display = 'none';
      if (sellerActions) sellerActions.style.display = 'flex';

      // 현재 판매 상태에 맞게 토글 버튼 활성화
      const statusToggles = modalOverlayEl.querySelectorAll('.btn-status-toggle');
      statusToggles.forEach((btn) => {
        const s = btn.getAttribute('data-status');
        btn.classList.toggle('is-active', s === statusInfo.label);
      });
    } else {
      if (manageBar) manageBar.style.display = 'none';
      if (buyerActions) buyerActions.style.display = 'flex';
      if (sellerActions) sellerActions.style.display = 'none';
    }

    // 관심 버튼 상태 복원
    const pid = product.id || product.title || 'current';
    const isWished = Boolean(product.isWished) || wishedProductIds.has(pid);
    if (isWished) wishedProductIds.add(pid);
    updateWishButtonUI(isWished);

    // 스크롤 최상단 초기화
    const scrollArea = modalOverlayEl.querySelector('#detail-scroll-area');
    if (scrollArea) {
      scrollArea.scrollTop = 0;
    }

    // 모달 표시 및 배경 스크롤 잠금
    modalOverlayEl.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }

  /**
   * 상세 모달 닫기
   */
  function closeDetailModal() {
    if (!modalOverlayEl) return;
    modalOverlayEl.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  // DOM 로드 시 자동 초기화 지원
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDetailModal);
  } else {
    initDetailModal();
  }

  // 전역 모듈 노출
  window.Screen2Detail = {
    initDetailModal: initDetailModal,
    openDetailModal: openDetailModal,
    closeDetailModal: closeDetailModal,
    setWishedIds: function (idSet) {
      wishedProductIds.clear();
      if (idSet && typeof idSet.forEach === 'function') {
        idSet.forEach((id) => wishedProductIds.add(String(id)));
      }
    }
  };
})();
