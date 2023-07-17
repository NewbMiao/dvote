import React, { useCallback, useEffect, useState } from "react";
import { AuthClient } from "@dfinity/auth-client";
import { HttpAgent } from "@dfinity/agent";
import {
  createActor,
  dvote_backend,
} from "../../../declarations/dvote_backend";

export interface AuthContextType {
  loggedIn: false;
  login: () => {};
  logout: () => {};
  backendActor: typeof dvote_backend;
}
export const AuthContext = React.createContext({} as AuthContextType);
const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [loggedIn, setLoggedIn] = useState(false);
  const [backendActor, setActor] = useState<typeof dvote_backend>();
  useEffect(() => {
    (async () => {
      const authClient = await AuthClient.create();
      const isAuthenticated = await authClient.isAuthenticated();
      setLoggedIn(isAuthenticated);
      console.log(
        "isAuthenticated",
        isAuthenticated,
        await updateBackendActor()
      );
    })();
  }, []);
  const updateBackendActor = useCallback(async () => {
    const authClient = await AuthClient.create();
    const identity = await authClient.getIdentity();
    if (
      // use local backend in local mode
      identity.getPrincipal().isAnonymous() ||
      !process.env.DVOTE_BACKEND_CANISTER_ID
    ) {
      setActor(dvote_backend);
      return;
    }
    const agent = new HttpAgent({ identity });

    const actor = await createActor(process.env.DVOTE_BACKEND_CANISTER_ID, {
      agent,
    });
    setActor(actor);

    console.log(
      "createActor with principal",
      identity.getPrincipal().toString(),
      await backendActor?.whoami()
    );
  }, []);
  const login = useCallback(async () => {
    const authClient = await AuthClient.create();

    await authClient.login({
      onSuccess: async () => {
        setLoggedIn(true);
        await updateBackendActor();
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
      await updateBackendActor();
      setLoggedIn(false);
      console.log("logout success");
      setLoggedIn(false);
    } catch (error) {
      console.error("Logout error:", error);
    }
  }, []);
  const authContextValue = {
    loggedIn,
    login,
    logout,
    backendActor,
  };
  return (
    <AuthContext.Provider value={authContextValue as AuthContextType}>
      {children}
    </AuthContext.Provider>
  );
};
export default AuthProvider;
