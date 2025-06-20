'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-browser'
import type { Database } from '@/types/supabase'

type TeamInvite = Database['public']['Tables']['team_invites']['Row']
type Team = Database['public']['Tables']['teams']['Row']

export default function SignUp() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [teamName, setTeamName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [pendingInvite, setPendingInvite] = useState<TeamInvite | null>(null)
  const [team, setTeam] = useState<Team | null>(null)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null)

  useEffect(() => {
    // Check for pending invite
    const inviteId = localStorage.getItem('pendingInviteId')
    if (inviteId) {
      loadInviteData(inviteId)
    }
  }, [])

  const loadInviteData = async (inviteId: string) => {
    try {
      // Get invite details
      const { data: inviteData, error: inviteError } = await supabase
        .from('team_invites')
        .select('*')
        .eq('id', inviteId)
        .single()

      if (inviteError) throw inviteError
      if (!inviteData) throw new Error('Invite not found')
      if (inviteData.status !== 'pending') throw new Error('Invite is no longer valid')
      if (new Date(inviteData.expires_at) < new Date()) throw new Error('Invite has expired')

      setPendingInvite(inviteData)
      setEmail(inviteData.email)

      // Get team details
      const { data: teamData, error: teamError } = await supabase
        .from('teams')
        .select('*')
        .eq('id', inviteData.team_id)
        .single()

      if (teamError) throw teamError
      if (!teamData) throw new Error('Team not found')
      if (teamData.member_count >= 5) throw new Error('Team has reached maximum capacity')

      setTeam(teamData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      localStorage.removeItem('pendingInviteId')
    }
  }

  // Password validation function
  const validatePassword = (pwd: string) => {
    const requirements = [
      { regex: /.{8,}/, message: 'At least 8 characters' },
      { regex: /[A-Z]/, message: 'At least one uppercase letter' },
      { regex: /[a-z]/, message: 'At least one lowercase letter' },
      { regex: /[0-9]/, message: 'At least one number' },
      { regex: /[^A-Za-z0-9]/, message: 'At least one special character' },
    ]
    for (const req of requirements) {
      if (!req.regex.test(pwd)) return req.message
    }
    return null
  }

  useEffect(() => {
    setPasswordError(password ? validatePassword(password) : null)
    setConfirmPasswordError(
      confirmPassword && password !== confirmPassword ? 'Passwords do not match' : null
    )
  }, [password, confirmPassword])

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    if (passwordError) {
      setError(passwordError)
      setLoading(false)
      return
    }
    if (confirmPasswordError) {
      setError(confirmPasswordError)
      setLoading(false)
      return
    }
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
        console.log('No session present after sign-up. Storing data in localStorage and returning.');
        setError('Registration successful! Please check your email to confirm your account before continuing.');
        setLoading(false);
        return;
      }
      // Only if session is present (no email confirmation required), create team/profile here
      console.log('Session present after sign-up. Proceeding to create team/profile. User:', authData.user);
      if (pendingInvite && team) {
        // Handle team invite
        const { error: inviteError } = await supabase
          .from('team_invites')
          .update({ status: 'accepted' })
          .eq('id', pendingInvite.id)
        if (inviteError) throw inviteError
        // Create user profile and add to team
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            email,
            first_name: firstName,
            last_name: lastName,
            role: 'member',
            team_id: team.id,
          })
        if (profileError) throw profileError
        // Update team member count
        const { error: teamError } = await supabase
          .from('teams')
          .update({ member_count: team.member_count + 1 })
          .eq('id', team.id)
        if (teamError) throw teamError
      } else {
        // Create a new team
        const { data: teamData, error: teamError } = await supabase
          .from('teams')
          .insert({
            name: teamName,
            owner_id: authData.user.id,
            member_count: 1,
          })
          .select()
          .single()
        if (teamError) throw teamError
        // Create the user's profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            email,
            first_name: firstName,
            last_name: lastName,
            role: 'owner',
            team_id: teamData.id,
          })
        if (profileError) {
          // Roll back: delete the team if profile creation fails
          await supabase.from('teams').delete().eq('id', teamData.id)
          throw profileError
        }
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {pendingInvite ? 'Join Team' : 'Create your account'}
          </h2>
          {pendingInvite && (
            <p className="mt-2 text-center text-sm text-gray-600">
              You've been invited to join {team?.name}
            </p>
          )}
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSignUp}>
          {/* Personal Info Block */}
          <div className="rounded-md shadow-sm space-y-2 p-4 bg-white border border-gray-200 mb-4">
            <div className="flex space-x-2">
              <div className="w-1/2">
                <label htmlFor="first-name">First name</label>
                <input
                  id="first-name"
                  name="first-name"
                  type="text"
                  required
                  className="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="First name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
              <div className="w-1/2">
                <label htmlFor="last-name">Last name</label>
                <input
                  id="last-name"
                  name="last-name"
                  type="text"
                  required
                  className="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Last name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
            </div>
            <div className="mt-2">
              <label htmlFor="email-address">Email address</label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={!!pendingInvite}
              />
            </div>
          </div>
          {/* Team Block */}
          {!pendingInvite && (
            <div className="rounded-md shadow-sm space-y-2 p-4 bg-white border border-gray-200 mb-4">
              <label htmlFor="team-name">Company or team name</label>
              <input
                id="team-name"
                name="team-name"
                type="text"
                required
                className="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Company or team name"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
              />
            </div>
          )}
          {/* Password Block */}
          <div className="rounded-md shadow-sm space-y-2 p-4 bg-white border border-gray-200 mb-4">
            <label htmlFor="password">Password</label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                className="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 px-3 flex items-center text-sm text-gray-500"
                onClick={() => setShowPassword((v) => !v)}
                tabIndex={-1}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            {password && (
              <p className={`mt-1 text-xs ${passwordError ? 'text-red-600' : 'text-green-600'}`}>{passwordError ? passwordError : 'Password looks good!'}</p>
            )}
            <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mt-4">Confirm password</label>
            <div className="relative">
              <input
                id="confirm-password"
                name="confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                required
                className="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 px-3 flex items-center text-sm text-gray-500"
                onClick={() => setShowConfirmPassword((v) => !v)}
                tabIndex={-1}
              >
                {showConfirmPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            {confirmPassword && (
              <p className={`mt-1 text-xs ${confirmPasswordError ? 'text-red-600' : 'text-green-600'}`}>{confirmPasswordError ? confirmPasswordError : 'Passwords match!'}</p>
            )}
            <ul className="mt-2 text-xs text-gray-500">
              <li>Password must be at least 8 characters</li>
              <li>Include uppercase, lowercase, a number, and a special character</li>
            </ul>
          </div>
          {/* Error message */}
          {error && <div className="text-red-600 text-sm mb-2">{error}</div>}
          <div>
            <button
              type="submit"
              disabled={loading || !!passwordError || !!confirmPasswordError}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {loading ? 'Signing up...' : pendingInvite ? 'Join Team' : 'Create Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}