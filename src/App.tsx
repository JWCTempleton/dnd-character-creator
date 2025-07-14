// src/App.tsx
import { useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import apiClient from "./services/apiClient";
import Header from "./components/Header";
import AuthModal from "./components/AuthModal";
import DashboardPage from "./pages/DashboardPage"; // <-- IMPORT PAGE
import CharacterSheetPage from "./pages/CharacterSheetPage"; // <-- IMPORT PAGE

interface User {
  _id: string;
  name: string;
  email: string;
}

function App() {
  const [userInfo, setUserInfo] = useState<User | null>(null);
  const [authMode, setAuthMode] = useState<"login" | "register" | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    apiClient
      .get<User>("/users/profile")
      .then((res) => setUserInfo(res.data))
      .catch(() => setUserInfo(null))
      .finally(() => setIsLoading(false));
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
    await apiClient.post("/users/logout");
    setUserInfo(null);
  };

  const renderLandingPage = () => (
    <div className="text-center mt-20">
      <h2 className="text-4xl font-bold text-amber-300">Welcome!</h2>
      <p className="text-xl mt-4 text-slate-300">
        Please login or register to begin.
      </p>
    </div>
  );

  return (
    <div className="bg-slate-900 min-h-screen p-4 sm:p-8 text-white">
      <Header
        userInfo={userInfo}
        onLogoutClick={handleLogout}
        onLoginClick={() => setAuthMode("login")}
        onRegisterClick={() => setAuthMode("register")}
      />
      {authMode && (
        <AuthModal
          mode={authMode}
          onClose={() => setAuthMode(null)}
          onSubmit={handleAuthSubmit}
          error={authError}
        />
      )}
      <main>
        <Routes>
          <Route
            path="/"
            element={
              isLoading ? (
                <div>Loading...</div>
              ) : userInfo ? (
                <DashboardPage />
              ) : (
                renderLandingPage()
              )
            }
          />
          <Route
            path="/character/:id"
            element={userInfo ? <CharacterSheetPage /> : renderLandingPage()}
          />
        </Routes>
      </main>
    </div>
  );
}

export default App;
