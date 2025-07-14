// src/components/Header.tsx
import React from "react";

interface User {
  name: string;
}

interface HeaderProps {
  userInfo: User | null;
  onLoginClick: () => void;
  onRegisterClick: () => void;
  onLogoutClick: () => void;
}

const Header: React.FC<HeaderProps> = ({
  userInfo,
  onLoginClick,
  onRegisterClick,
  onLogoutClick,
}) => {
  return (
    <header className="flex justify-between items-center p-4 bg-slate-800 rounded-lg mb-8">
      <h1 className="text-3xl sm:text-4xl font-bold text-sky-400">
        D&D Character Creator
      </h1>
      <div className="flex gap-2 items-center">
        {userInfo ? (
          <>
            <span className="text-white hidden sm:block">
              Welcome, {userInfo.name}!
            </span>
            <button
              onClick={onLogoutClick}
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition-colors"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <button
              onClick={onLoginClick}
              className="bg-sky-600 hover:bg-sky-700 text-white font-bold py-2 px-4 rounded transition-colors"
            >
              Login
            </button>
            <button
              onClick={onRegisterClick}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded transition-colors"
            >
              Register
            </button>
          </>
        )}
      </div>
    </header>
  );
};

export default Header;
