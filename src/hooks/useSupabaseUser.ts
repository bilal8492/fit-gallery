import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export function useSupabaseUser() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get current user
    supabase.auth.getUser().then(({ data }) => {
      console.log("🚀 ~ useSupabaseUser ~ data:", data)
      setUser(data.user ?? null);
      setLoading(false);
    });

    // Listen to auth state changes (login/logout)
    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.subscription.unsubscribe();
  }, []);

  return { user, loading };
}
