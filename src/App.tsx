// src/App.tsx
import { useState, useEffect } from "react";
import apiClient from "./services/apiClient";
import Header from "./components/Header";
import AuthModal from "./components/AuthModal";
import CharacterCreator from "./components/CharacterCreator"; // <-- IMPORT

interface User {
  _id: string;
  name: string;
  email: string;
}

function App() {
  const [userInfo, setUserInfo] = useState<User | null>(null);
  const [authMode, setAuthMode] = useState<"login" | "register" | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true); // To prevent UI flicker

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const { data } = await apiClient.get<User>("/users/profile");
        setUserInfo(data);
      } catch (error) {
        setUserInfo(null);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUserProfile();
  }, []);

  const handleAuthSubmit = async (formData: any) => {
    setAuthError(null);
    const url = authMode === "login" ? "/users/login" : "/users/register";
    try {
      const { data } = await apiClient.post<User>(url, formData);
      setUserInfo(data);
      setAuthMode(null);
    } catch (err: any) {
      setAuthError(err.response?.data?.message || "An error occurred.");
    }
  };

  const handleLogout = async () => {
    try {
      await apiClient.post("/users/logout");
      setUserInfo(null);
    } catch (error) {
      console.error("Logout failed", error);
      alert("Could not log out.");
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return <div className="text-center text-white text-2xl">Loading...</div>;
    }

    if (userInfo) {
      return <CharacterCreator />; // <-- RENDER THE CREATOR
    }

    return (
      <div className="text-center mt-20">
        <h2 className="text-4xl font-bold text-amber-300">Welcome!</h2>
        <p className="text-xl mt-4 text-slate-300">
          Please login or register to begin.
        </p>
      </div>
    );
  };

  return (
    <div className="bg-slate-900 min-h-screen p-4 sm:p-8 text-white">
      <Header
        userInfo={userInfo}
        onLoginClick={() => {
          setAuthMode("login");
          setAuthError(null);
        }}
        onRegisterClick={() => {
          setAuthMode("register");
          setAuthError(null);
        }}
        onLogoutClick={handleLogout}
      />

      {authMode && (
        <AuthModal
          mode={authMode}
          onClose={() => setAuthMode(null)}
          onSubmit={handleAuthSubmit}
          error={authError}
        />
      )}

      <main>{renderContent()}</main>
    </div>
  );
}

export default App;
