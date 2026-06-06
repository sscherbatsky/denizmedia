"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";

interface Author {
  id: string;
  username: string;
  displayName: string | null;
  profileImage: string | null;
  isVerified: boolean;
}

interface PostProps {
  id: string;
  content: string;
  author: Author;
  likes: { userId: string }[];
  comments: { id: string }[];
  createdAt: string;
  onDelete?: (id: string) => void;
}

export default function PostCard({ id, content, author, likes, comments, createdAt, onDelete }: PostProps) {
  const { data: session } = useSession();
  const [isLiked, setIsLiked] = useState(likes.some((l) => l.userId === session?.user?.id));
  const [likeCount, setLikeCount] = useState(likes.length);
  const [showComments, setShowComments] = useState(false);
  const [commentList, setCommentList] = useState<Array<{
    id: string;
    content: string;
    createdAt: string;
    author: Author;
  }>>([]);
  const [commentText, setCommentText] = useState("");
  const [commentCount, setCommentCount] = useState(comments.length);

  const handleLike = async () => {
    const res = await fetch(`/api/posts/${id}/like`, { method: "POST" });
    const data = await res.json();
    setIsLiked(data.liked);
    setLikeCount((prev) => (data.liked ? prev + 1 : prev - 1));
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    const res = await fetch(`/api/posts/${id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: commentText }),
    });

    if (res.ok) {
      const comment = await res.json();
      setCommentList((prev) => [comment, ...prev]);
      setCommentCount((prev) => prev + 1);
      setCommentText("");
    }
  };

  const loadComments = async () => {
    if (!showComments) {
      const res = await fetch(`/api/posts/${id}`);
      const data = await res.json();
      setCommentList(data.comments || []);
    }
    setShowComments(!showComments);
  };

  const handleDelete = async () => {
    if (!confirm("Bu gönderiyi silmek istediğinize emin misiniz?")) return;
    const res = await fetch(`/api/posts/${id}`, { method: "DELETE" });
    if (res.ok && onDelete) onDelete(id);
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition">
      <div className="flex items-start gap-3">
        <Link href={`/profile/${author.username}`}>
          <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-sm font-bold text-white shrink-0 overflow-hidden">
            {author.profileImage ? (
              <img src={author.profileImage} alt="" className="w-full h-full object-cover" />
            ) : (
              author.username[0]?.toUpperCase()
            )}
          </div>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 flex-wrap">
            <Link href={`/profile/${author.username}`} className="font-semibold text-white hover:underline text-sm">
              {author.displayName || author.username}
            </Link>
            {author.isVerified && (
              <svg className="w-4 h-4 text-blue-500 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
              </svg>
            )}
            <Link href={`/profile/${author.username}`} className="text-gray-500 text-sm">
              @{author.username}
            </Link>
            <span className="text-gray-600 text-sm">·</span>
            <span className="text-gray-500 text-xs">
              {formatDistanceToNow(new Date(createdAt), { addSuffix: true, locale: tr })}
            </span>
          </div>
          <p className="text-gray-200 mt-1 whitespace-pre-wrap break-words text-sm">{content}</p>

          <div className="flex items-center gap-4 mt-3">
            <button onClick={handleLike} className={`flex items-center gap-1 text-sm transition ${isLiked ? "text-red-500" : "text-gray-500 hover:text-red-500"}`}>
              <svg className="w-5 h-5" fill={isLiked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              {likeCount > 0 && likeCount}
            </button>

            <button onClick={loadComments} className="flex items-center gap-1 text-sm text-gray-500 hover:text-blue-500 transition">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              {commentCount > 0 && commentCount}
            </button>

            {(session?.user?.id === author.id) && (
              <button onClick={handleDelete} className="text-gray-500 hover:text-red-500 text-sm transition ml-auto">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>

          {showComments && (
            <div className="mt-3 border-t border-gray-800 pt-3">
              <form onSubmit={handleComment} className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Yorum yaz..."
                  className="flex-1 bg-gray-800 text-white text-sm rounded-lg px-3 py-2 border border-gray-700 focus:border-blue-500 focus:outline-none"
                />
                <button type="submit" className="bg-blue-600 text-white text-sm px-3 py-2 rounded-lg hover:bg-blue-700 transition">
                  Gönder
                </button>
              </form>
              <div className="space-y-2">
                {commentList.map((comment) => (
                  <div key={comment.id} className="flex items-start gap-2">
                    <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold text-white shrink-0 overflow-hidden">
                      {comment.author.profileImage ? (
                        <img src={comment.author.profileImage} alt="" className="w-full h-full object-cover" />
                      ) : (
                        comment.author.username[0]?.toUpperCase()
                      )}
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-white">{comment.author.displayName || comment.author.username}</span>
                      {comment.author.isVerified && (
                        <svg className="w-3 h-3 text-blue-500 inline ml-1" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                        </svg>
                      )}
                      <p className="text-gray-300 text-sm">{comment.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
