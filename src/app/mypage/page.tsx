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
}

export default function MyPage() {
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
    }
  }, [profile]);

  // 날짜 포맷팅 함수
  const formatDate = (dateString?: string) => {
    if (!dateString) return '알 수 없음';
    const date = new Date(dateString);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const handleSaveProfile = async () => {
    if (!user || !profile) return;
    
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
      
      // Supabase users 테이블에 사용자 정보가 있는지 확인
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('*')
        .eq('user_id', user.id)
        .single();

      // 대문자 Users 테이블에서도 확인
      const { data: existingUpperUser, error: checkUpperError } = await supabase
        .from('Users')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      let result;
      let resultUpper;
      
      // 소문자 users 테이블 업데이트 또는 생성
      if (checkError || !existingUser) {
        // 사용자 정보가 없으면 새로 생성
        result = await supabase
          .from('users')
          .insert([
            {
              user_id: user.id,
              nickname: nickname,
              username: nickname, // username 필드도 함께 업데이트
              email: user.email,
              join_date: user.created_at
            }
          ]);
      } else {
        // 사용자 정보가 있으면 닉네임 업데이트
        result = await supabase
          .from('users')
          .update({ 
            nickname: nickname,
            username: nickname // username 필드도 함께 업데이트
          })
          .eq('user_id', user.id);
      }
      
      // 대문자 Users 테이블 업데이트 또는 생성
      if (checkUpperError || !existingUpperUser) {
        // 대문자 테이블에 사용자 정보가 없으면 생성 시도 (에러 무시)
        try {
          resultUpper = await supabase
            .from('Users')
            .insert([
              {
                user_id: user.id,
                nickname: nickname,
                username: nickname,
                email: user.email,
                join_date: user.created_at
              }
            ]);
        } catch (e) {
          console.log('대문자 테이블 생성 시도 중 오류 (무시):', e);
        }
      } else {
        // 대문자 테이블에 사용자 정보가 있으면 업데이트
        try {
          resultUpper = await supabase
            .from('Users')
            .update({ 
              nickname: nickname,
              username: nickname 
            })
            .eq('user_id', user.id);
        } catch (e) {
          console.log('대문자 테이블 업데이트 중 오류 (무시):', e);
        }
      }
      
      if (result.error) {
        throw result.error;
      }
      
      // 프로필 상태 업데이트
      setProfile({
        ...profile,
        nickname: nickname,
        username: nickname
      });
      
      setSaveMessage({
        type: 'success',
        text: '프로필이 성공적으로 저장되었습니다.'
      });
      
      // 3초 후 메시지 숨기기
      setTimeout(() => {
        setSaveMessage(null);
      }, 3000);
      
    } catch (error) {
      console.error('프로필 저장 중 오류 발생:', error);
      setSaveMessage({
        type: 'error',
        text: '프로필 저장 중 오류가 발생했습니다.'
      });
    } finally {
      setIsSaving(false);
    }
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
            {profile.profile_image ? (
              <img src={profile.profile_image} alt="프로필 이미지" className="w-full h-full object-cover" />
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
      {activeTab === 'settings' && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">계정 설정</h2>
          
          {saveMessage && (
            <div className={`mb-4 p-3 rounded-md ${saveMessage.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {saveMessage.text}
            </div>
          )}
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">닉네임</label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
            <input
              type="email"
              value={profile?.email || ''}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
            />
            <p className="mt-1 text-xs text-gray-500">이메일은 변경할 수 없습니다.</p>
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">프로필 이미지</label>
            <div className="flex items-center mt-2">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden mr-4">
                {profile?.profile_image ? (
                  <img src={profile.profile_image} alt="프로필 이미지" className="w-full h-full object-cover" />
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-gray-400">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                )}
              </div>
              <button
                className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300"
              >
                이미지 업로드
              </button>
            </div>
          </div>
          
          <div className="flex justify-end gap-3">
            <button
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              onClick={() => {
                setActiveTab('posts');
                if (profile) setNickname(profile.nickname);
              }}
            >
              취소
            </button>
            <button
              className={`px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center`}
              onClick={handleSaveProfile}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  저장 중...
                </>
              ) : '저장'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 