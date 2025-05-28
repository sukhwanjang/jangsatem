'use client';

import { useParams } from 'next/navigation';
import CategoryPage from '@/components/CategoryPage';
import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { BusinessCard, Post, extraBoards } from '@/lib/categoryData';

export default function MainCategoryPage() {
  const params = useParams();
  const mainCategory = params.main as string;
  
  const [currentPage, setCurrentPage] = useState(1);
  const [businessCards, setBusinessCards] = useState<BusinessCard[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isWriting, setIsWriting] = useState<{ [key: string]: boolean }>({});
  const [newPostContent, setNewPostContent] = useState<string | File>('');
  const [view, setView] = useState<'main' | 'category'>('category');

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    fetchUser();
  }, []);

  useEffect(() => {
    const fetchPosts = async () => {
      const { data: postsData, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching posts:', error);
        return;
      }

      setPosts(postsData || []);
    };

    fetchPosts();
  }, []);

  return (
    <CategoryPage
      selectedCategory={mainCategory}
      activeTab=""
      currentPage={currentPage}
      setCurrentPage={setCurrentPage}
      businessCards={businessCards}
      posts={posts}
      user={user}
      isWriting={isWriting}
      setIsWriting={setIsWriting}
      setNewPostContent={setNewPostContent}
      setPosts={setPosts}
      setSelectedCategory={() => {}}
      setActiveTab={() => {}}
      setView={setView}
    />
  );
} 