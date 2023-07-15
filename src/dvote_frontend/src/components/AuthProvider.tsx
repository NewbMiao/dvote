import React, { useCallback, useEffect, useState } from "react";
import { AuthClient } from "@dfinity/auth-client";

let iiUrl: string;

const local_ii_url = `http://${process.env.DVOTE_FRONTEND_CANISTER_ID}.localhost:4943`;

if (process.env.DFX_NETWORK === "local") {
  iiUrl = local_ii_url;
} else if (process.env.DFX_NETWORK === "ic") {
  iiUrl = `https://${process.env.DVOTE_FRONTEND_CANISTER_ID}.ic0.app`;
} else {
  // fall back to local
  iiUrl = local_ii_url;
}
console.log("iiUrl", iiUrl);
export const AuthContext = React.createContext({
  loggedIn: false,
  login: () => {},
  logout: () => {},
});
const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [loggedIn, setLoggedIn] = useState(false);
  useEffect(() => {
    (async () => {
      const authClient = await AuthClient.create();
      const isAuthenticated = await authClient.isAuthenticated();
      setLoggedIn(isAuthenticated);
      console.log("isAuthenticated", isAuthenticated);
      // !isAuthenticated && (await login());
    })();
  }, []);
  const login = useCallback(async () => {
    const authClient = await AuthClient.create();

    await authClient.login({
      // identityProvider: iiUrl,
      onSuccess: () => {
        console.log("login success");
      },
      onError: (err) => {
        console.log("login error", err);
      },
    });
  }, []);
  const logout = useCallback(async () => {
    const authClient = await AuthClient.create();

    try {
      await authClient.logout();
      setLoggedIn(false);
    } catch (error) {
      console.error("Logout error:", error);
    }
  }, []);
  const authContextValue = {
    loggedIn,
    login,
    logout,
  };
  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};
export default AuthProvider;
