/**
 * PostCard — Twitter/X-style post card for PadHatke feed.
 * Displays user info, content, engagement actions (like, comment, share).
 */
import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import tracker from "../utils/tracker";

function PostCard({ post, onUpdate }) {
  const { user, token } = useAuth();
  const [liked, setLiked] = useState(post.is_liked || false);
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [commentsCount, setCommentsCount] = useState(post.comments_count || 0);
  const cardRef = useRef(null);
  const viewStart = useRef(Date.now());

  // Track view time on unmount
  useEffect(() => {
    viewStart.current = Date.now();
    return () => {
      const duration = Date.now() - viewStart.current;
      tracker.trackView("post", post.id, duration);
    };
  }, [post.id]);

  // Track hover
  const handleMouseEnter = () => {
    cardRef.current._hoverStart = Date.now();
  };

  const handleMouseLeave = () => {
    if (cardRef.current._hoverStart) {
      const duration = Date.now() - cardRef.current._hoverStart;
      tracker.trackHover("post", post.id, duration);
    }
  };

  const handleLike = async () => {
    if (!user) return;

    setLiked(!liked);
    setLikesCount((prev) => (liked ? prev - 1 : prev + 1));

    try {
      await api.likePost(post.id, token);
      if (!liked) tracker.trackLike("post", post.id);
    } catch (err) {
      // Revert on error
      setLiked(liked);
      setLikesCount(post.likes_count);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || !user) return;

    try {
      await api.commentPost(post.id, commentText.trim(), token);
      setCommentsCount((prev) => prev + 1);
      setCommentText("");
      loadComments();
    } catch (err) {
      console.error("Comment failed:", err);
    }
  };

  const loadComments = async () => {
    try {
      const data = await api.getComments(post.id);
      setComments(data.comments || []);
    } catch (err) {
      console.error("Load comments failed:", err);
    }
  };

  const toggleComments = () => {
    if (!showComments) loadComments();
    setShowComments(!showComments);
  };

  const handleShare = async () => {
    try {
      await api.sharePost(post.id, token);
      tracker.trackShare("post", post.id);
    } catch (err) {
      console.error("Share failed:", err);
    }
  };

  const timeAgo = (dateStr) => {
    if (!dateStr) return "";
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "now";
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    const days = Math.floor(hrs / 24);
    return `${days}d`;
  };

  const getInitial = () => {
    return (post.display_name || post.username || "U").charAt(0).toUpperCase();
  };

  const getAvatarColor = () => {
    const colors = [
      "#1DA1F2", "#794BC4", "#E0245E", "#17BF63",
      "#FF6900", "#F58EA8", "#00BA7C", "#F4212E",
    ];
    const idx = (post.user_id || 0) % colors.length;
    return colors[idx];
  };

  return (
    <div
      className="ph-post-card"
      ref={cardRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="ph-post-avatar" style={{ background: getAvatarColor() }}>
        {getInitial()}
      </div>

      <div className="ph-post-content">
        <div className="ph-post-header">
          <span className="ph-post-displayname">{post.display_name || post.username}</span>
          <span className="ph-post-username">@{post.username}</span>
          <span className="ph-post-dot">·</span>
          <span className="ph-post-time">{timeAgo(post.created_at)}</span>
        </div>

        <div className="ph-post-text">{post.content}</div>

        {post.image_url && (
          <div className="ph-post-image">
            <img src={post.image_url} alt="" loading="lazy" />
          </div>
        )}

        <div className="ph-post-actions">
          <button
            className={`ph-action-btn comment ${showComments ? "active" : ""}`}
            onClick={toggleComments}
          >
            <svg viewBox="0 0 24 24" width="18" height="18">
              <path
                fill="currentColor"
                d="M1.751 10c0-4.42 3.584-8 8.005-8h4.366c4.49 0 8.129 3.64 8.129 8.13 0 2.25-.893 4.37-2.493 5.99l-4.258 4.33c-.39.39-1.024.39-1.414 0-.195-.2-.293-.45-.293-.71v-3.76h-3.97c-4.42 0-8.005-3.58-8.005-8h-.067zm8.005-6c-3.317 0-6.005 2.69-6.005 6s2.688 6 6.005 6H14v4.09l3.78-3.85c1.3-1.32 2.1-3.05 2.1-4.88C19.88 7.32 17.2 4.64 13.71 4.64h-3.954z"
              />
            </svg>
            <span>{commentsCount || ""}</span>
          </button>

          <button className="ph-action-btn share" onClick={handleShare}>
            <svg viewBox="0 0 24 24" width="18" height="18">
              <path
                fill="currentColor"
                d="M4.5 3.88l4.432 4.14-1.364 1.46L5.5 7.55V16c0 1.1.896 2 2 2H13v2H7.5c-2.209 0-4-1.79-4-4V7.55L1.432 9.48.068 8.02 4.5 3.88zM16.5 6H11V4h5.5c2.209 0 4 1.79 4 4v8.45l2.068-1.93 1.364 1.46-4.432 4.14-4.432-4.14 1.364-1.46 2.068 1.93V8c0-1.1-.896-2-2-2z"
              />
            </svg>
            <span>{post.shares_count || ""}</span>
          </button>

          <button
            className={`ph-action-btn like ${liked ? "active" : ""}`}
            onClick={handleLike}
          >
            <svg viewBox="0 0 24 24" width="18" height="18">
              <path
                fill="currentColor"
                d={
                  liked
                    ? "M20.884 13.19c-1.351 2.48-4.001 5.12-8.379 7.67l-.503.3-.504-.3c-4.379-2.55-7.029-5.19-8.382-7.67-1.36-2.5-1.45-4.55-.782-6.14.602-1.43 1.768-2.36 2.997-2.67 1.158-.3 2.506-.12 3.675.67.93.63 1.543 1.47 1.994 2.37.45-.9 1.064-1.74 1.994-2.37 1.17-.79 2.518-.97 3.676-.67 1.229.31 2.395 1.24 2.997 2.67.667 1.59.577 3.64-.783 6.14z"
                    : "M16.697 5.5c-1.222-.06-2.679.51-3.89 2.16l-.805 1.09-.806-1.09C9.984 6.01 8.526 5.44 7.304 5.5c-1.243.07-2.349.78-2.91 1.91-.552 1.12-.633 2.78.479 4.82 1.074 1.97 3.257 4.27 7.129 6.61 3.87-2.34 6.052-4.64 7.126-6.61 1.111-2.04 1.03-3.7.477-4.82-.56-1.13-1.666-1.84-2.908-1.91z"
                }
              />
            </svg>
            <span>{likesCount || ""}</span>
          </button>
        </div>

        {/* Comments section */}
        {showComments && (
          <div className="ph-comments-section">
            {user && (
              <form className="ph-comment-form" onSubmit={handleComment}>
                <input
                  type="text"
                  placeholder="Post your reply"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="ph-comment-input"
                />
                <button
                  type="submit"
                  className="ph-comment-submit"
                  disabled={!commentText.trim()}
                >
                  Reply
                </button>
              </form>
            )}
            {comments.length > 0 ? (
              comments.map((c) => (
                <div key={c.id} className="ph-comment">
                  <strong>@{c.username}</strong>
                  <span>{c.text}</span>
                </div>
              ))
            ) : (
              <p className="ph-no-comments">No replies yet</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default PostCard;
