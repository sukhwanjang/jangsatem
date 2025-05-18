'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface Post {
  id: number;
  title: string;
  content: string;
  region: string;
  image_url?: string;
  created_at: string;
  user_id: string;
  view_count?: number;
}

interface Comment {
  id: number;
  post_id: number;
  user_id: string;
  content: string;
  created_at: string;
  author_nickname?: string;
}

interface RevenueStat {
  month: string;
  revenue: number;
  type: 'sales' | 'expenses' | 'profit' | 'etc';
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface Like {
  id: number;
  post_id: number;
  user_id: string;
  created_at: string;
}

export default function ReadPage() {
  const router = useRouter();
  const pathname = usePathname();
  const idFromPath = pathname?.split('/').pop();
  const numericId = Number(idFromPath);

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [likeCount, setLikeCount] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authorNickname, setAuthorNickname] = useState('익명');
  const [viewCount, setViewCount] = useState(0);
  const [salesStats, setSalesStats] = useState<RevenueStat[]>([]);
  const [showCopyAlert, setShowCopyAlert] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!numericId || isNaN(numericId)) {
        console.warn("❌ ID가 숫자가 아닙니다.");
        setLoading(false);
        return;
      }

      const { data: postData, error: postError } = await supabase
        .from("posts")
        .select("*")
        .eq("id", numericId)
        .single();

      if (postError || !postData) {
        console.error("❌ 게시글 불러오기 실패:", postError);
        setLoading(false);
        return;
      }

      // 조회수 증가 처리
      const currentViewCount = postData.view_count || 0;
      
      // 현재 로그인한 사용자 정보 가져오기
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      // 본인 글인지 확인 (작성자와 현재 로그인한 사용자가 동일한지)
      const isOwnPost = currentUser && postData.user_id === currentUser.id;
      
      // 본인 글이 아닌 경우에만 조회수 증가
      if (!isOwnPost) {
        const newViewCount = currentViewCount + 1;
        
        // 조회수 업데이트
        const { error: updateError } = await supabase
          .from("posts")
          .update({ view_count: newViewCount })
          .eq("id", numericId);
        
        if (updateError) {
          console.error("❌ 조회수 업데이트 실패:", updateError);
        } else {
          // 업데이트 성공 시 로컬 상태 변경
          setViewCount(newViewCount);
          postData.view_count = newViewCount;
        }
      } else {
        // 본인 글인 경우 조회수 증가 없이 현재 조회수만 표시
        setViewCount(currentViewCount);
      }

      setPost(postData as Post);

      // 작성자 닉네임 가져오기
      if (postData.user_id) {
        console.log("게시글 작성자 ID:", postData.user_id);
        
        try {
          // 1. 소문자 users 테이블에서 user_id로 조회
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('nickname')
            .eq('user_id', postData.user_id)
            .single();
          
          if (!userError && userData) {
            console.log("1차 쿼리 성공:", userData);
            setAuthorNickname(userData.nickname || '익명');
          } else {
            console.log("1차 쿼리 실패:", userError);
            
            // 2. 대문자 Users 테이블에서 user_id로 조회
            const { data: upperUserData, error: upperUserError } = await supabase
              .from('Users')
              .select('nickname')
              .eq('user_id', postData.user_id)
              .single();
            
            if (!upperUserError && upperUserData) {
              console.log("2차 쿼리 성공:", upperUserData);
              setAuthorNickname(upperUserData.nickname || '익명');
            } else {
              console.log("2차 쿼리 실패:", upperUserError);
              
              // 3. id로 조회 시도
              const { data: idUserData, error: idUserError } = await supabase
                .from('users')
                .select('nickname')
                .eq('id', postData.user_id)
                .single();
              
              if (!idUserError && idUserData) {
                console.log("3차 쿼리 성공:", idUserData);
                setAuthorNickname(idUserData.nickname || '익명');
              } else {
                console.log("3차 쿼리 실패:", idUserError);
                
                // 4. 대문자 Users 테이블에서 id로 조회
                const { data: idUpperUserData, error: idUpperUserError } = await supabase
                  .from('Users')
                  .select('nickname')
                  .eq('id', postData.user_id)
                  .single();
                
                if (!idUpperUserError && idUpperUserData) {
                  console.log("4차 쿼리 성공:", idUpperUserData);
                  setAuthorNickname(idUpperUserData.nickname || '익명');
                } else {
                  console.log("모든 쿼리 실패. 기본값 '익명' 사용");
                }
              }
            }
          }
        } catch (error) {
          console.error("작성자 닉네임 조회 중 오류 발생:", error);
        }
      }

      // 댓글 불러오기
      const { data: commentData } = await supabase
        .from('comments')
        .select('*')
        .eq('post_id', numericId)
        .order('created_at', { ascending: true });

      if (commentData) {
        // 댓글 작성자 정보 추가
        const commentsWithAuthors = await Promise.all(
          commentData.map(async (comment) => {
            let authorNickname = '익명';
            
            if (comment.user_id) {
              try {
                // 1. 소문자 users 테이블에서 조회
                const { data: commentAuthorData } = await supabase
                  .from('users')
                  .select('nickname')
                  .eq('user_id', comment.user_id)
                  .single();
                
                if (commentAuthorData && commentAuthorData.nickname) {
                  authorNickname = commentAuthorData.nickname;
                } else {
                  // 2. 대문자 Users 테이블에서 조회
                  const { data: upperCommentAuthorData } = await supabase
                    .from('Users')
                    .select('nickname')
                    .eq('user_id', comment.user_id)
                    .single();
                  
                  if (upperCommentAuthorData && upperCommentAuthorData.nickname) {
                    authorNickname = upperCommentAuthorData.nickname;
                  } else {
                    // 3. id로 조회
                    const { data: idCommentAuthorData } = await supabase
                      .from('users')
                      .select('nickname')
                      .eq('id', comment.user_id)
                      .single();
                    
                    if (idCommentAuthorData && idCommentAuthorData.nickname) {
                      authorNickname = idCommentAuthorData.nickname;
                    } else {
                      // 4. 대문자 Users 테이블에서 id로 조회
                      const { data: idUpperCommentAuthorData } = await supabase
                        .from('Users')
                        .select('nickname')
                        .eq('id', comment.user_id)
                        .single();
                      
                      if (idUpperCommentAuthorData && idUpperCommentAuthorData.nickname) {
                        authorNickname = idUpperCommentAuthorData.nickname;
                      }
                    }
                  }
                }
              } catch (error) {
                console.error("댓글 작성자 닉네임 조회 중 오류:", error);
              }
            }
            
            return {
              ...comment,
              author_nickname: authorNickname
            };
          })
        );
        
        setComments(commentsWithAuthors as Comment[]);
      }

      const { data: likeData, error: likeError } = await supabase
        .from('likes')
        .select('*')
        .eq('post_id', numericId);

      if (!likeError && likeData) {
        setLikeCount(likeData.length);

        const {
          data: { user }
        } = await supabase.auth.getUser();

        if (user) {
          const liked = likeData.some((like) => like.user_id === user.id);
          setHasLiked(liked);
        }
      }

      // 매출 통계 데이터 생성 (이미지에 보이는 차트를 위한 임시 데이터)
      if (post && post.content && (post.content.includes('월매출') || post.content.includes('수익'))) {
        // 예시 데이터 생성
        const mockSalesData: RevenueStat[] = [
          { month: '5월', revenue: 2439000, type: 'sales' },
          { month: '5월', revenue: 1710000, type: 'profit' },
        ];
        setSalesStats(mockSalesData);
      }

      setLoading(false);
    };

    fetchData();
  }, [numericId]);

  const handleCommentSubmit = async () => {
    if (!commentText.trim() || !numericId) return alert("댓글 내용을 입력해주세요.");

    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      return alert("로그인이 필요합니다");
    }

    const { data: insertData, error: insertError } = await supabase
      .from('comments')
      .insert([
        {
          post_id: numericId,
          user_id: user.id,
          content: commentText,
        },
      ])
      .select();

    if (!insertError && insertData && insertData.length > 0) {
      // 사용자 닉네임 가져오기
      let authorNickname = '익명';
      
      console.log("댓글 작성자 ID:", user.id);
      
      try {
        // 1. 소문자 users 테이블에서 조회
        const { data: userData } = await supabase
          .from('users')
          .select('nickname')
          .eq('user_id', user.id)
          .single();
          
        if (userData && userData.nickname) {
          console.log("댓글 작성자 정보(1차):", userData);
          authorNickname = userData.nickname;
        } else {
          // 2. 대문자 Users 테이블에서 조회
          const { data: upperUserData } = await supabase
            .from('Users')
            .select('nickname')
            .eq('user_id', user.id)
            .single();
            
          if (upperUserData && upperUserData.nickname) {
            console.log("댓글 작성자 정보(2차):", upperUserData);
            authorNickname = upperUserData.nickname;
          } else {
            // 3. id로 조회
            const { data: idUserData } = await supabase
              .from('users')
              .select('nickname')
              .eq('id', user.id)
              .single();
              
            if (idUserData && idUserData.nickname) {
              console.log("댓글 작성자 정보(3차):", idUserData);
              authorNickname = idUserData.nickname;
            } else {
              // 4. 대문자 Users 테이블에서 id로 조회
              const { data: idUpperUserData } = await supabase
                .from('Users')
                .select('nickname')
                .eq('id', user.id)
                .single();
                
              if (idUpperUserData && idUpperUserData.nickname) {
                console.log("댓글 작성자 정보(4차):", idUpperUserData);
                authorNickname = idUpperUserData.nickname;
              } else {
                console.log("댓글 작성자 정보를 찾을 수 없음, 기본값 사용");
              }
            }
          }
        }
      } catch (error) {
        console.error("댓글 작성자 정보 조회 중 오류:", error);
      }
      
      const newComment = {
        ...insertData[0],
        author_nickname: authorNickname
      } as Comment;
      
      setComments((prev) => [...prev, newComment]);
      setCommentText('');
    } else {
      console.error('댓글 작성 실패:', insertError);
      alert('댓글 작성 실패: ' + insertError?.message);
    }
  };

  const handleLike = async () => {
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      return alert('로그인이 필요합니다');
    }

    if (hasLiked) {
      return alert('이미 좋아요를 눌렀습니다');
    }

    const { data, error } = await supabase
      .from('likes')
      .insert([{ post_id: numericId, user_id: user.id }])
      .select();

    if (!error && data) {
      setHasLiked(true);
      setLikeCount((prev) => prev + 1);
    } else {
      console.error('좋아요 실패:', error);
      alert('좋아요 실패');
    }
  };

  // 링크 복사 기능
  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setShowCopyAlert(true);
    setTimeout(() => setShowCopyAlert(false), 2000);
  };
  
  // 신고 기능
  const handleReport = () => {
    alert('게시글이 신고되었습니다.');
  };

  if (loading) return <div className="p-10 text-center">불러오는 중...</div>;
  if (!post) return <div className="p-10 text-center text-red-500">잘못된 게시글 ID입니다.</div>;

  // 날짜 형식화 (게시글 작성 시간)
  const formattedDate = new Date(post.created_at).toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* 제목 및 메타 정보 */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-xl font-bold">{post.title}</h1>
          
          {/* 링크 복사 및 신고 버튼 */}
          <div className="flex space-x-2">
            <button 
              onClick={handleCopyLink}
              className="p-2 rounded-full bg-gray-100 hover:bg-gray-200"
              aria-label="링크 복사"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
            <button 
              onClick={handleReport}
              className="p-2 rounded-full bg-gray-100 hover:bg-gray-200"
              aria-label="신고하기"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </button>
          </div>
        </div>
        
        <div className="flex justify-between items-center border-b pb-4">
          <div className="flex items-center">
            <div className="bg-gray-200 w-8 h-8 rounded-full flex items-center justify-center text-gray-600 mr-2">
              {authorNickname.slice(0, 1)}
            </div>
            <div>
              <div className="font-medium">{authorNickname}</div>
              <div className="text-xs text-gray-500">{formattedDate} | 조회 {viewCount}</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* 게시글 내용 */}
      <div className="mb-8">
        {post.image_url && (
          <img
            src={post.image_url}
            alt="게시글 이미지"
            className="w-full mb-4 rounded-lg"
          />
        )}
        <div 
          className="text-gray-800 leading-relaxed break-words"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </div>
      
      {/* 매출 통계 차트 (이미지에 있는 차트와 유사하게 구현) */}
      {salesStats.length > 0 && (
        <div className="mb-8 grid grid-cols-2 gap-4">
          <div className="border rounded-lg p-4">
            <h3 className="text-sm font-semibold mb-2">판매</h3>
            <div className="text-xl font-bold text-blue-600">
              {salesStats[0].revenue.toLocaleString()} 원
            </div>
            <div className="w-full bg-gray-200 h-2 rounded-full mt-2">
              <div className="bg-blue-600 h-2 rounded-full" style={{ width: '80%' }}></div>
            </div>
            <div className="grid grid-cols-4 text-xs mt-2">
              <div>제품</div>
              <div className="text-right">0</div>
              <div>게임머니</div>
              <div className="text-right">0</div>
            </div>
            <div className="grid grid-cols-4 text-xs mt-1">
              <div>상품권</div>
              <div className="text-right">0</div>
              <div>아이템</div>
              <div className="text-right">0</div>
            </div>
          </div>
          
          <div className="border rounded-lg p-4">
            <h3 className="text-sm font-semibold mb-2">구매</h3>
            <div className="text-xl font-bold text-red-500">
              {salesStats[1].revenue.toLocaleString()} 원
            </div>
            <div className="w-full bg-gray-200 h-2 rounded-full mt-2">
              <div className="bg-red-500 h-2 rounded-full" style={{ width: '60%' }}></div>
            </div>
            <div className="grid grid-cols-4 text-xs mt-2">
              <div>제품</div>
              <div className="text-right">{salesStats[1].revenue.toLocaleString()}</div>
              <div>게임머니</div>
              <div className="text-right">0</div>
            </div>
            <div className="grid grid-cols-4 text-xs mt-1">
              <div>상품권</div>
              <div className="text-right">0</div>
              <div>아이템</div>
              <div className="text-right">0</div>
            </div>
          </div>
        </div>
      )}
      
      {/* 출처 */}
      <div className="text-xs text-gray-500 text-right mb-8">
        출처 : 쌸백고단장
      </div>
      
      {/* 좋아요 */}
      <div className="flex justify-center mb-8">
        <button
          className="py-2 px-4 bg-gray-100 hover:bg-gray-200 rounded-full text-sm"
          onClick={() => handleLike()}
        >
          👍 <span className="font-semibold">{likeCount}</span>
        </button>
      </div>
      
      {/* 댓글 섹션 */}
      <div className="border-t pt-6">
        <h2 className="font-semibold mb-4">댓글 {comments.length}개</h2>
        
        {comments.length > 0 ? (
          <div className="space-y-4 mb-6">
            {comments.map((comment) => {
              const commentDate = new Date(comment.created_at).toLocaleString('ko-KR', {
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
              });
              
              return (
                <div key={comment.id} className="border-b pb-4">
                  <div className="flex items-start mb-1">
                    <div className="flex-shrink-0 bg-gray-200 w-8 h-8 rounded-full flex items-center justify-center text-gray-600 mr-2">
                      {comment.author_nickname?.slice(0, 1) || '?'}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-baseline">
                        <span className="font-medium mr-2">{comment.author_nickname}</span>
                        <span className="text-xs text-gray-500">{commentDate}</span>
                      </div>
                      <p className="text-sm mt-1">{comment.content}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-500 text-sm mb-6">아직 댓글이 없습니다. 첫 댓글을 작성해 보세요!</p>
        )}
        
        {/* 댓글 입력 폼 */}
        <div className="flex gap-2">
          <input
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="댓글을 입력하세요..."
            className="flex-1 border rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
          <button
            onClick={handleCommentSubmit}
            className="bg-blue-500 text-white px-4 py-2 rounded-full text-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300"
          >
            등록
          </button>
        </div>
      </div>
      
      {/* 링크 복사 알림 */}
      {showCopyAlert && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded-md text-sm">
          링크가 복사되었습니다!
        </div>
      )}
      
      {/* 목록으로 버튼 */}
      <div className="mt-8 text-center">
        <button
          onClick={() => router.back()}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-sm"
        >
          목록으로
        </button>
      </div>
    </div>
  );
}
