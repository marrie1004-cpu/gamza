/**
 * 감자(Gamza) 중고 거래 웹 서비스 - 통합 메인 컨트롤러 (app.js)
 * Supabase DB와 연동하여 실시간 데이터베이스 기반으로 동작합니다.
 * (개인식별정보 배제: 익명 감자 프로필 및 UUID 기반)
 */

(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', async function () {
    const listContainer = document.getElementById('screen-list');
    const writeContainer = document.getElementById('screen-write');

    // 1. 임시 초기 데이터 설정 (DB 로드 전 즉시 렌더링용)
    window.gamzaProducts = window.Screen1List
      ? [...window.Screen1List.INITIAL_PRODUCTS]
      : [];

    // 2. [화면 1] 상품 목록 초기 렌더링
    if (window.Screen1List && listContainer) {
      window.Screen1List.renderListScreen(listContainer, window.gamzaProducts);
    }

    // 3. [화면 2] 상세 팝업 모달 초기화
    if (window.Screen2Detail) {
      window.Screen2Detail.initDetailModal();
    }

    // 4. [화면 3] 글쓰기 화면 초기화 및 콜백 연결 (Supabase INSERT 연동)
    if (window.Screen3Write && writeContainer) {
      window.Screen3Write.initWriteScreen({
        container: writeContainer,
        onAddProduct: async function (newProduct) {
          try {
            if (window.Screen1List) {
              window.Screen1List.showToast('🥔 수파베이스 DB에 감자 매물을 등록하는 중...');
            }

            // Supabase DB에 새 상품 등록
            let savedProduct = newProduct;
            if (window.GamzaSupabase && typeof window.GamzaSupabase.createProduct === 'function') {
              savedProduct = await window.GamzaSupabase.createProduct(newProduct);
            }

            // 저장된 상품을 목록 맨 앞에 추가
            window.gamzaProducts.unshift(savedProduct);

            // 글쓰기 화면 숨기고 목록 화면 표시
            showListView();

            // 필터를 전체 보기로 초기화하고 그리드 갱신
            if (window.Screen1List) {
              window.Screen1List.resetFilters(window.gamzaProducts);
              window.Screen1List.showToast('🥔 새 감자 매물이 수파베이스에 성공적으로 등록되었어요!');
            }
          } catch (err) {
            console.error('상품 등록 오류:', err);
            if (window.Screen1List) {
              window.Screen1List.showToast('⚠️ 상품 등록 중 오류가 발생했습니다.');
            }
          }
        },
        onUpdateProduct: async function (updatedProduct) {
          try {
            if (window.Screen1List) {
              window.Screen1List.showToast('🥔 수파베이스 DB에 수정 사항을 저장하는 중...');
            }

            let savedProduct = updatedProduct;
            if (window.GamzaSupabase && typeof window.GamzaSupabase.updateProduct === 'function') {
              savedProduct = await window.GamzaSupabase.updateProduct(updatedProduct.id, updatedProduct);
            }

            // 전역 목록 내 해당 상품 정보 교체
            if (Array.isArray(window.gamzaProducts)) {
              const idx = window.gamzaProducts.findIndex((p) => String(p.id) === String(updatedProduct.id));
              if (idx !== -1) {
                window.gamzaProducts[idx] = { ...window.gamzaProducts[idx], ...savedProduct };
              }
            }

            // 글쓰기 화면 숨기고 목록 화면 표시
            showListView();

            if (window.Screen1List) {
              window.Screen1List.renderProductGrid(window.gamzaProducts);
              window.Screen1List.showToast('🥔 감자 매물 정보가 성공적으로 수정되었어요!');
            }
          } catch (err) {
            console.error('상품 수정 오류:', err);
            if (window.Screen1List) {
              window.Screen1List.showToast('⚠️ 상품 수정 중 오류가 발생했습니다.');
            }
          }
        },
        onCancel: function () {
          showListView();
        }
      });
    }

    // 5. [인증 모달] 초기화
    if (window.GamzaAuthModal) {
      window.GamzaAuthModal.init({
        onAuthSuccess: async function (profile) {
          await syncAuthState();

          // [요구사항 3] 로그인을 하지 않은 상태에서 [글쓰기]를 누른 뒤 로그인 성공 시 글쓰기 창 이어서 띄우기
          if (window.pendingActionAfterAuth === 'write') {
            window.pendingActionAfterAuth = null;
            setTimeout(() => {
              showWriteView();
              if (window.Screen1List && typeof window.Screen1List.showToast === 'function') {
                window.Screen1List.showToast(`🥔 ${profile.nickname}님, 이어서 글을 작성해보세요!`);
              }
            }, 300);
          }
        }
      });
    }

    // 화면 전환 헬퍼: 목록 보기
    function showListView() {
      if (writeContainer) {
        writeContainer.classList.remove('is-active');
        writeContainer.style.display = 'none';
      }
      const mainListEl = document.getElementById('screen1-main');
      if (mainListEl) {
        mainListEl.style.display = 'block';
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // 화면 전환 헬퍼: 글쓰기 보기
    function showWriteView() {
      const mainListEl = document.getElementById('screen1-main');
      if (mainListEl) {
        mainListEl.style.display = 'none';
      }
      if (window.Screen2Detail) {
        window.Screen2Detail.closeDetailModal();
      }
      if (window.Screen3Write) {
        window.Screen3Write.openWriteScreen();
      }
    }

    // 6. 전역 이벤트 브릿지 연결
    // (1) 상품 카드 클릭 -> [화면 2] 상세 팝업 오픈
    window.onProductCardClick = function (productId) {
      const target = (window.gamzaProducts || []).find(
        (item) => String(item.id) === String(productId)
      );
      if (target && window.Screen2Detail) {
        window.Screen2Detail.openDetailModal(target);
      }
    };

    // (2) 상단 [+ 글쓰기] 버튼 클릭 -> [화면 3] 글쓰기 화면 오픈
    // [요구사항 3] 로그인을 하지 않은 상태에서 [글쓰기]를 누르면 로그인 모달이 먼저 뜨고, 로그인 성공 시 글쓰기 창이 이어서 뜨게 처리
    window.onOpenWriteModal = async function () {
      let isLoggedIn = false;
      if (window.GamzaSupabase && typeof window.GamzaSupabase.getSession === 'function') {
        const session = await window.GamzaSupabase.getSession();
        isLoggedIn = !!(session && session.user);
      }

      if (isLoggedIn) {
        showWriteView();
      } else {
        window.pendingActionAfterAuth = 'write';
        if (window.Screen1List && typeof window.Screen1List.showToast === 'function') {
          window.Screen1List.showToast('🥔 글을 작성하려면 먼저 로그인이 필요해요.');
        }
        if (window.GamzaAuthModal && typeof window.GamzaAuthModal.open === 'function') {
          window.GamzaAuthModal.open('login', { reason: 'write' });
        }
      }
    };

    // (3) 인증 모달 오픈 브릿지 ([로그인] 클릭 시)
    window.onOpenAuthModal = function (mode = 'login') {
      if (window.GamzaAuthModal && typeof window.GamzaAuthModal.open === 'function') {
        window.GamzaAuthModal.open(mode);
      }
    };

    // (4) 로그아웃 클릭 브릿지 ([로그아웃] 클릭 시)
    window.onLogoutClick = async function () {
      try {
        if (window.GamzaSupabase && typeof window.GamzaSupabase.signOut === 'function') {
          await window.GamzaSupabase.signOut();
        }
        if (window.Screen1List && typeof window.Screen1List.showToast === 'function') {
          window.Screen1List.showToast('🥔 안전하게 로그아웃되었습니다.');
        }
        await syncAuthState();
      } catch (err) {
        console.error('로그아웃 실패:', err);
      }
    };

    // (5) 게시글 수정 브릿지 ([게시글 수정] 클릭 시 글쓰기 화면을 수정 모드로 오픈)
    window.onEditProduct = function (productToEdit) {
      const mainListEl = document.getElementById('screen1-main');
      if (mainListEl) {
        mainListEl.style.display = 'none';
      }
      if (window.Screen2Detail) {
        window.Screen2Detail.closeDetailModal();
      }
      if (window.Screen3Write) {
        window.Screen3Write.openEditScreen(productToEdit);
      }
    };

    // (6) 상단 로고 클릭 시 목록 화면 복귀
    const brandHomeLink = document.getElementById('brand-home-link');
    if (brandHomeLink) {
      brandHomeLink.addEventListener('click', function () {
        showListView();
      });
    }

    // 7. 인증 상태 동기화 헬퍼 (로그인/로그아웃/초기화 시 헤더 및 찜 목록 갱신)
    async function syncAuthState() {
      if (!window.GamzaSupabase) return;

      try {
        const session = await window.GamzaSupabase.getSession();
        const isLoggedIn = !!(session && session.user);

        if (isLoggedIn) {
          const profile = await window.GamzaSupabase.getActiveProfile();
          if (window.Screen1List && typeof window.Screen1List.updateHeaderAuthUI === 'function') {
            window.Screen1List.updateHeaderAuthUI(profile, true);
          }
        } else {
          if (window.Screen1List && typeof window.Screen1List.updateHeaderAuthUI === 'function') {
            window.Screen1List.updateHeaderAuthUI(null, false);
          }
        }

        // 찜 목록 다시 로드하여 갱신
        const wishedIds = await window.GamzaSupabase.fetchWishedProductIds();
        if (window.Screen2Detail && typeof window.Screen2Detail.setWishedIds === 'function') {
          window.Screen2Detail.setWishedIds(wishedIds);
        }
      } catch (err) {
        console.warn('인증 상태 동기화 실패:', err);
      }
    }

    // 8. Supabase 비동기 데이터 동기화 및 Auth 리스너
    if (window.GamzaSupabase) {
      try {
        // (1) 현재 로그인 상태 동기화
        await syncAuthState();

        // (2) Auth 세션 상태 변경 리스너 등록
        if (typeof window.GamzaSupabase.onAuthStateChange === 'function') {
          window.GamzaSupabase.onAuthStateChange(async (event) => {
            if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
              await syncAuthState();
            }
          });
        }

        // (3) Supabase products 테이블에서 실제 매물 데이터 로드
        const remoteProducts = await window.GamzaSupabase.fetchProducts();
        if (remoteProducts && remoteProducts.length > 0) {
          window.gamzaProducts = remoteProducts;
          if (window.Screen1List && typeof window.Screen1List.renderProductGrid === 'function') {
            window.Screen1List.renderProductGrid(window.gamzaProducts);
          }
        }
      } catch (err) {
        console.warn('Supabase 초기 데이터 동기화 실패, 로컬 데이터 유지:', err);
      }
    }
  });
})();
