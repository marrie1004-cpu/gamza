/**
 * 감자(Gamza) - [화면 3: 중고 물품 글쓰기] 모듈
 * window.Screen3Write = { initWriteScreen, openWriteScreen, closeWriteScreen }
 */

(function () {
  // 카테고리별 기본 샘플 이미지 & 감자 기본 일러스트 (파일 없이도 즉시 테스트 가능)
  const SAMPLE_IMAGES = [
    {
      label: '🥔 감자 기본 일러스트',
      url: "data:image/svg+xml;utf8," + encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
          <rect width="600" height="600" fill="#EFE6DD"/>
          <circle cx="300" cy="300" r="210" fill="#F4EFE6"/>
          <ellipse cx="300" cy="305" rx="145" ry="115" transform="rotate(-12 300 305)" fill="#D4A373" stroke="#8D5B4C" stroke-width="10"/>
          <circle cx="255" cy="285" r="10" fill="#2C221E"/>
          <circle cx="335" cy="270" r="10" fill="#2C221E"/>
          <path d="M275 320 Q300 342 325 315" fill="none" stroke="#2C221E" stroke-width="8" stroke-linecap="round"/>
          <circle cx="230" cy="305" r="12" fill="#E5989B" opacity="0.6"/>
          <circle cx="360" cy="290" r="12" fill="#E5989B" opacity="0.6"/>
          <circle cx="220" cy="240" r="5" fill="#8D5B4C" opacity="0.45"/>
          <circle cx="370" cy="340" r="6" fill="#8D5B4C" opacity="0.45"/>
          <text x="300" y="485" font-family="Pretendard, sans-serif" font-size="28" font-weight="bold" fill="#8D5B4C" text-anchor="middle">포근한 감자 마켓</text>
        </svg>`
      )
    },
    {
      label: '🎧 디지털기기 샘플',
      url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80'
    },
    {
      label: '🪑 가구/인테리어 샘플',
      url: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80'
    },
    {
      label: '🧥 의류/잡화 샘플',
      url: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=800&q=80'
    },
    {
      label: '☕ 생활가전 샘플',
      url: 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?auto=format&fit=crop&w=800&q=80'
    },
    {
      label: '📚 도서/티켓 샘플',
      url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=800&q=80'
    }
  ];

  const CATEGORIES = [
    '디지털기기',
    '가구/인테리어',
    '의류',
    '생활가전',
    '도서/티켓',
    '기타'
  ];

  const QUICK_LOCATIONS = [
    '강원도 춘천시 온의동',
    '강원도 강릉시 교동',
    '서울 마포구 연남동',
    '서울 성동구 성수동'
  ];

  let state = {
    containerEl: null,
    onAddProduct: null,
    onUpdateProduct: null,
    onCancel: null,
    editingProduct: null,
    currentImageData: SAMPLE_IMAGES[0].url
  };

  /**
   * 글쓰기 화면 HTML 렌더링
   */
  function renderWriteForm(container) {
    const sampleChipsHtml = SAMPLE_IMAGES.map(
      (item, idx) =>
        `<button type="button" class="btn-sample-img ${idx === 0 ? 'is-selected' : ''}" data-sample-idx="${idx}">
          ${item.label}
        </button>`
    ).join('');

    const categoryOptionsHtml = CATEGORIES.map(
      (cat) => `<option value="${cat}">${cat}</option>`
    ).join('');

    const locationChipsHtml = QUICK_LOCATIONS.map(
      (loc) =>
        `<button type="button" class="btn-location-chip" data-location="${loc}">📍 ${loc}</button>`
    ).join('');

    container.innerHTML = `
      <div class="write-header-bar">
        <button type="button" class="btn-back-list" id="gamzaBtnBackToList">
          <span>←</span>
          <span>목록으로 돌아가기</span>
        </button>
        <span class="write-header-badge">🥔 새 감자 등록하기</span>
      </div>

      <div class="write-card-container">
        <div class="write-title-box">
          <h2>내 물건 팔기</h2>
          <p>이웃과 따뜻하게 나눌 물건의 정보를 꼼꼼하게 입력해 주세요.</p>
        </div>

        <form id="gamzaWriteForm" class="write-form" novalidate>
          <!-- 1. 상품 이미지 -->
          <div class="write-field-group">
            <label class="write-label">
              <span class="write-label-left">1. 상품 이미지 <span class="required-dot">*</span></span>
              <span class="write-field-hint">사진이 없어도 기본 감자 이미지가 자동 적용됩니다</span>
            </label>
            <div class="image-upload-section">
              <div class="image-preview-box" id="gamzaImagePreviewBox" title="클릭하여 이미지 파일 선택">
                <img id="gamzaImagePreviewImg" src="${SAMPLE_IMAGES[0].url}" alt="상품 이미지 미리보기" />
              </div>
              <div class="image-controls-box">
                <div class="image-btn-row">
                  <label for="gamzaImageFileInput" class="btn-upload-file">
                    📷 내 기기에서 사진 올리기
                  </label>
                  <input type="file" id="gamzaImageFileInput" accept="image/*" style="display: none;" />
                </div>

                <input
                  type="url"
                  id="gamzaImageUrlInput"
                  class="write-input"
                  placeholder="또는 이미지 주소(URL)를 직접 붙여넣어 주세요"
                />

                <div class="sample-preset-group">
                  <span class="sample-preset-label">빠른 테스트용 샘플 이미지 선택:</span>
                  <div class="sample-preset-chips" id="gamzaSampleChipList">
                    ${sampleChipsHtml}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 2. 상품명 -->
          <div class="write-field-group">
            <label for="gamzaInputTitle" class="write-label">
              <span class="write-label-left">2. 상품명 <span class="required-dot">*</span></span>
              <span class="write-field-hint">최대 50자</span>
            </label>
            <input
              type="text"
              id="gamzaInputTitle"
              class="write-input"
              maxlength="50"
              placeholder="상품명을 입력해 주세요"
              required
            />
          </div>

          <!-- 3. 카테고리 & 4. 가격 -->
          <div class="write-row-2col">
            <div class="write-field-group">
              <label for="gamzaSelectCategory" class="write-label">
                <span class="write-label-left">3. 카테고리 <span class="required-dot">*</span></span>
              </label>
              <select id="gamzaSelectCategory" class="write-select" required>
                ${categoryOptionsHtml}
              </select>
            </div>

            <div class="write-field-group">
              <label for="gamzaInputPrice" class="write-label">
                <span class="write-label-left">4. 가격 <span class="required-dot">*</span></span>
                <span class="write-field-hint">0원 입력 시 나눔</span>
              </label>
              <div class="price-input-wrapper">
                <input
                  type="number"
                  id="gamzaInputPrice"
                  class="write-input"
                  min="0"
                  step="100"
                  placeholder="가격을 입력해 주세요 (원)"
                  required
                />
                <span class="price-unit-suffix">원</span>
              </div>
            </div>
          </div>

          <!-- 5. 자세한 설명 -->
          <div class="write-field-group">
            <label for="gamzaInputDescription" class="write-label">
              <span class="write-label-left">5. 자세한 설명 <span class="required-dot">*</span></span>
              <span class="write-field-hint" id="gamzaDescriptionCharCount">최대 500자 (0/500)</span>
            </label>
            <textarea
              id="gamzaInputDescription"
              class="write-textarea"
              maxlength="500"
              placeholder="이웃이 신뢰할 수 있도록 구매 시기, 브랜드/모델명, 제품의 상태(사용감, 흠집 유무 등)를 자세히 작성해 주세요."
              required
            ></textarea>
          </div>

          <!-- 6. 거래 동네 -->
          <div class="write-field-group">
            <label for="gamzaInputLocation" class="write-label">
              <span class="write-label-left">6. 거래 동네 <span class="required-dot">*</span></span>
              <span class="write-field-hint">직거래 희망 동네</span>
            </label>
            <input
              type="text"
              id="gamzaInputLocation"
              class="write-input"
              placeholder="예: 강원도 춘천시 온의동, 서울 마포구 연남동"
              required
            />
            <div class="location-quick-chips" id="gamzaLocationChipList">
              ${locationChipsHtml}
            </div>
          </div>

          <!-- 7. 판매 상태 -->
          <div class="write-field-group">
            <label class="write-label">
              <span class="write-label-left">7. 판매 상태 <span class="required-dot">*</span></span>
              <span class="write-field-hint">등록 시점의 상품 거래 상태를 선택해 주세요</span>
            </label>
            <div class="status-selector-grid">
              <label class="status-radio-option">
                <input type="radio" name="gamzaProductStatus" value="판매중" checked />
                <span class="status-radio-label">
                  <span class="status-dot"></span>
                  <span>판매중</span>
                </span>
              </label>

              <label class="status-radio-option">
                <input type="radio" name="gamzaProductStatus" value="예약중" />
                <span class="status-radio-label">
                  <span class="status-dot"></span>
                  <span>예약중</span>
                </span>
              </label>

              <label class="status-radio-option">
                <input type="radio" name="gamzaProductStatus" value="거래 완료" />
                <span class="status-radio-label">
                  <span class="status-dot"></span>
                  <span>거래 완료</span>
                </span>
              </label>
            </div>
          </div>

          <!-- 에러 알림 배너 -->
          <div id="gamzaWriteErrorBanner" class="write-error-banner" role="alert"></div>

          <!-- 하단 작성 완료 / 취소 버튼 -->
          <div class="write-submit-footer">
            <button type="button" class="btn-write-cancel" id="gamzaBtnCancelWrite">
              취소
            </button>
            <button type="submit" class="btn-write-submit" id="gamzaBtnSubmitWrite">
              🥔 작성 완료
            </button>
          </div>
        </form>
      </div>
    `;
  }

  /**
   * 이미지 미리보기 업데이트 헬퍼
   */
  function updateImagePreview(imageSrc) {
    const previewImg = document.getElementById('gamzaImagePreviewImg');
    const fallbackUrl = SAMPLE_IMAGES[0].url;
    state.currentImageData = imageSrc && imageSrc.trim() ? imageSrc.trim() : fallbackUrl;

    if (previewImg) {
      previewImg.src = state.currentImageData;
      previewImg.onerror = function () {
        state.currentImageData = fallbackUrl;
        previewImg.src = fallbackUrl;
      };
    }
  }

  /**
   * 폼 초기화
   */
  function resetWriteForm() {
    state.editingProduct = null;
    const form = document.getElementById('gamzaWriteForm');
    if (form) {
      form.reset();
    }
    const headerBadge = document.querySelector('.write-header-badge');
    if (headerBadge) {
      headerBadge.textContent = '🥔 새 감자 등록하기';
    }
    const titleBoxH2 = document.querySelector('.write-title-box h2');
    if (titleBoxH2) {
      titleBoxH2.textContent = '내 물건 팔기';
    }
    const submitBtn = document.getElementById('gamzaBtnSubmitWrite');
    if (submitBtn) {
      submitBtn.textContent = '🥔 작성 완료';
    }
    const descCharCount = document.getElementById('gamzaDescriptionCharCount');
    if (descCharCount) {
      descCharCount.textContent = '최대 500자 (0/500)';
    }
    const errorBanner = document.getElementById('gamzaWriteErrorBanner');
    if (errorBanner) {
      errorBanner.textContent = '';
      errorBanner.classList.remove('is-visible');
    }
    const sampleButtons = document.querySelectorAll('#gamzaSampleChipList .btn-sample-img');
    sampleButtons.forEach((btn, idx) => {
      btn.classList.toggle('is-selected', idx === 0);
    });
    updateImagePreview(SAMPLE_IMAGES[0].url);
  }

  /**
   * 에러 메시지 표시
   */
  function showValidationError(message, targetInput) {
    const errorBanner = document.getElementById('gamzaWriteErrorBanner');
    if (errorBanner) {
      errorBanner.textContent = `⚠️ ${message}`;
      errorBanner.classList.add('is-visible');
    }
    if (targetInput && typeof targetInput.focus === 'function') {
      targetInput.focus();
    }
  }

  /**
   * 이벤트 바인딩
   */
  function bindWriteEvents(container) {
    const form = container.querySelector('#gamzaWriteForm');
    const backBtn = container.querySelector('#gamzaBtnBackToList');
    const cancelBtn = container.querySelector('#gamzaBtnCancelWrite');
    const fileInput = container.querySelector('#gamzaImageFileInput');
    const urlInput = container.querySelector('#gamzaImageUrlInput');
    const previewBox = container.querySelector('#gamzaImagePreviewBox');
    const sampleChipList = container.querySelector('#gamzaSampleChipList');
    const locationChipList = container.querySelector('#gamzaLocationChipList');
    const locationInput = container.querySelector('#gamzaInputLocation');
    const descInputEl = container.querySelector('#gamzaInputDescription');
    const descCharCountEl = container.querySelector('#gamzaDescriptionCharCount');

    // 자세한 설명 최대 500자 제한 및 글자 수 표시
    if (descInputEl) {
      descInputEl.addEventListener('input', () => {
        if (descInputEl.value.length > 500) {
          descInputEl.value = descInputEl.value.slice(0, 500);
        }
        if (descCharCountEl) {
          descCharCountEl.textContent = `최대 500자 (${descInputEl.value.length}/500)`;
        }
      });
    }

    // 목록으로 돌아가기 / 취소 버튼
    const handleClose = () => {
      closeWriteScreen();
      if (typeof state.onCancel === 'function') {
        state.onCancel();
      }
    };

    if (backBtn) backBtn.addEventListener('click', handleClose);
    if (cancelBtn) cancelBtn.addEventListener('click', handleClose);

    // 미리보기 박스를 클릭해도 파일 선택 창 열기
    if (previewBox && fileInput) {
      previewBox.addEventListener('click', () => fileInput.click());
    }

    // 파일 업로드 시 DataURL로 미리보기 반영
    if (fileInput) {
      fileInput.addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function (evt) {
          if (evt.target && evt.target.result) {
            if (urlInput) urlInput.value = '';
            sampleChipList
              .querySelectorAll('.btn-sample-img')
              .forEach((btn) => btn.classList.remove('is-selected'));
            updateImagePreview(evt.target.result);
          }
        };
        reader.readAsDataURL(file);
      });
    }

    // 이미지 URL 직접 입력 시 실시간 미리보기 반영
    if (urlInput) {
      urlInput.addEventListener('input', (e) => {
        const val = e.target.value.trim();
        sampleChipList
          .querySelectorAll('.btn-sample-img')
          .forEach((btn) => btn.classList.remove('is-selected'));
        if (val) {
          updateImagePreview(val);
        } else {
          updateImagePreview(SAMPLE_IMAGES[0].url);
        }
      });
    }

    // 샘플 이미지 칩 클릭
    if (sampleChipList) {
      sampleChipList.addEventListener('click', (e) => {
        const btn = e.target.closest('.btn-sample-img');
        if (!btn) return;
        const idx = Number(btn.getAttribute('data-sample-idx'));
        const chosen = SAMPLE_IMAGES[idx] || SAMPLE_IMAGES[0];

        sampleChipList
          .querySelectorAll('.btn-sample-img')
          .forEach((b) => b.classList.remove('is-selected'));
        btn.classList.add('is-selected');

        if (urlInput) urlInput.value = '';
        if (fileInput) fileInput.value = '';
        updateImagePreview(chosen.url);
      });
    }

    // 거래 동네 빠른 입력 칩
    if (locationChipList && locationInput) {
      locationChipList.addEventListener('click', (e) => {
        const chip = e.target.closest('.btn-location-chip');
        if (!chip) return;
        locationInput.value = chip.getAttribute('data-location') || '';
        locationInput.focus();
      });
    }

    // 폼 제출 ([작성 완료])
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const titleInput = container.querySelector('#gamzaInputTitle');
        const categorySelect = container.querySelector('#gamzaSelectCategory');
        const priceInput = container.querySelector('#gamzaInputPrice');
        const descInput = container.querySelector('#gamzaInputDescription');
        const locInput = container.querySelector('#gamzaInputLocation');
        const statusChecked = container.querySelector('input[name="gamzaProductStatus"]:checked');

        const title = titleInput ? titleInput.value.trim() : '';
        const category = categorySelect ? categorySelect.value : '기타';
        const rawPrice = priceInput ? priceInput.value.trim() : '';
        const description = descInput ? descInput.value.trim() : '';
        const location = locInput ? locInput.value.trim() : '';
        const status = statusChecked ? statusChecked.value : '판매중';

        if (!title) {
          showValidationError('상품명을 입력해 주세요.', titleInput);
          return;
        }
        if (rawPrice === '' || isNaN(Number(rawPrice)) || Number(rawPrice) < 0) {
          showValidationError('올바른 가격(0원 이상 숫자)을 입력해 주세요.', priceInput);
          return;
        }
        if (!description) {
          showValidationError('상품에 대한 자세한 설명을 입력해 주세요.', descInput);
          return;
        }
        if (description.length > 500) {
          showValidationError('자세한 설명은 최대 500자까지 입력할 수 있습니다.', descInput);
          return;
        }
        if (!location) {
          showValidationError('거래할 동네를 입력해 주세요.', locInput);
          return;
        }

        const priceNumber = Math.floor(Number(rawPrice));
        const finalImage = state.currentImageData || SAMPLE_IMAGES[0].url;

        const defaultSellerAvatar =
          window.Screen1List && typeof window.Screen1List.createPotatoAvatar === 'function'
            ? window.Screen1List.createPotatoAvatar('#EFE6DD', '🥔')
            : SAMPLE_IMAGES[0].url;

        // 현재 로그인된 사용자의 실제 닉네임과 프로필 가져오기
        let sellerNickname = '감자이웃';
        let sellerAvatar = defaultSellerAvatar;
        let sellerRegion = location;

        if (window.GamzaSupabase && typeof window.GamzaSupabase.getActiveProfile === 'function') {
          try {
            const activeProf = await window.GamzaSupabase.getActiveProfile();
            if (activeProf && activeProf.nickname) {
              sellerNickname = activeProf.nickname;
              sellerAvatar = activeProf.avatar || defaultSellerAvatar;
              sellerRegion = activeProf.region || location;
            }
          } catch (err) {
            console.warn('글쓰기 프로필 조회 예외:', err);
          }
        }

        // 화면 1(목록)과 화면 2(상세)에서 호환성 있게 사용할 수 있도록 표준 필드를 모두 포함
        if (state.editingProduct) {
          const editTarget = state.editingProduct;
          const updatedProduct = {
            ...editTarget,
            title: title,
            category: category,
            price: priceNumber,
            description: description,
            location: location,
            status: status,
            image: finalImage,
            imageUrl: finalImage
          };

          resetWriteForm();
          closeWriteScreen();

          if (typeof state.onUpdateProduct === 'function') {
            state.onUpdateProduct(updatedProduct, editTarget);
          }
        } else {
          const newProduct = {
            id: Date.now(),
            title: title,
            category: category,
            price: priceNumber,
            description: description,
            location: location,
            timeAgo: '방금 전',
            createdAt: '방금 전',
            status: status, // '판매중' | '예약중' | '거래 완료'
            image: finalImage,
            imageUrl: finalImage,
            sellerNickname: sellerNickname,
            seller: {
              nickname: sellerNickname,
              avatar: sellerAvatar,
              region: sellerRegion
            },
            likes: 0,
            chats: 0,
            views: 1
          };

          resetWriteForm();
          closeWriteScreen();

          if (typeof state.onAddProduct === 'function') {
            state.onAddProduct(newProduct);
          }
        }
      });
    }
  }

  /**
   * 글쓰기 화면 초기화
   * @param {Object} options
   * @param {string|HTMLElement} [options.containerId='screen-write'] 렌더링할 컨테이너 ID 또는 DOM 요소
   * @param {Function} [options.onAddProduct] 새 상품 등록 시 호출될 콜백 함수 `onAddProduct(newProduct)`
   * @param {Function} [options.onCancel] 목록으로 돌아가기/취소 클릭 시 호출될 콜백 함수
   */
  function initWriteScreen(options = {}) {
    const target =
      typeof options.container === 'object' && options.container !== null
        ? options.container
        : document.getElementById(options.containerId || 'screen-write') ||
          document.getElementById('write-screen');

    if (!target) {
      console.warn('[Screen3Write] 글쓰기 화면을 마운트할 컨테이너 요소를 찾지 못했습니다.');
      return;
    }

    state.containerEl = target;
    if (typeof options.onAddProduct === 'function') {
      state.onAddProduct = options.onAddProduct;
    }
    if (typeof options.onUpdateProduct === 'function') {
      state.onUpdateProduct = options.onUpdateProduct;
    }
    if (typeof options.onCancel === 'function') {
      state.onCancel = options.onCancel;
    }

    target.classList.add('gamza-write-screen');
    renderWriteForm(target);
    bindWriteEvents(target);
  }

  /**
   * 글쓰기 화면 열기 (신규 등록 모드)
   */
  function openWriteScreen(options = {}) {
    if (!state.containerEl) {
      initWriteScreen(options);
    }
    if (options && typeof options.onAddProduct === 'function') {
      state.onAddProduct = options.onAddProduct;
    }
    if (options && typeof options.onUpdateProduct === 'function') {
      state.onUpdateProduct = options.onUpdateProduct;
    }
    if (options && typeof options.onCancel === 'function') {
      state.onCancel = options.onCancel;
    }

    if (state.containerEl) {
      resetWriteForm();
      state.containerEl.style.display = 'block';
      state.containerEl.classList.add('is-active');
      window.scrollTo({ top: 0, behavior: 'smooth' });

      const firstInput = state.containerEl.querySelector('#gamzaInputTitle');
      if (firstInput) {
        setTimeout(() => firstInput.focus(), 80);
      }
    }
  }

  /**
   * 글 수정 화면 열기 (기존 상품 데이터 로드 모드)
   */
  function openEditScreen(productToEdit, options = {}) {
    if (!state.containerEl) {
      initWriteScreen(options);
    }
    if (options && typeof options.onUpdateProduct === 'function') {
      state.onUpdateProduct = options.onUpdateProduct;
    }
    if (options && typeof options.onCancel === 'function') {
      state.onCancel = options.onCancel;
    }

    if (!state.containerEl || !productToEdit) return;

    resetWriteForm();
    state.editingProduct = productToEdit;

    // UI 헤더 및 버튼 텍스트 변경
    const headerBadge = state.containerEl.querySelector('.write-header-badge');
    if (headerBadge) {
      headerBadge.textContent = '🥔 감자 매물 수정하기';
    }
    const titleBoxH2 = state.containerEl.querySelector('.write-title-box h2');
    if (titleBoxH2) {
      titleBoxH2.textContent = '내 물건 수정하기';
    }
    const submitBtn = state.containerEl.querySelector('#gamzaBtnSubmitWrite');
    if (submitBtn) {
      submitBtn.textContent = '🥔 수정 완료';
    }

    // 기존 데이터 채우기
    const titleInput = state.containerEl.querySelector('#gamzaInputTitle');
    const categorySelect = state.containerEl.querySelector('#gamzaSelectCategory');
    const priceInput = state.containerEl.querySelector('#gamzaInputPrice');
    const descInput = state.containerEl.querySelector('#gamzaInputDescription');
    const locInput = state.containerEl.querySelector('#gamzaInputLocation');

    if (titleInput) titleInput.value = productToEdit.title || '';
    if (categorySelect) categorySelect.value = productToEdit.category || '기타';
    if (priceInput) priceInput.value = productToEdit.price != null ? productToEdit.price : '';
    if (descInput) {
      descInput.value = productToEdit.description || '';
      const descCharCount = state.containerEl.querySelector('#gamzaDescriptionCharCount');
      if (descCharCount) {
        descCharCount.textContent = `최대 500자 (${descInput.value.length}/500)`;
      }
    }
    if (locInput) locInput.value = productToEdit.location || '';

    // 상태 라디오 선택
    const statusVal = productToEdit.status || '판매중';
    const statusRadio = state.containerEl.querySelector(`input[name="gamzaProductStatus"][value="${statusVal}"]`);
    if (statusRadio) {
      statusRadio.checked = true;
    }

    // 이미지 반영
    const imageSrc = productToEdit.image || productToEdit.imageUrl || SAMPLE_IMAGES[0].url;
    updateImagePreview(imageSrc);

    state.containerEl.style.display = 'block';
    state.containerEl.classList.add('is-active');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (titleInput) {
      setTimeout(() => titleInput.focus(), 80);
    }
  }

  /**
   * 글쓰기 화면 닫기
   */
  function closeWriteScreen() {
    if (state.containerEl) {
      state.containerEl.classList.remove('is-active');
      state.containerEl.style.display = 'none';
      state.editingProduct = null;
    }
  }

  // 전역 네임스페이스 노출
  window.Screen3Write = {
    initWriteScreen,
    openWriteScreen,
    openEditScreen,
    closeWriteScreen,
    SAMPLE_IMAGES,
    CATEGORIES
  };
})();
