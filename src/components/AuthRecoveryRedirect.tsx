import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

/**
 * Supabase password-recovery emails redirect to the Site URL with either:
 *   - PKCE flow:    /?code=<code>
 *   - Implicit flow: /#access_token=...&type=recovery
 *
 * This component runs on every route, and if it detects a recovery payload
 * on any path other than /reset-password, it forwards the user (with the
 * query/hash intact) so the reset page can complete the flow.
 */
const AuthRecoveryRedirect = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.pathname === "/reset-password") return;

    const search = location.search || "";
    const hash = location.hash || "";

    const hasCode = /[?&]code=/.test(search);
    const isRecoveryHash = hash.includes("type=recovery") || hash.includes("access_token");

    // The PKCE `?code=` is also used by OAuth (Google) sign-in, which Supabase
    // handles silently on /login. Only forward when we're NOT on /login and
    // there's no Google OAuth state marker.
    const looksLikeOAuth = hash.includes("provider_token") || search.includes("provider=");

    if ((hasCode && !looksLikeOAuth && location.pathname !== "/login") || isRecoveryHash) {
      navigate(`/reset-password${search}${hash}`, { replace: true });
    }
  }, [location.pathname, location.search, location.hash, navigate]);

  return null;
};

export default AuthRecoveryRedirect;
