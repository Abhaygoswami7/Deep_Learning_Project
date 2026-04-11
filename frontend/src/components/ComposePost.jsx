/**
 * ComposePost — Post composer for PadHatke.
 * Character-limited text input with post button.
 */
import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";

const MAX_CHARS = 500;

function ComposePost({ onPostCreated }) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const { user, token } = useAuth();

  if (!user) return null;

  const charsLeft = MAX_CHARS - content.length;
  const isOverLimit = charsLeft < 0;
  const isNearLimit = charsLeft < 50;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() || isOverLimit || loading) return;

    setLoading(true);
    try {
      const data = await api.createPost(content.trim(), token);
      setContent("");
      if (onPostCreated) onPostCreated(data.post);
    } catch (err) {
      console.error("Post failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const getInitial = () => {
    return (user.display_name || user.username || "U").charAt(0).toUpperCase();
  };

  const fileInputRef = React.useRef(null);

const handleImageClick = () => {
  fileInputRef.current.click();
};

const handleImageChange = (e) => {
  const file = e.target.files[0];
  if (file) {
    console.log("Selected file:", file);
    // later you can upload or preview
  }
};

  return (
    <div className="ph-compose">
      <input
  type="file"
  accept="image/*"
  ref={fileInputRef}
  style={{ display: "none" }}
  onChange={handleImageChange}
/>
      <div className="ph-compose-avatar">
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 -960 960 960"
    className="ph-compose-avatar-svg"
  >
    <path d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z"/>
  </svg>
</div>
      <form className="ph-compose-form" onSubmit={handleSubmit}>
        <textarea
          className="ph-compose-input"
          placeholder="What's happening?"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
          maxLength={MAX_CHARS + 10}
        />
        <div className="ph-compose-footer">
          <div className="ph-compose-tools">
            <button
  type="button"
  className="ph-compose-tool"
  title="Image"
  onClick={handleImageClick}
>
  <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#000">
    <path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H200Zm0-80h560v-560H200v560Zm40-80h480L570-480 450-320l-90-120-120 160Zm-40 80v-560 560Z"/>
  </svg>
</button>
            <button type="button" className="ph-compose-tool" title="Link"><svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#000"><path d="M318-120q-82 0-140-58t-58-140q0-40 15-76t43-64l134-133 56 56-134 134q-17 17-25.5 38.5T200-318q0 49 34.5 83.5T318-200q23 0 45-8.5t39-25.5l133-134 57 57-134 133q-28 28-64 43t-76 15Zm79-220-57-57 223-223 57 57-223 223Zm251-28-56-57 134-133q17-17 25-38t8-44q0-50-34-85t-84-35q-23 0-44.5 8.5T558-726L425-592l-57-56 134-134q28-28 64-43t76-15q82 0 139.5 58T839-641q0 39-14.5 75T782-502L648-368Z"/></svg></button>
            <button type="button" className="ph-compose-tool" title="Emoji"><svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#000"><path d="M480-480Zm0 400q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q43 0 83 8.5t77 24.5v90q-35-20-75.5-31.5T480-800q-133 0-226.5 93.5T160-480q0 133 93.5 226.5T480-160q133 0 226.5-93.5T800-480q0-32-6.5-62T776-600h86q9 29 13.5 58.5T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm320-600v-80h-80v-80h80v-80h80v80h80v80h-80v80h-80ZM620-520q25 0 42.5-17.5T680-580q0-25-17.5-42.5T620-640q-25 0-42.5 17.5T560-580q0 25 17.5 42.5T620-520Zm-280 0q25 0 42.5-17.5T400-580q0-25-17.5-42.5T340-640q-25 0-42.5 17.5T280-580q0 25 17.5 42.5T340-520Zm263.5 221.5Q659-337 684-400H276q25 63 80.5 101.5T480-260q68 0 123.5-38.5Z"/></svg></button>
          </div>
          <div className="ph-compose-right">
            <button
  type="submit"
  className={`ph-compose-btn ${content.trim() ? "active" : ""}`}
  disabled={!content.trim() || isOverLimit || loading}
>
  {loading ? "Posting..." : "Post"}
</button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default ComposePost;
