import React, { memo, useCallback, useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { supabase } from "../lib/supabaseClient";
import { useSupabaseUser } from "../hooks/useSupabaseUser";

type Post = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  created_at: string;
};

function Dashboard() {
  const user = useSupabaseUser();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [posts, setPosts] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");

  const [file, setFile] = useState<File | null>(null);

  // Fetch posts when user is ready
  useEffect(() => {
    if (user) {
      fetchPosts();
    }
  }, [user]);

  const fetchPosts = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .eq("user_id", user.user?.id)
      .order("created_at", { ascending: false });

    if (!error) setPosts(data || []);
    setLoading(false);
  }, [user.user?.id]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    setFile(selected || null);
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    let imageUrl = "";

    if (file) {
      const fileExt = file.name.split(".").pop();
      const filePath = `${user.user?.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("post-images")
        .upload(filePath, file);

      if (uploadError) {
        console.error("Upload error:", uploadError.message);
      } else {
        const { data: publicUrlData } = supabase.storage
          .from("post-images")
          .getPublicUrl(filePath);
        imageUrl = publicUrlData.publicUrl;
      }
    }

    const { error } = await supabase.from("posts").insert([
      {
        user_id: user.user?.id,
        title,
        description,
        image_url: imageUrl,
      },
    ]);

    if (!error) {
      setTitle("");
      setDescription("");
      setFile(null);
      fetchPosts();
    }
  };

  const startEditing = (post: Post) => {
    setEditingId(post.id);
    setEditTitle(post.title);
    setEditDescription(post.description || "");
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditTitle("");
    setEditDescription("");
  };

  const handleUpdatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId || !user) return;

    const { error } = await supabase
      .from("posts")
      .update({
        title: editTitle,
        description: editDescription,
      })
      .eq("id", editingId)
      .eq("user_id", user.user?.id); // extra safety, RLS also restricts

    if (error) {
      console.error("Error updating post:", error.message);
      return;
    }

    cancelEditing();
    fetchPosts();
  };

  const handleDeletePost = async (id: string) => {
  if (!user) return;

  const confirmDelete = window.confirm("Are you sure?");
  if (!confirmDelete) return;

  // 1️⃣ Get real image URL from DB
  const { data: post, error: fetchError } = await supabase
    .from("posts")
    .select("image_url")
    .eq("id", id)
    .single();

  if (fetchError) {
    console.error("Fetch error:", fetchError.message);
    return;
  }

  const imageUrl = post?.image_url;

  // 2️⃣ Delete from storage
  if (imageUrl) {
    const url = new URL(imageUrl);
    const pathname = url.pathname;
    const filePath = pathname.split("/post-images/")[1];

    console.log("🗑 Deleting storage key:", filePath);

    const { data, error: storageError } = await supabase.storage
      .from("post-images")
      .remove([filePath]);

    if (storageError) {
      console.error("Storage delete error:", storageError.message);
    } else {
      console.log("🔥 Storage delete success:", data);
    }
  }

  // 3️⃣ Delete DB row
  const { error } = await supabase
    .from("posts")
    .delete()
    .eq("id", id)
    .eq("user_id", user.user?.id);

  if (error) {
    console.error("DB delete error:", error.message);
    return;
  }

  setPosts((prev) => prev.filter((p) => p.id !== id));
};


  return (
    <>
      <div>Dashboard</div>
      <Navbar />
      {/* Create Post */}
      <section style={{ marginBottom: 24 }}>
        <h3>Create New Post</h3>
        <form onSubmit={handleCreatePost}>
          <div style={{ marginBottom: 8 }}>
            <input
              type="text"
              placeholder="Title"
              value={title}
              required
              onChange={(e) => setTitle(e.target.value)}
              style={{ width: "100%", padding: 8 }}
            />
          </div>
          <div style={{ marginBottom: 8 }}>
            <textarea
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ width: "100%", padding: 8, minHeight: 60 }}
            />
          </div>
          <div style={{ marginBottom: 8 }}>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              style={{ marginBottom: 8 }}
            />
          </div>

          <button type="submit">Add Post</button>
        </form>
      </section>

      {/* Posts List */}
      <section>
        <h3>Your Posts</h3>
        {loading && <p>Loading...</p>}
        {!loading && posts.length === 0 && <p>No posts yet.</p>}

        <ul style={{ listStyle: "none", padding: 0 }}>
          {posts.map((post) => (
            <li
              key={post.id}
              style={{
                border: "1px solid #ddd",
                padding: 12,
                borderRadius: 8,
                marginBottom: 12,
              }}
            >
              {editingId === post.id ? (
                // Edit mode
                <form onSubmit={handleUpdatePost}>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    required
                    style={{ width: "100%", padding: 6, marginBottom: 8 }}
                  />
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    style={{
                      width: "100%",
                      padding: 6,
                      minHeight: 60,
                      marginBottom: 8,
                    }}
                  />
                  <button type="submit" style={{ marginRight: 8 }}>
                    Save
                  </button>
                  <button type="button" onClick={cancelEditing}>
                    Cancel
                  </button>
                </form>
              ) : (
                // View mode
                <>
                  <strong>{post.title}</strong>
                  <p style={{ margin: "4px 0 8px" }}>{post.description}</p>
                  {post.image_url && (
                    <div>
                      <img
                        src={post.image_url}
                        alt="post"
                        style={{
                          width: "100%",
                          borderRadius: 8,
                          marginBottom: 8,
                        }}
                      />
                    </div>
                  )}
                  <small>{new Date(post.created_at).toLocaleString()}</small>
                  <div style={{ marginTop: 8 }}>
                    <button
                      onClick={() => startEditing(post)}
                      style={{ marginRight: 8 }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeletePost(post.id)}
                    >
                      Delete
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}

export default memo(Dashboard);
