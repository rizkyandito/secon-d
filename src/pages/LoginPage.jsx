import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Navigate } from 'react-router-dom';

export default function LoginPage() {
  const { user, login } = useAuth();
  const [cred, setCred] = useState({ username: '', password: '' });
  const navigate = useNavigate();

  const doLogin = async (e) => {
    e.preventDefault();
    const r = await login(cred.username, cred.password);
    if (!r.ok) return alert(r.message);
    navigate('/cuegua', { replace: true });
  };

  if (user) {
    return <Navigate to="/cuegua" replace />;
  }

  return (
    <div className="fixed inset-0 bg-slate-100 flex items-center justify-center">
      <div className="card max-w-md w-full p-8">
        <div className="text-center text-2xl font-bold">Login Admin</div>
        <form onSubmit={doLogin} className="space-y-3 mt-4">
          <input
            value={cred.username}
            onChange={(e) => setCred({ ...cred, username: e.target.value })}
            placeholder="Username"
            className="w-full border rounded-2xl px-4 py-3 dark:bg-slate-800"
          />
          <input
            type="password"
            value={cred.password}
            onChange={(e) => setCred({ ...cred, password: e.target.value })}
            placeholder="Password"
            className="w-full border rounded-2xl px-4 py-3 dark:bg-slate-800"
          />
          <button className="btn btn-primary w-full">Masuk</button>
        </form>
        <div className="text-xs text-slate-500 mt-2 text-center"></div>
      </div>
    </div>
  );
}
