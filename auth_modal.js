/**
 * 감자 마켓 (Gamza) - 로그인 & 회원가입 모달 모듈 (auth_modal.js)
 * Supabase Auth 연동 및 필수 닉네임 처리
 */

(function () {
  'use strict';

  let isInitialized = false;
  let activeTab = 'login'; // 'login' | 'signup'
  let authSuccessCallback = null;
  let currentOpenReason = null;

  // 친절한 한국어 에러 메시지 매핑
  function getFriendlyErrorMessage(err) {
    if (!err) return '오류가 발생했습니다. 다시 시도해 주세요.';
    const msg = String(err.message || err);

    if (msg.includes('Invalid login credentials')) {
      return '이메일 또는 비밀번호가 일치하지 않습니다.';
    }
    if (msg.includes('User already registered')) {
      return '이미 가입된 이메일 주소입니다. 로그인해 보세요.';
    }
    if (msg.includes('Email not confirmed')) {
      return '이메일 인증이 아직 완료되지 않았습니다. 메일함을 확인해 주세요.';
    }
    if (msg.includes('Password should be at least')) {
      return '비밀번호는 최소 6자 이상이어야 합니다.';
    }
    if (msg.includes('Unable to validate email address: invalid format')) {
      return '올바른 이메일 형식을 입력해 주세요.';
    }
    if (msg.includes('rate limit')) {
      return '요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.';
    }
    return msg;
  }

  // 모달 HTML 생성 및 body에 마운트
  function createModalDOM() {
    if (document.getElementById('gamza-auth-modal')) return;

    const modalHTML = `
      <div id="gamza-auth-modal" class="gamza-auth-overlay" aria-hidden="true" role="dialog" aria-modal="true" aria-labelledby="auth-modal-title">
        <div class="gamza-auth-card">
          <button type="button" class="auth-close-btn" id="auth-modal-close" aria-label="모달 닫기">✕</button>

          <div class="auth-header">
            <span class="auth-logo-badge">🥔</span>
            <h2 id="auth-modal-title">감자 마켓 시작하기</h2>
            <p class="auth-modal-desc" id="auth-modal-desc">포근한 우리 동네 이웃과 따뜻한 거래를 시작해보세요</p>
          </div>

          <!-- 탭 버튼 (로그인 / 회원가입) -->
          <div class="auth-tab-group" role="tablist">
            <button type="button" class="auth-tab-btn active" id="tab-btn-login" role="tab" aria-selected="true">로그인</button>
            <button type="button" class="auth-tab-btn" id="tab-btn-signup" role="tab" aria-selected="false">회원가입</button>
          </div>

          <!-- 로그인 폼 -->
          <form id="form-login" class="auth-form" novalidate>
            <div class="form-group">
              <label for="login-email">이메일 주소</label>
              <input
                type="email"
                id="login-email"
                name="email"
                placeholder="example@gamza.com"
                autocomplete="email"
                required
              />
            </div>
            <div class="form-group">
              <label for="login-password">비밀번호</label>
              <input
                type="password"
                id="login-password"
                name="password"
                placeholder="비밀번호를 입력해 주세요"
                autocomplete="current-password"
                required
              />
            </div>

            <div class="auth-message-box" id="login-msg-box" style="display: none;"></div>

            <button type="submit" class="btn-auth-submit" id="btn-login-submit">
              <span>로그인</span>
            </button>

            <div class="auth-footer-switch">
              <span>아직 감자 마켓 회원이 아니신가요?</span>
              <button type="button" class="link-btn" id="switch-to-signup">회원가입하기</button>
            </div>
          </form>

          <!-- 회원가입 폼 -->
          <form id="form-signup" class="auth-form" style="display: none;" novalidate>
            <div class="form-group">
              <label for="signup-nickname">
                닉네임 <span class="required-badge">* 필수</span>
              </label>
              <input
                type="text"
                id="signup-nickname"
                name="nickname"
                placeholder="예: 포슬포슬감자 (2~12자)"
                maxlength="12"
                autocomplete="nickname"
                required
              />
              <span class="field-tip">동네 이웃들이 부를 귀여운 닉네임을 적어주세요.</span>
            </div>

            <div class="form-group">
              <label for="signup-email">
                이메일 주소 <span class="required-badge">* 필수</span>
              </label>
              <input
                type="email"
                id="signup-email"
                name="email"
                placeholder="example@gamza.com"
                autocomplete="email"
                required
              />
            </div>

            <div class="form-group">
              <label for="signup-password">
                비밀번호 <span class="required-badge">* 필수</span>
              </label>
              <input
                type="password"
                id="signup-password"
                name="password"
                placeholder="6자리 이상 입력해 주세요"
                autocomplete="new-password"
                minlength="6"
                required
              />
            </div>

            <div class="form-group">
              <label for="signup-password-confirm">
                비밀번호 확인 <span class="required-badge">* 필수</span>
              </label>
              <input
                type="password"
                id="signup-password-confirm"
                name="passwordConfirm"
                placeholder="비밀번호를 다시 한 번 입력해 주세요"
                autocomplete="new-password"
                required
              />
            </div>

            <div class="auth-message-box" id="signup-msg-box" style="display: none;"></div>

            <button type="submit" class="btn-auth-submit" id="btn-signup-submit">
              <span>감자 마켓 가입하기</span>
            </button>

            <div class="auth-footer-switch">
              <span>이미 계정이 있으신가요?</span>
              <button type="button" class="link-btn" id="switch-to-login">로그인하기</button>
            </div>
          </form>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
  }

  // 메시지 박스 표시 헬퍼
  function showMessageBox(boxId, text, type = 'error') {
    const box = document.getElementById(boxId);
    if (!box) return;
    box.textContent = text;
    box.className = `auth-message-box ${type}`;
    box.style.display = 'flex';
  }

  function hideMessageBox(boxId) {
    const box = document.getElementById(boxId);
    if (!box) return;
    box.textContent = '';
    box.style.display = 'none';
  }

  // 탭 전환
  function setTab(mode) {
    activeTab = mode;
    const tabLoginBtn = document.getElementById('tab-btn-login');
    const tabSignupBtn = document.getElementById('tab-btn-signup');
    const formLogin = document.getElementById('form-login');
    const formSignup = document.getElementById('form-signup');
    const titleEl = document.getElementById('auth-modal-title');
    const descEl = document.getElementById('auth-modal-desc');

    hideMessageBox('login-msg-box');
    hideMessageBox('signup-msg-box');

    if (mode === 'signup') {
      if (tabLoginBtn) {
        tabLoginBtn.classList.remove('active');
        tabLoginBtn.setAttribute('aria-selected', 'false');
      }
      if (tabSignupBtn) {
        tabSignupBtn.classList.add('active');
        tabSignupBtn.setAttribute('aria-selected', 'true');
      }
      if (formLogin) formLogin.style.display = 'none';
      if (formSignup) formSignup.style.display = 'flex';
      if (titleEl) titleEl.textContent = '감자 마켓 회원가입';
      if (descEl) descEl.textContent = '닉네임과 이메일로 1분 만에 가입해 보세요';

      const nickInput = document.getElementById('signup-nickname');
      if (nickInput) setTimeout(() => nickInput.focus(), 50);
    } else {
      if (tabLoginBtn) {
        tabLoginBtn.classList.add('active');
        tabLoginBtn.setAttribute('aria-selected', 'true');
      }
      if (tabSignupBtn) {
        tabSignupBtn.classList.remove('active');
        tabSignupBtn.setAttribute('aria-selected', 'false');
      }
      if (formLogin) formLogin.style.display = 'flex';
      if (formSignup) formSignup.style.display = 'none';
      if (titleEl) titleEl.textContent = '감자 마켓 로그인';
      if (descEl) descEl.textContent = '포근한 우리 동네 이웃과 따뜻한 거래를 시작해보세요';

      const emailInput = document.getElementById('login-email');
      if (emailInput) setTimeout(() => emailInput.focus(), 50);
    }
  }

  // 모달 열기
  function openAuthModal(mode = 'login', options = {}) {
    createModalDOM();
    const modalEl = document.getElementById('gamza-auth-modal');
    if (!modalEl) return;

    currentOpenReason = (options && options.reason) || null;
    setTab(mode);

    if (currentOpenReason === 'write') {
      const descEl = document.getElementById('auth-modal-desc');
      if (descEl) {
        descEl.textContent = '🥔 감자 매물을 등록하려면 먼저 로그인해 주세요!';
      }
    }

    modalEl.classList.add('is-open');
    modalEl.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  // 모달 닫기
  function closeAuthModal() {
    const modalEl = document.getElementById('gamza-auth-modal');
    if (!modalEl) return;

    modalEl.classList.remove('is-open');
    modalEl.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    currentOpenReason = null;

    // 입력 필드 및 메시지 초기화
    hideMessageBox('login-msg-box');
    hideMessageBox('signup-msg-box');
    const loginForm = document.getElementById('form-login');
    const signupForm = document.getElementById('form-signup');
    if (loginForm) loginForm.reset();
    if (signupForm) signupForm.reset();
  }

  // 로그인 폼 처리
  async function handleLoginSubmit(e) {
    e.preventDefault();
    hideMessageBox('login-msg-box');

    const emailInput = document.getElementById('login-email');
    const pwInput = document.getElementById('login-password');
    const submitBtn = document.getElementById('btn-login-submit');

    const email = (emailInput?.value || '').trim();
    const password = pwInput?.value || '';

    if (!email) {
      showMessageBox('login-msg-box', '이메일 주소를 입력해 주세요.');
      emailInput?.focus();
      return;
    }

    if (!password) {
      showMessageBox('login-msg-box', '비밀번호를 입력해 주세요.');
      pwInput?.focus();
      return;
    }

    if (!window.GamzaSupabase || typeof window.GamzaSupabase.signIn !== 'function') {
      showMessageBox('login-msg-box', '수퍼베이스 인증 모듈을 불러올 수 없습니다.');
      return;
    }

    try {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span>로그인 중...</span>';

      const res = await window.GamzaSupabase.signIn({ email, password });
      const profile = await window.GamzaSupabase.getActiveProfile();

      closeAuthModal();

      if (window.Screen1List && typeof window.Screen1List.showToast === 'function') {
        window.Screen1List.showToast(`🥔 반갑습니다, ${profile.nickname}님!`);
      }

      if (typeof authSuccessCallback === 'function') {
        authSuccessCallback(profile, res);
      }
    } catch (err) {
      console.error('로그인 에러:', err);
      showMessageBox('login-msg-box', getFriendlyErrorMessage(err));
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>로그인</span>';
      }
    }
  }

  // 회원가입 폼 처리 (닉네임 필수!)
  async function handleSignupSubmit(e) {
    e.preventDefault();
    hideMessageBox('signup-msg-box');

    const nickInput = document.getElementById('signup-nickname');
    const emailInput = document.getElementById('signup-email');
    const pwInput = document.getElementById('signup-password');
    const pwConfirmInput = document.getElementById('signup-password-confirm');
    const submitBtn = document.getElementById('btn-signup-submit');

    const nickname = (nickInput?.value || '').trim();
    const email = (emailInput?.value || '').trim();
    const password = pwInput?.value || '';
    const passwordConfirm = pwConfirmInput?.value || '';

    // 1. 필수 닉네임 검증
    if (!nickname) {
      showMessageBox('signup-msg-box', '닉네임은 필수 항목입니다. 닉네임을 입력해 주세요.');
      nickInput?.focus();
      return;
    }

    if (nickname.length < 2) {
      showMessageBox('signup-msg-box', '닉네임은 최소 2자 이상 입력해 주세요.');
      nickInput?.focus();
      return;
    }

    if (nickname.length > 12) {
      showMessageBox('signup-msg-box', '닉네임은 최대 12자까지 입력할 수 있습니다.');
      nickInput?.focus();
      return;
    }

    // 2. 이메일 검증
    if (!email) {
      showMessageBox('signup-msg-box', '이메일 주소를 입력해 주세요.');
      emailInput?.focus();
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showMessageBox('signup-msg-box', '유효한 이메일 주소 형식이 아닙니다.');
      emailInput?.focus();
      return;
    }

    // 3. 비밀번호 검증
    if (!password) {
      showMessageBox('signup-msg-box', '비밀번호를 입력해 주세요.');
      pwInput?.focus();
      return;
    }

    if (password.length < 6) {
      showMessageBox('signup-msg-box', '비밀번호는 최소 6자 이상이어야 합니다.');
      pwInput?.focus();
      return;
    }

    // 4. 비밀번호 확인 일치 검증
    if (password !== passwordConfirm) {
      showMessageBox('signup-msg-box', '비밀번호 확인이 일치하지 않습니다.');
      pwConfirmInput?.focus();
      return;
    }

    if (!window.GamzaSupabase || typeof window.GamzaSupabase.signUp !== 'function') {
      showMessageBox('signup-msg-box', '수퍼베이스 인증 모듈을 불러올 수 없습니다.');
      return;
    }

    try {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span>회원가입 처리 중...</span>';

      const data = await window.GamzaSupabase.signUp({
        email,
        password,
        nickname
      });

      // 가입 성공 후 세션이 바로 연결되었는지 확인
      if (data && data.session) {
        const profile = await window.GamzaSupabase.getActiveProfile();
        closeAuthModal();

        if (window.Screen1List && typeof window.Screen1List.showToast === 'function') {
          window.Screen1List.showToast(`🥔 가입을 축하드려요, ${profile.nickname}님!`);
        }

        if (typeof authSuccessCallback === 'function') {
          authSuccessCallback(profile, data);
        }
      } else {
        // 이메일 인증 링크 확인이 필요한 프로젝트 설정일 경우
        showMessageBox(
          'signup-msg-box',
          '회원가입 요청이 완료되었습니다! 가입 인증 이메일을 확인한 뒤 로그인해 주세요.',
          'success'
        );
        setTimeout(() => {
          setTab('login');
          const loginEmailInput = document.getElementById('login-email');
          if (loginEmailInput) loginEmailInput.value = email;
        }, 2200);
      }
    } catch (err) {
      console.error('회원가입 에러:', err);
      showMessageBox('signup-msg-box', getFriendlyErrorMessage(err));
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>감자 마켓 가입하기</span>';
      }
    }
  }

  // 모달 이벤트 초기화
  function initAuthModal(options = {}) {
    createModalDOM();

    if (options.onAuthSuccess) {
      authSuccessCallback = options.onAuthSuccess;
    }

    if (isInitialized) return;
    isInitialized = true;

    const overlay = document.getElementById('gamza-auth-modal');
    const closeBtn = document.getElementById('auth-modal-close');
    const tabLogin = document.getElementById('tab-btn-login');
    const tabSignup = document.getElementById('tab-btn-signup');
    const switchToSignup = document.getElementById('switch-to-signup');
    const switchToLogin = document.getElementById('switch-to-login');
    const formLogin = document.getElementById('form-login');
    const formSignup = document.getElementById('form-signup');

    // 닫기 버튼
    if (closeBtn) {
      closeBtn.addEventListener('click', closeAuthModal);
    }

    // 모달 배경 클릭 시 닫기
    if (overlay) {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          closeAuthModal();
        }
      });
    }

    // ESC 키로 닫기
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlay && overlay.classList.contains('is-open')) {
        closeAuthModal();
      }
    });

    // 탭 전환 버튼
    if (tabLogin) tabLogin.addEventListener('click', () => setTab('login'));
    if (tabSignup) tabSignup.addEventListener('click', () => setTab('signup'));
    if (switchToSignup) switchToSignup.addEventListener('click', () => setTab('signup'));
    if (switchToLogin) switchToLogin.addEventListener('click', () => setTab('login'));

    // 폼 서브밋
    if (formLogin) formLogin.addEventListener('submit', handleLoginSubmit);
    if (formSignup) formSignup.addEventListener('submit', handleSignupSubmit);
  }

  window.GamzaAuthModal = {
    init: initAuthModal,
    open: openAuthModal,
    close: closeAuthModal,
    setTab: setTab
  };
})();
