import React, { useState } from "react";

interface AuthModalProps {
  mode: "login" | "register";
  onClose: () => void;
  onSubmit: (formData: any) => void;
  error: string | null;
}

const AuthModal: React.FC<AuthModalProps> = ({
  mode,
  onClose,
  onSubmit,
  error,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50">
      <div className="bg-slate-800 p-8 rounded-lg w-full max-w-md relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-4 text-white text-2xl font-bold"
        >
          ×
        </button>
        <h2 className="text-2xl font-bold mb-4 text-center text-sky-400">
          {mode === "login" ? "Login" : "Register"}
        </h2>
        <form onSubmit={handleSubmit}>
          {mode === "register" && (
            <div className="mb-4">
              <label className="block text-slate-300 mb-2" htmlFor="name">
                Name
              </label>
              <input
                type="text"
                name="name"
                id="name"
                required
                className="w-full p-2 rounded bg-slate-700 text-white"
                onChange={handleChange}
              />
            </div>
          )}
          <div className="mb-4">
            <label className="block text-slate-300 mb-2" htmlFor="email">
              Email
            </label>
            <input
              type="email"
              name="email"
              id="email"
              required
              className="w-full p-2 rounded bg-slate-700 text-white"
              onChange={handleChange}
            />
          </div>
          <div className="mb-4">
            <label className="block text-slate-300 mb-2" htmlFor="password">
              Password
            </label>
            <input
              type="password"
              name="password"
              id="password"
              required
              className="w-full p-2 rounded bg-slate-700 text-white"
              onChange={handleChange}
            />
          </div>
          {error && <p className="text-red-500 text-center mb-4">{error}</p>}
          <button
            type="submit"
            className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-2 px-4 rounded transition-colors"
          >
            {mode === "login" ? "Login" : "Register"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AuthModal;
