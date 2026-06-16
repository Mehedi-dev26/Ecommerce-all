import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import { hasAdminRole } from "@/lib/admin-auth";

const ADMIN_AUTH_TIMEOUT_MS = 8000;

const withTimeout = <T,>(promise: Promise<T>, ms: number, message: string) =>
  new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error(message)), ms);
    promise
      .then(resolve, reject)
      .finally(() => window.clearTimeout(timer));
  });

export function useAdminAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const requestIdRef = useRef(0);

  useEffect(() => {
    let isActive = true;

    const resolveSession = async (sessionUser: User | null) => {
      const requestId = ++requestIdRef.current;

      if (!sessionUser) {
        if (!isActive) return;
        setUser(null);
        setIsAdmin(false);
        setLoading(false);
        navigate("/admin/login", { replace: true });
        return;
      }

      try {
        const admin = await withTimeout(
          hasAdminRole(sessionUser.id),
          ADMIN_AUTH_TIMEOUT_MS,
          "Admin verification timed out"
        );

        if (!isActive || requestId !== requestIdRef.current) {
          return;
        }

        if (!admin) {
          setUser(null);
          setIsAdmin(false);
          setLoading(false);
          void supabase.auth.signOut();
          navigate("/admin/login", { replace: true });
          return;
        }

        setUser(sessionUser);
        setIsAdmin(true);
      } catch (error) {
        if (!isActive || requestId !== requestIdRef.current) {
          return;
        }

        console.error("Failed to verify admin session", error);
        setUser(null);
        setIsAdmin(false);
        void supabase.auth.signOut();
        navigate("/admin/login", { replace: true });
      } finally {
        if (isActive && requestId === requestIdRef.current) {
          setLoading(false);
        }
      }
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "INITIAL_SESSION") {
        return;
      }

      void resolveSession(session?.user ?? null);
    });

    void supabase.auth
      .getSession()
      .then((result) => withTimeout(Promise.resolve(result), ADMIN_AUTH_TIMEOUT_MS, "Admin session restore timed out"))
      .then(({ data: { session } }) => resolveSession(session?.user ?? null))
      .catch((error) => {
        console.error("Failed to restore admin session", error);

        if (!isActive) {
          return;
        }

        setUser(null);
        setIsAdmin(false);
        setLoading(false);
        navigate("/admin/login", { replace: true });
      });

    return () => {
      isActive = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate("/admin/login", { replace: true });
  };

  return { user, isAdmin, loading, signOut };
}
