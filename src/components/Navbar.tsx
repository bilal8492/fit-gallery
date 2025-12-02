import { supabase } from "../lib/supabaseClient";
import { useSupabaseUser } from "../hooks/useSupabaseUser";

export default function Navbar() {
  const { user } = useSupabaseUser();

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <nav style={{ padding: "16px", borderBottom: "1px solid #ddd" }}>
      <strong>FitGallery</strong>

      <div style={{ float: "right" }}>
        {user ? (
          <>
            <span style={{ marginRight: "8px" }}>{user.email}</span>
            <button onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <span>Not logged in</span>
        )}
      </div>
    </nav>
  );
}
