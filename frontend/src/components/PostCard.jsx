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
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 -960 960 960"
    fill="currentColor"
  >
    <path d="M240-400h480v-80H240v80Zm0-120h480v-80H240v80Zm0-120h480v-80H240v80ZM880-80 720-240H160q-33 0-56.5-23.5T80-320v-480q0-33 23.5-56.5T160-880h640q33 0 56.5 23.5T880-800v720ZM160-320h594l46 45v-525H160v480Zm0 0v-480 480Z"/>
  </svg>

  <span>{commentsCount || ""}</span>
</button>

          <button className="ph-action-btn share" onClick={handleShare}>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 -960 960 960"
    fill="currentColor"
  >
    <path d="M680-80q-50 0-85-35t-35-85q0-6 3-28L282-392q-16 15-37 23.5t-45 8.5q-50 0-85-35t-35-85q0-50 35-85t85-35q24 0 45 8.5t37 23.5l281-164q-2-7-2.5-13.5T560-760q0-50 35-85t85-35q50 0 85 35t35 85q0 50-35 85t-85 35q-24 0-45-8.5T598-672L317-508q2 7 2.5 13.5t.5 14.5q0 8-.5 14.5T317-452l281 164q16-15 37-23.5t45-8.5q50 0 85 35t35 85q0 50-35 85t-85 35Zm0-80q17 0 28.5-11.5T720-200q0-17-11.5-28.5T680-240q-17 0-28.5 11.5T640-200q0 17 11.5 28.5T680-160ZM200-440q17 0 28.5-11.5T240-480q0-17-11.5-28.5T200-520q-17 0-28.5 11.5T160-480q0 17 11.5 28.5T200-440Zm508.5-291.5Q720-743 720-760t-11.5-28.5Q697-800 680-800t-28.5 11.5Q640-777 640-760t11.5 28.5Q663-720 680-720t28.5-11.5Z"/>
  </svg>

  <span>{post.shares_count || ""}</span>
</button>

          <button
  className={`ph-action-btn like ${liked ? "active" : ""}`}
  onClick={handleLike}
>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 -960 960 960"
    fill="currentColor"
  >
    <path d="m480-120-58-52q-101-91-167-157T150-447.5Q111-500 95.5-544T80-634q0-94 63-157t157-63q52 0 99 22t81 62q34-40 81-62t99-22q94 0 157 63t63 157q0 46-15.5 90T810-447.5Q771-395 705-329T538-172l-58 52Zm0-108q96-86 158-147.5t98-107q36-45.5 50-81t14-70.5q0-60-40-100t-100-40q-47 0-87 26.5T518-680h-76q-15-41-55-67.5T300-774q-60 0-100 40t-40 100q0 35 14 70.5t50 81q36 45.5 98 107T480-228Zm0-273Z"/>
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
