// src/App.tsx
import React, { useState, useEffect } from "react";
import apiClient from "./services/apiClient";
import Header from "./components/Header";
import AuthModal from "./components/AuthModal";

// A simple type for our user state
interface User {
  _id: string;
  name: string;
  email: string;
}

function App() {
  const [userInfo, setUserInfo] = useState<User | null>(null);
  const [authMode, setAuthMode] = useState<"login" | "register" | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  // This effect will check if the user is already logged in when the app loads
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const { data } = await apiClient.get<User>("/users/profile");
        setUserInfo(data);
      } catch (error) {
        // This is expected if the user is not logged in, so we don't need to show an error
        setUserInfo(null);
      }
    };
    fetchUserProfile();
  }, []);

  const handleAuthSubmit = async (formData: any) => {
    setAuthError(null); // Reset error on new submission
    const url = authMode === "login" ? "/users/login" : "/users/register";

    try {
      const { data } = await apiClient.post<User>(url, formData);
      setUserInfo(data);
      setAuthMode(null); // Close the modal on success
    } catch (err: any) {
      // Set the error message from the backend response
      setAuthError(
        err.response?.data?.message || `An error occurred during ${authMode}.`
      );
    }
  };

  // A simple welcome message to show we're logged in
  if (userInfo) {
    return (
      <div className="bg-slate-900 min-h-screen p-8 text-white">
        <h1 className="text-4xl text-center">Welcome, {userInfo.name}!</h1>
      </div>
    );
  }

  // If not logged in, show the main page with auth options
  return (
    <div className="bg-slate-900 min-h-screen p-8 text-white">
      <Header
        onLoginClick={() => {
          setAuthMode("login");
          setAuthError(null);
        }}
        onRegisterClick={() => {
          setAuthMode("register");
          setAuthError(null);
        }}
      />

      {authMode && (
        <AuthModal
          mode={authMode}
          onClose={() => setAuthMode(null)}
          onSubmit={handleAuthSubmit}
          error={authError}
        />
      )}

      <div className="text-center mt-20">
        <h2 className="text-4xl font-bold text-amber-300">
          Welcome to the D&D Character Creator
        </h2>
        <p className="text-xl mt-4 text-slate-300">
          Please login or register to begin creating your characters.
        </p>
      </div>
    </div>
  );
}

export default App;
