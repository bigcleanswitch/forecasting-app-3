import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const AuthSignUp: React.FC = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [teamName, setTeamName] = useState('');
  const [pendingInvite, setPendingInvite] = useState(false);
  const [team, setTeam] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // 1. Sign up the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      })
      if (authError) throw authError
      if (!authData.user) throw new Error('No user data returned')
      // If no session is returned, email confirmation is required
      if (!authData.session) {
        // Store extra sign-up data in localStorage for onboarding after confirmation
        localStorage.setItem('pendingSignupFirstName', firstName);
        localStorage.setItem('pendingSignupLastName', lastName);
        localStorage.setItem('pendingSignupTeamName', teamName);
        setError('Registration successful! Please check your email to confirm your account before continuing.');
        setLoading(false);
        return;
      }
      // Only if session is present (no email confirmation required), create team/profile here
      if (pendingInvite && team) {
        // ... existing code ...
      } else {
        // ... existing code ...
      }
      localStorage.removeItem('pendingInviteId')
      router.push('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container">
      <div className="card" style={{maxWidth: 400, margin: '2rem auto'}}>
        <h1>Sign Up</h1>
        <form onSubmit={handleSignUp} className="flex flex-col gap-md">
          <label htmlFor="firstName">First Name</label>
          <input id="firstName" type="text" value={firstName} onChange={e => setFirstName(e.target.value)} required />
          <label htmlFor="lastName">Last Name</label>
          <input id="lastName" type="text" value={lastName} onChange={e => setLastName(e.target.value)} required />
          <label htmlFor="teamName">Team/Company Name</label>
          <input id="teamName" type="text" value={teamName} onChange={e => setTeamName(e.target.value)} required />
          <label htmlFor="email">Email</label>
          <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          <label htmlFor="password">Password</label>
          <input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          <button type="submit" className="button" disabled={loading}>Sign Up</button>
          {error && <div className="card" style={{background: 'var(--color-secondary-coral)', color: 'var(--color-white)', marginTop: '1rem'}}>{error}</div>}
        </form>
      </div>
    </div>
  );
}

export default AuthSignUp; 