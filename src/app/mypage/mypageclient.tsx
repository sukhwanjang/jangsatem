'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { Post } from '@/lib/categoryData';

// 사용자 정보 확장 인터페이스
interface UserProfile {
  user_id: string;
  nickname: string;
  username?: string;
  email: string;
  join_date?: string;
  profile_image?: string;
  created_at?: string;
  updated_at?: string;
}

export default function MyPageClient() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [myPosts, setMyPosts] = useState<Post[]>([]);
  const [likedPosts, setLikedPosts] = useState<Post[]>([]);
  const [activeTab, setActiveTab] = useState<'posts' | 'likes' | 'settings'>('posts');
  const [isLoading, setIsLoading] = useState(true);
  const [nickname, setNickname] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  // 프로필 이미지 관련 상태
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsLoading(true);
        
        // 현재 로그인된 사용자 정보 가져오기
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          // 로그인하지 않은 경우 로그인 페이지로 리다이렉트
          router.push('/login');
          return;
        }
        
        setUser(user);
        
        // 사용자 프로필 정보 가져오기 (소문자 users 테이블)
        const { data: profileData, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('user_id', user.id)
          .single();
          
        // 소문자 테이블에 정보가 없으면 대문자 Users 테이블 확인
        let userProfile = profileData;
        let userProfileError = profileError;
        
        if (profileError) {
          // 대문자 Users 테이블에서 확인
          const { data: upperProfileData, error: upperProfileError } = await supabase
            .from('Users')
            .select('*')
            .eq('user_id', user.id)
            .single();
            
          if (!upperProfileError && upperProfileData) {
            userProfile = upperProfileData;
            userProfileError = null;
          } else {
            userProfileError = upperProfileError;
          }
        }
        
        if (userProfileError) {
          console.error('프로필 정보를 가져오는 중 오류 발생:', userProfileError);
          // 프로필 정보가 없을 경우 기본 프로필 생성
          const defaultProfile: UserProfile = {
            user_id: user.id,
            nickname: user.email?.split('@')[0] || '사용자',
            email: user.email || '이메일 없음',
            join_date: user.created_at
          };
          setProfile(defaultProfile);
        } else if (userProfile) {
          // nickname이 없을 경우 username 필드 확인
          if (!userProfile.nickname && userProfile.username) {
            userProfile.nickname = userProfile.username;
          }
          
          // 여전히 nickname이 없으면 기본값 설정
          if (!userProfile.nickname) {
            userProfile.nickname = user.email?.split('@')[0] || '사용자';
          }
          
          setProfile(userProfile);
        } else {
          // 프로필 데이터가 없는 경우 (null인 경우)
          const defaultProfile: UserProfile = {
            user_id: user.id,
            nickname: user.email?.split('@')[0] || '사용자',
            email: user.email || '이메일 없음',
            join_date: user.created_at
          };
          setProfile(defaultProfile);
        }
        
        // 내가 작성한 게시물 가져오기
        const { data: postsData, error: postsError } = await supabase
          .from('posts')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
          
        if (postsError) {
          console.error('게시물을 가져오는 중 오류 발생:', postsError);
        } else if (postsData) {
          setMyPosts(postsData);
        }
        
        // 좋아요한 게시물 가져오기
        const { data: likesData, error: likesError } = await supabase
          .from('likes')
          .select('post_id')
          .eq('user_id', user.id);
          
        if (likesError) {
          console.error('좋아요 정보를 가져오는 중 오류 발생:', likesError);
        } else if (likesData && likesData.length > 0) {
          const postIds = likesData.map(like => like.post_id);
          
          const { data: likedPostsData, error: likedPostsError } = await supabase
            .from('posts')
            .select('*')
            .in('id', postIds)
            .order('created_at', { ascending: false });
            
          if (likedPostsError) {
            console.error('좋아요한 게시물을 가져오는 중 오류 발생:', likedPostsError);
          } else if (likedPostsData) {
            setLikedPosts(likedPostsData);
          }
        }
      } catch (error) {
        console.error('사용자 데이터를 가져오는 중 오류 발생:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserData();
  }, [router]);

  useEffect(() => {
    if (profile) {
      setNickname(profile.nickname);
      if (profile.profile_image) {
        setProfileImageUrl(profile.profile_image);
      }
    }
  }, [profile]);

  // 날짜 포맷팅 함수
  const formatDate = (dateString?: string) => {
    if (!dateString) return '알 수 없음';
    const date = new Date(dateString);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  // 프로필 이미지 선택 처리
  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // 파일 크기 체크 (5MB 제한)
      if (file.size > 5 * 1024 * 1024) {
        alert('이미지 크기는 5MB 이하여야 합니다.');
        return;
      }
      
      // 이미지 파일 타입 체크
      if (!file.type.startsWith('image/')) {
        alert('이미지 파일만 업로드 가능합니다.');
        return;
      }
      
      setProfileImage(file);
      
      // 미리보기 URL 생성
      const imageUrl = URL.createObjectURL(file);
      setProfileImageUrl(imageUrl);
    }
  };

  // 프로필 이미지 업로드 처리
  const uploadProfileImage = async () => {
    if (!profileImage || !user) return null;
    
    setIsUploadingImage(true);
    
    try {
      // 파일 확장자 가져오기
      const fileExt = profileImage.name.split('.').pop();
      // 고유한 파일명 생성 (타임스탬프 사용)
      const fileName = `${user.id}_${Date.now()}.${fileExt}`;
      const filePath = `profile_images/${fileName}`;
      
      // Supabase Storage에 이미지 업로드 (uploads 버킷 사용)
      const { data, error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(filePath, profileImage, {
          contentType: profileImage.type,
          cacheControl: '3600'
        });
        
      if (uploadError) {
        console.error('프로필 이미지 업로드 중 오류:', uploadError);
        return null;
      }
      
      // 이미지 URL 가져오기
      const { data: urlData } = supabase.storage
        .from('uploads')
        .getPublicUrl(filePath);
        
      return urlData.publicUrl;
    } catch (error) {
      console.error('이미지 업로드 중 오류 발생:', error);
      return null;
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user || !profile) {
      console.error('사용자 또는 프로필 정보가 없습니다.');
      return;
    }
    
    try {
      setIsSaving(true);
      setSaveMessage(null);
      
      // 닉네임이 비어 있는지 확인
      if (!nickname.trim()) {
        setSaveMessage({
          type: 'error',
          text: '닉네임을 입력해주세요.'
        });
        return;
      }
      
      // 프로필 이미지 업로드
      let profileImagePath = profile.profile_image;
      if (profileImage) {
        console.log('프로필 이미지 업로드 시작');
        const uploadedImageUrl = await uploadProfileImage();
        if (uploadedImageUrl) {
          console.log('프로필 이미지 업로드 성공:', uploadedImageUrl);
          profileImagePath = uploadedImageUrl;
        } else {
          console.log('프로필 이미지 업로드 실패');
        }
      }
      
      // 현재 시간
      const now = new Date().toISOString();
      
      // 저장할 프로필 데이터
      const profileData = {
        user_id: user.id,
        nickname: nickname,
        username: nickname,
        email: user.email || '',
        profile_image: profileImagePath,
        join_date: profile.join_date || now,
        created_at: profile.created_at || now,
        updated_at: now
      };

      console.log('저장할 프로필 데이터:', profileData);

      // 먼저 Users 테이블에 저장 시도
      console.log('Users 테이블 저장 시도');
      let { data: userData, error: userError } = await supabase
        .from('Users')
        .upsert(profileData)
        .select();

      // Users 테이블 저장 실패 시 users 테이블에 저장 시도
      if (userError) {
        console.log('Users 테이블 저장 실패, users 테이블로 시도:', userError);
        
        // users 테이블 존재 여부 확인
        const { data: tableCheck, error: tableCheckError } = await supabase
          .from('users')
          .select('count')
          .limit(1);
          
        if (tableCheckError) {
          console.error('users 테이블 확인 실패:', tableCheckError);
          throw new Error('데이터베이스 테이블 접근 오류');
        }

        const { data: lowerUserData, error: lowerUserError } = await supabase
          .from('users')
          .upsert(profileData)
          .select();

        if (lowerUserError) {
          console.error('users 테이블 저장 오류:', lowerUserError);
          throw lowerUserError;
        }
        
        console.log('users 테이블 저장 성공');
        userData = lowerUserData;
      } else {
        console.log('Users 테이블 저장 성공');
      }
      
      if (!userData) {
        throw new Error('프로필 데이터 저장 실패');
      }
      
      // 프로필 상태 업데이트
      setProfile({
        ...profile,
        nickname: nickname,
        username: nickname,
        profile_image: profileImagePath
      });
      
      setSaveMessage({
        type: 'success',
        text: '프로필이 성공적으로 저장되었습니다.'
      });
      
      // 3초 후 메시지 숨기기
      setTimeout(() => {
        setSaveMessage(null);
      }, 3000);
      
    } catch (error: any) {
      console.error('프로필 저장 중 오류 발생:', error);
      console.error('오류 상세:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      
      setSaveMessage({
        type: 'error',
        text: `프로필 저장 중 오류가 발생했습니다. (${error.message || '알 수 없는 오류'})`
      });
    } finally {
      setIsSaving(false);
    }
  };

  // 설정 탭 렌더링
  const renderSettingsTab = () => {
    return (
      <div className="mt-6">
        <h2 className="text-xl font-bold mb-6">프로필 설정</h2>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
              {profileImageUrl ? (
                <img src={profileImageUrl} alt="프로필 이미지" className="w-full h-full object-cover" />
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-gray-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              )}
            </div>
            
            <div className="flex-1">
              {/* 이미지 업로드 버튼 추가 */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  프로필 이미지
                </label>
                <div className="flex items-center gap-2">
                  <input 
                    type="file" 
                    id="profile-image-input"
                    className="hidden"
                    accept="image/*"
                    onChange={handleProfileImageChange}
                  />
                  <button 
                    type="button"
                    onClick={() => {
                      const fileInput = document.getElementById('profile-image-input') as HTMLInputElement;
                      if (fileInput) fileInput.click();
                    }}
                    className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200"
                  >
                    이미지 선택
                  </button>
                  {profileImage && (
                    <span className="text-xs text-gray-500">
                      {profileImage.name} ({(profileImage.size / 1024).toFixed(1)} KB)
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  5MB 이하의 이미지 파일(JPG, PNG)을 선택해주세요.
                </p>
              </div>
              
              <div className="mb-4">
                <label htmlFor="nickname" className="block text-sm font-medium text-gray-700 mb-1">
                  닉네임
                </label>
                <input
                  type="text"
                  id="nickname"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="닉네임을 입력하세요"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  이메일
                </label>
                <div className="px-4 py-2 bg-gray-100 rounded-md text-gray-500">
                  {profile?.email || user?.email || '이메일 정보 없음'}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  이메일은 변경할 수 없습니다.
                </p>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  가입일
                </label>
                <div className="px-4 py-2 bg-gray-100 rounded-md text-gray-500">
                  {formatDate(profile?.join_date || user?.created_at)}
                </div>
              </div>
              
              <div className="flex justify-end mt-6">
                <button
                  onClick={handleSaveProfile}
                  disabled={isSaving || isUploadingImage}
                  className={`px-6 py-2 rounded-md ${isSaving || isUploadingImage ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'} text-white`}
                >
                  {isSaving || isUploadingImage ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      저장 중...
                    </span>
                  ) : '저장하기'}
                </button>
              </div>
              
              {saveMessage && (
                <div className={`mt-4 p-3 rounded-md ${saveMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {saveMessage.text}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-500">사용자 정보를 불러올 수 없습니다.</p>
        <button
          onClick={() => router.push('/login')}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          로그인
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-screen-xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-blue-600">마이페이지</h1>
        <button
          onClick={() => router.push('/')}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
          </svg>
          홈으로
        </button>
      </div>
      
      {/* 사용자 프로필 정보 */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
            {profileImageUrl ? (
              <img src={profileImageUrl} alt="프로필 이미지" className="w-full h-full object-cover" />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-gray-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            )}
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-xl font-semibold">{profile.nickname}</h2>
            <p className="text-gray-600 mb-2">{profile.email}</p>
            <p className="text-sm text-gray-500">가입일: {formatDate(profile.join_date || user.created_at)}</p>
            <button
              onClick={() => setActiveTab('settings')}
              className="mt-3 px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 focus:outline-none"
            >
              프로필 수정
            </button>
          </div>
        </div>
      </div>
      
      {/* 탭 네비게이션 */}
      <div className="flex border-b mb-6">
        <button
          onClick={() => setActiveTab('posts')}
          className={`px-4 py-2 text-sm font-medium border-b-2 ${
            activeTab === 'posts'
              ? 'text-blue-600 border-blue-600'
              : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          내가 쓴 글 ({myPosts.length})
        </button>
        <button
          onClick={() => setActiveTab('likes')}
          className={`ml-6 px-4 py-2 text-sm font-medium border-b-2 ${
            activeTab === 'likes'
              ? 'text-blue-600 border-blue-600'
              : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          좋아요한 글 ({likedPosts.length})
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`ml-6 px-4 py-2 text-sm font-medium border-b-2 ${
            activeTab === 'settings'
              ? 'text-blue-600 border-blue-600'
              : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          계정 설정
        </button>
      </div>
      
      {/* 내가 쓴 글 */}
      {activeTab === 'posts' && (
        <div>
          {myPosts.length > 0 ? (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr className="border-b">
                    <th className="px-4 py-2 text-left font-medium">제목</th>
                    <th className="px-2 py-2 text-center font-medium w-24">카테고리</th>
                    <th className="px-2 py-2 text-center font-medium w-20">날짜</th>
                    <th className="px-2 py-2 text-center font-medium w-16">조회</th>
                    <th className="px-2 py-2 text-center font-medium w-12">좋아요</th>
                  </tr>
                </thead>
                <tbody>
                  {myPosts.map((post) => (
                    <tr 
                      key={post.id} 
                      className="border-b hover:bg-gray-50 cursor-pointer"
                      onClick={() => router.push(`/read/${post.id}`)}
                    >
                      <td className="px-4 py-3 font-medium text-gray-800">{post.title}</td>
                      <td className="px-2 py-3 text-center text-gray-600">{post.region}</td>
                      <td className="px-2 py-3 text-center text-gray-500">{formatDate(post.created_at)}</td>
                      <td className="px-2 py-3 text-center text-gray-500">{post.view_count || 0}</td>
                      <td className="px-2 py-3 text-center text-gray-500">{post.like_count || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center bg-white rounded-lg shadow">
              <p className="text-gray-500">작성한 글이 없습니다.</p>
              <button
                onClick={() => router.push('/')}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                글 작성하러 가기
              </button>
            </div>
          )}
        </div>
      )}
      
      {/* 좋아요한 글 */}
      {activeTab === 'likes' && (
        <div>
          {likedPosts.length > 0 ? (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr className="border-b">
                    <th className="px-4 py-2 text-left font-medium">제목</th>
                    <th className="px-2 py-2 text-center font-medium w-24">카테고리</th>
                    <th className="px-2 py-2 text-center font-medium w-20">날짜</th>
                    <th className="px-2 py-2 text-center font-medium w-16">조회</th>
                    <th className="px-2 py-2 text-center font-medium w-12">좋아요</th>
                  </tr>
                </thead>
                <tbody>
                  {likedPosts.map((post) => (
                    <tr 
                      key={post.id} 
                      className="border-b hover:bg-gray-50 cursor-pointer"
                      onClick={() => router.push(`/read/${post.id}`)}
                    >
                      <td className="px-4 py-3 font-medium text-gray-800">{post.title}</td>
                      <td className="px-2 py-3 text-center text-gray-600">{post.region}</td>
                      <td className="px-2 py-3 text-center text-gray-500">{formatDate(post.created_at)}</td>
                      <td className="px-2 py-3 text-center text-gray-500">{post.view_count || 0}</td>
                      <td className="px-2 py-3 text-center text-gray-500">{post.like_count || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center bg-white rounded-lg shadow">
              <p className="text-gray-500">좋아요한 글이 없습니다.</p>
              <button
                onClick={() => router.push('/')}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                게시글 둘러보기
              </button>
            </div>
          )}
        </div>
      )}
      
      {/* 계정 설정 */}
      {activeTab === 'settings' && renderSettingsTab()}
    </div>
  );
} 