/**
 * 감자(Gamza) 중고 거래 서비스 - 수파베이스(Supabase) 클라이언트 및 데이터 연동 모듈
 * 개인식별정보(이메일, 전화번호, 실명) 일체 없이 안전한 익명 프로필 및 DB 연동을 담당합니다.
 */

(function () {
  'use strict';

  const SUPABASE_URL = 'https://aefsctjmnpqlakxmkxou.supabase.co';
  const SUPABASE_ANON_KEY =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFlZnNjdGptbnBxbGFreG1reG91Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI0MDc2OTMsImV4cCI6MjEwNzk4MzY5M30.A2C1CTLgv2tcBPlZRcAw3uM-omoiakz3v4z30xzK8lo';

  // 1. Supabase 클라이언트 초기화
  let client = null;
  if (window.supabase && typeof window.supabase.createClient === 'function') {
    client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  } else {
    console.error('Supabase SDK가 로드되지 않았습니다.');
  }

  // 시간 포맷 변환 (ISO 날짜 -> 상대 시간 "방금 전", "15분 전" 등)
  function formatTimeAgo(isoString) {
    if (!isoString) return '방금 전';
    const now = new Date();
    const past = new Date(isoString);
    const diffSec = Math.max(0, Math.floor((now - past) / 1000));
    if (diffSec < 60) return '방금 전';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}분 전`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour}시간 전`;
    const diffDay = Math.floor(diffHour / 24);
    if (diffDay === 1) return '어제';
    if (diffDay < 30) return `${diffDay}일 전`;
    return past.toLocaleDateString('ko-KR');
  }

  // 감자 감성 랜덤 닉네임 생성기 (개인 식별 정보 완전 배제)
  const POTATO_ADJECTIVES = [
    '포슬포슬한', '따끈따끈한', '노릇노릇한', '바삭한', '달콤한',
    '햇살가득', '귀여운', '통통한', '고소한', '포근한'
  ];
  const POTATO_NOUNS = ['감자', '알감자', '왕감자', '감자튀김', '버터감자', '통감자', '햇감자'];

  function generateRandomPotatoNickname() {
    const adj = POTATO_ADJECTIVES[Math.floor(Math.random() * POTATO_ADJECTIVES.length)];
    const noun = POTATO_NOUNS[Math.floor(Math.random() * POTATO_NOUNS.length)];
    const randomNum = Math.floor(100 + Math.random() * 900);
    return `${adj}${noun}${randomNum}`;
  }

  // 귀여운 감자 아바타 생성기
  function createPotatoAvatar(bgColor, emoji) {
    const bg = bgColor || '#EFE6DD';
    const em = emoji || '🥔';
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80">
      <rect width="80" height="80" rx="40" fill="${bg}"/>
      <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" font-size="38">${em}</text>
    </svg>`;
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
  }

  // 2. 현재 브라우저의 익명 감자 프로필 가져오기 (없으면 Supabase DB에 신규 익명 프로필 생성)
  async function getOrCreateAnonymousProfile() {
    const STORAGE_KEY = 'gamza_anonymous_profile_v1';
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.id) return parsed;
      } catch (e) {
        // 무시하고 재생성
      }
    }

    const nickname = generateRandomPotatoNickname();
    const avatar = createPotatoAvatar('#EFE6DD', '🥔');
    const region = '서울 마포구 연남동';

    if (!client) {
      const fallback = { id: 'anon-' + Date.now(), nickname, avatar, region };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(fallback));
      return fallback;
    }

    try {
      const { data, error } = await client
        .from('profiles')
        .insert({
          nickname: nickname,
          avatar_url: avatar,
          region: region,
          badge_title: '🥔 포슬포슬 판매자'
        })
        .select()
        .single();

      if (error) {
        console.error('익명 프로필 생성 실패:', error);
        const fallback = { id: 'anon-' + Date.now(), nickname, avatar, region };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(fallback));
        return fallback;
      }

      const profile = {
        id: data.id,
        nickname: data.nickname,
        avatar: data.avatar_url,
        region: data.region,
        badge_title: data.badge_title
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
      return profile;
    } catch (err) {
      console.error('프로필 처리 오류:', err);
      const fallback = { id: 'anon-' + Date.now(), nickname, avatar, region };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(fallback));
      return fallback;
    }
  }

  // 2-1. 현재 로그인된 회원 프로필 가져오기 (비로그인 상태면 null 반환)
  async function getLoggedInProfile() {
    if (!client) return null;

    try {
      const { data: { user }, error: userErr } = await client.auth.getUser();
      if (userErr || !user) return null;

      // Supabase profiles 테이블에서 로그인 사용자 프로필 조회
      const { data: profileData, error: profileErr } = await client
        .from('profiles')
        .select('id, nickname, avatar_url, region, badge_title')
        .eq('id', user.id)
        .maybeSingle();

      if (!profileErr && profileData && profileData.nickname) {
        return {
          id: profileData.id,
          nickname: profileData.nickname,
          avatar: profileData.avatar_url || createPotatoAvatar('#EFE6DD', '🥔'),
          region: profileData.region || '서울 마포구 연남동',
          badge_title: profileData.badge_title || '🥔 감자 이웃'
        };
      }

      // 프로필 테이블에 아직 없으면 유저 메타데이터 기반으로 upsert 생성
      const userNickname = (user.user_metadata && user.user_metadata.nickname)
        ? user.user_metadata.nickname.trim()
        : '감자이웃';
      const userAvatar = (user.user_metadata && user.user_metadata.avatar_url)
        || createPotatoAvatar('#EFE6DD', '🥔');
      const userRegion = (user.user_metadata && user.user_metadata.region)
        || '서울 마포구 연남동';

      const upsertData = {
        id: user.id,
        nickname: userNickname,
        avatar_url: userAvatar,
        region: userRegion,
        badge_title: '🥔 정회원 감자'
      };

      const { data: savedProfile } = await client
        .from('profiles')
        .upsert(upsertData)
        .select()
        .single();

      if (savedProfile) {
        return {
          id: savedProfile.id,
          nickname: savedProfile.nickname,
          avatar: savedProfile.avatar_url,
          region: savedProfile.region,
          badge_title: savedProfile.badge_title
        };
      }

      return {
        id: user.id,
        nickname: userNickname,
        avatar: userAvatar,
        region: userRegion,
        badge_title: '🥔 정회원 감자'
      };
    } catch (e) {
      console.warn('getLoggedInProfile 처리 중 예외:', e);
      return null;
    }
  }

  // 2-2. 현재 활성 프로필 가져오기 (로그인된 사용자가 있으면 회원 프로필, 없으면 익명 프로필)
  async function getActiveProfile() {
    const loggedIn = await getLoggedInProfile();
    if (loggedIn) return loggedIn;
    return getOrCreateAnonymousProfile();
  }

  // 2-2. Supabase Auth: 회원가입 (이메일, 비밀번호, 닉네임 필수)
  async function signUp({ email, password, nickname }) {
    if (!client) throw new Error('Supabase 클라이언트가 초기화되지 않았습니다.');
    const trimmedNick = (nickname || '').trim();
    if (!trimmedNick) {
      throw new Error('닉네임은 필수 입력 항목입니다.');
    }

    const defaultAvatar = createPotatoAvatar('#EFE6DD', '🥔');
    const defaultRegion = '서울 마포구 연남동';

    const { data, error } = await client.auth.signUp({
      email,
      password,
      options: {
        data: {
          nickname: trimmedNick,
          avatar_url: defaultAvatar,
          region: defaultRegion
        }
      }
    });

    if (error) {
      throw error;
    }

    // 만약 사용자가 생성되었으면 profiles 테이블에도 직접 보장 삽입
    if (data && data.user) {
      try {
        await client.from('profiles').upsert({
          id: data.user.id,
          nickname: trimmedNick,
          avatar_url: defaultAvatar,
          region: defaultRegion,
          badge_title: '🥔 정회원 감자'
        });
      } catch (err) {
        console.warn('회원가입 후 프로필 즉시 생성 오류:', err);
      }
    }

    return data;
  }

  // 2-3. Supabase Auth: 로그인 (이메일, 비밀번호)
  async function signIn({ email, password }) {
    if (!client) throw new Error('Supabase 클라이언트가 초기화되지 않았습니다.');
    const { data, error } = await client.auth.signInWithPassword({
      email,
      password
    });
    if (error) {
      throw error;
    }
    return data;
  }

  // 2-4. Supabase Auth: 로그아웃
  async function signOut() {
    if (!client) return;
    const { error } = await client.auth.signOut();
    if (error) {
      throw error;
    }
  }

  // 2-5. 현재 로그인 세션 확인
  async function getSession() {
    if (!client) return null;
    const { data: { session }, error } = await client.auth.getSession();
    if (error) {
      console.warn('세션 확인 실패:', error);
      return null;
    }
    return session;
  }

  // 2-6. Auth 상태 변화 리스너 등록
  function onAuthStateChange(callback) {
    if (!client || !client.auth) {
      return { data: { subscription: { unsubscribe: () => {} } } };
    }
    return client.auth.onAuthStateChange(callback);
  }

  // 3. 상품 목록 조회 (products + profiles 조인)
  async function fetchProducts() {
    if (!client) return [];

    try {
      const { data, error } = await client
        .from('products')
        .select(`
          id,
          title,
          category,
          price,
          description,
          location,
          status,
          image_url,
          created_at,
          seller:seller_id (
            id,
            nickname,
            avatar_url,
            region,
            badge_title
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('상품 목록 불러오기 실패:', error);
        return [];
      }

      // 화면에서 기대하는 포맷으로 표준화
      return (data || []).map((row) => ({
        id: row.id,
        title: row.title,
        category: row.category,
        price: row.price,
        description: row.description,
        location: row.location,
        status: row.status || '판매중',
        image: row.image_url,
        imageUrl: row.image_url,
        createdAt: row.created_at,
        timeAgo: formatTimeAgo(row.created_at),
        seller: {
          id: row.seller?.id,
          nickname: row.seller?.nickname || '감자이웃',
          avatar: row.seller?.avatar_url || createPotatoAvatar('#EFE6DD', '🥔'),
          region: row.seller?.region || row.location,
          badge: row.seller?.badge_title || '🥔 포슬포슬 판매자'
        }
      }));
    } catch (err) {
      console.error('fetchProducts 예외:', err);
      return [];
    }
  }

  // 4. 새 상품 등록 (products INSERT)
  async function createProduct(productInput) {
    if (!client) throw new Error('Supabase 클라이언트가 없습니다.');

    // 1) 글쓴이 프로필 획득 (로그인 회원 우선)
    const profile = await getActiveProfile();

    // 2) DB 외래키 무결성 보장: profiles 테이블에 글쓴이 프로필이 반드시 존재하도록 동기화
    if (client && profile && profile.id) {
      try {
        await client.from('profiles').upsert({
          id: profile.id,
          nickname: profile.nickname,
          avatar_url: profile.avatar || profile.avatar_url || createPotatoAvatar('#EFE6DD', '🥔'),
          region: profile.region || productInput.location || '서울 마포구 연남동',
          badge_title: profile.badge_title || '🥔 포슬포슬 판매자'
        });
      } catch (upsertErr) {
        console.warn('판매자 프로필 사전 동기화 예외 (무시 후 계속):', upsertErr);
      }
    }

    const insertPayload = {
      title: productInput.title,
      category: productInput.category,
      price: productInput.price,
      description: productInput.description,
      location: productInput.location,
      status: productInput.status || '판매중',
      image_url: productInput.image || productInput.imageUrl,
      seller_id: profile.id
    };

    const { data, error } = await client
      .from('products')
      .insert(insertPayload)
      .select(`
        id,
        title,
        category,
        price,
        description,
        location,
        status,
        image_url,
        created_at,
        seller:seller_id (
          id,
          nickname,
          avatar_url,
          region,
          badge_title
        )
      `)
      .single();

    if (error) {
      console.error('상품 등록 실패:', error);
      throw error;
    }

    const finalSellerNickname = (data && data.seller && data.seller.nickname)
      ? data.seller.nickname
      : (profile.nickname || '감자이웃');
    const finalSellerAvatar = (data && data.seller && data.seller.avatar_url)
      ? data.seller.avatar_url
      : (profile.avatar || createPotatoAvatar('#EFE6DD', '🥔'));
    const finalSellerRegion = (data && data.seller && data.seller.region)
      ? data.seller.region
      : (productInput.location || profile.region || '서울 마포구 연남동');

    return {
      id: data.id,
      title: data.title,
      category: data.category,
      price: data.price,
      description: data.description,
      location: data.location,
      status: data.status,
      image: data.image_url,
      imageUrl: data.image_url,
      createdAt: data.created_at,
      timeAgo: '방금 전',
      sellerId: profile.id,
      sellerNickname: finalSellerNickname,
      seller: {
        id: profile.id,
        nickname: finalSellerNickname,
        avatar: finalSellerAvatar,
        region: finalSellerRegion,
        badge: (data && data.seller && data.seller.badge_title) || profile.badge_title || '🥔 포슬포슬 판매자'
      }
    };
  }

  // 5. 사용자의 찜 목록(wishlists) 조회
  async function fetchWishedProductIds() {
    if (!client) return new Set();
    const profile = await getActiveProfile();
    try {
      const { data, error } = await client
        .from('wishlists')
        .select('product_id')
        .eq('user_id', profile.id);

      if (error) {
        console.warn('찜 목록 조회 오류:', error);
        return new Set();
      }
      return new Set((data || []).map((row) => String(row.product_id)));
    } catch (e) {
      return new Set();
    }
  }

  // 6. 찜(관심 상품) 토글 (INSERT / DELETE)
  async function toggleWishlist(productId) {
    if (!client) return false;
    const profile = await getActiveProfile();
    const pid = Number(productId);

    // 먼저 존재하는지 확인
    const { data: existing } = await client
      .from('wishlists')
      .select('id')
      .eq('user_id', profile.id)
      .eq('product_id', pid)
      .maybeSingle();

    if (existing) {
      await client.from('wishlists').delete().eq('id', existing.id);
      return false; // 해제됨
    } else {
      await client.from('wishlists').insert({
        user_id: profile.id,
        product_id: pid
      });
      return true; // 등록됨
    }
  }

  // 7. 상품 판매 상태 변경 (판매중 / 예약중 / 거래 완료)
  async function updateProductStatus(productId, newStatus) {
    if (!client) throw new Error('Supabase 클라이언트가 없습니다.');
    const pid = Number(productId);

    const { data, error } = await client
      .from('products')
      .update({ status: newStatus })
      .eq('id', pid)
      .select(`
        id,
        title,
        category,
        price,
        description,
        location,
        status,
        image_url,
        created_at,
        seller:seller_id (
          id,
          nickname,
          avatar_url,
          region,
          badge_title
        )
      `)
      .single();

    if (error) {
      console.error('상품 상태 업데이트 실패:', error);
      throw error;
    }

    return data;
  }

  // 8. 상품 전체 내용 수정 (title, category, price, description, location, status, image)
  async function updateProduct(productId, updatedInput) {
    if (!client) throw new Error('Supabase 클라이언트가 없습니다.');
    const pid = Number(productId);

    const updatePayload = {
      title: updatedInput.title,
      category: updatedInput.category,
      price: updatedInput.price,
      description: updatedInput.description,
      location: updatedInput.location,
      status: updatedInput.status || '판매중',
      image_url: updatedInput.image || updatedInput.imageUrl
    };

    const { data, error } = await client
      .from('products')
      .update(updatePayload)
      .eq('id', pid)
      .select(`
        id,
        title,
        category,
        price,
        description,
        location,
        status,
        image_url,
        created_at,
        seller:seller_id (
          id,
          nickname,
          avatar_url,
          region,
          badge_title
        )
      `)
      .single();

    if (error) {
      console.error('상품 수정 실패:', error);
      throw error;
    }

    return {
      id: data.id,
      title: data.title,
      category: data.category,
      price: data.price,
      description: data.description,
      location: data.location,
      status: data.status,
      image: data.image_url,
      imageUrl: data.image_url,
      createdAt: data.created_at,
      timeAgo: '방금 전',
      seller: {
        id: data.seller?.id,
        nickname: data.seller?.nickname || '감자이웃',
        avatar: data.seller?.avatar_url || createPotatoAvatar('#EFE6DD', '🥔'),
        region: data.seller?.region || data.location,
        badge: data.seller?.badge_title || '🥔 포슬포슬 판매자'
      }
    };
  }

  // 9. 상품 삭제 (관련 찜 레코드 먼저 삭제 후 상품 삭제)
  async function deleteProduct(productId) {
    if (!client) throw new Error('Supabase 클라이언트가 없습니다.');
    const pid = Number(productId);

    try {
      await client.from('wishlists').delete().eq('product_id', pid);
    } catch (wErr) {
      console.warn('찜 목록 레코드 삭제 중 오류 (계속 진행):', wErr);
    }

    const { error } = await client
      .from('products')
      .delete()
      .eq('id', pid);

    if (error) {
      console.error('상품 삭제 실패:', error);
      throw error;
    }

    return true;
  }

  // 전역 노출
  window.GamzaSupabase = {
    client,
    formatTimeAgo,
    getOrCreateAnonymousProfile,
    getLoggedInProfile,
    getActiveProfile,
    signUp,
    signIn,
    signOut,
    getSession,
    onAuthStateChange,
    fetchProducts,
    createProduct,
    updateProduct,
    updateProductStatus,
    deleteProduct,
    fetchWishedProductIds,
    toggleWishlist
  };
})();
