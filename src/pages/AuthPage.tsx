import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';

export default function AuthPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'login' | 'signup'>('signup');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);


  const navigate = useNavigate();


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let result;
      if (mode === 'signup') {
        result = await supabase.auth.signUp({
          email,
          password,
        });
      } else {
        result = await supabase.auth.signInWithPassword({
          email,
          password,
        });
      }

      if (result.error) {
        setError(result.error.message);
      } 
      else if (result.data.user?.user_metadata.email_verified === false) {
        setError('Please verify your email before logging in.');
      }
       else {
        console.log('Auth success:', result.data.user?.user_metadata.email_verified);
        // later: redirect to dashboard
         navigate("/app"); // redirect to dashboard
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '40px auto', fontFamily: 'sans-serif' }}>
      <h1>{mode === 'signup' ? 'Sign Up' : 'Log In'}</h1>

      <button
        type="button"
        onClick={() => setMode(mode === 'signup' ? 'login' : 'signup')}
        style={{ marginBottom: 16 }}
      >
        Switch to {mode === 'signup' ? 'Login' : 'Signup'}
      </button>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 12 }}>
          <label>
            Email
            <input
              style={{ display: 'block', width: '100%', padding: 8 }}
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </label>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>
            Password
            <input
              style={{ display: 'block', width: '100%', padding: 8 }}
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </label>
        </div>

        {error && <p style={{ color: 'red' }}>{error}</p>}

        <button type="submit" disabled={loading}>
          {loading ? 'Please wait...' : mode === 'signup' ? 'Create account' : 'Log in'}
        </button>
      </form>
    </div>
  );
}
