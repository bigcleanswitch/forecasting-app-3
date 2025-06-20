'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-browser'
import type { Database } from '@/types/supabase'

type Team = Database['public']['Tables']['teams']['Row']
type Profile = Database['public']['Tables']['profiles']['Row']

export default function Dashboard() {
  const router = useRouter()
  const [team, setTeam] = useState<Team | null>(null)
  const [members, setMembers] = useState<Profile[]>([])
  const [inviteEmail, setInviteEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [newTeamName, setNewTeamName] = useState('')
  const [creatingTeam, setCreatingTeam] = useState(false)
  const [onboarding, setOnboarding] = useState(false)
  const [pendingFirstName, setPendingFirstName] = useState('')
  const [pendingLastName, setPendingLastName] = useState('')
  const [pendingTeamName, setPendingTeamName] = useState('')

  useEffect(() => {
    loadTeamData()
  }, [])

  useEffect(() => {
    if (onboarding && pendingFirstName && pendingLastName && pendingTeamName) {
      // Automatically complete onboarding if all data is present
      (async () => {
        setLoading(true)
        setError(null)
        try {
          // Wait for session hydration
          await new Promise((resolve) => setTimeout(resolve, 300));
          const { data: { user } } = await supabase.auth.getUser()
          console.log('Onboarding: current user:', user)
          if (!user) {
            setError('You are not authenticated. Please sign in again.');
            setLoading(false);
            return;
          }
          console.log('Onboarding: owner_id to be used:', user.id)
          // Create team
          const { data: teamData, error: teamError } = await supabase
            .from('teams')
            .insert({
              name: pendingTeamName,
              owner_id: user.id,
              member_count: 1,
            })
            .select()
            .single()
          if (teamError) throw teamError
          // Update profile
          const { error: profileError } = await supabase
            .from('profiles')
            .update({
              first_name: pendingFirstName,
              last_name: pendingLastName,
              team_id: teamData.id,
              role: 'owner',
            })
            .eq('id', user.id)
          if (profileError) throw profileError
          // Clear onboarding data
          localStorage.removeItem('pendingSignupFirstName')
          localStorage.removeItem('pendingSignupLastName')
          localStorage.removeItem('pendingSignupTeamName')
          setOnboarding(false)
          // Reload team data
          await loadTeamData()
        } catch (err) {
          setError(err instanceof Error ? err.message : 'An error occurred')
        } finally {
          setLoading(false)
        }
      })()
    }
  }, [onboarding, pendingFirstName, pendingLastName, pendingTeamName])

  const loadTeamData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No user found')
      // Get user's profile to find their team and names
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      // If profile is missing first_name, last_name, or team_id, check localStorage for onboarding
      if (!profile?.first_name || !profile?.last_name || !profile?.team_id) {
        const f = localStorage.getItem('pendingSignupFirstName') || ''
        const l = localStorage.getItem('pendingSignupLastName') || ''
        const t = localStorage.getItem('pendingSignupTeamName') || ''
        if (f && l && t) {
          setPendingFirstName(f)
          setPendingLastName(l)
          setPendingTeamName(t)
          setOnboarding(true)
          setLoading(false)
          return
        }
      }

      // Get team details
      const { data: teamData } = await supabase
        .from('teams')
        .select('*')
        .eq('id', profile.team_id)
        .single()

      if (!teamData) throw new Error('Team not found')
      setTeam(teamData)

      // Get team members
      const { data: membersData } = await supabase
        .from('profiles')
        .select('*')
        .eq('team_id', profile.team_id)

      if (membersData) setMembers(membersData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!team) return

    try {
      // Check if team is at capacity
      if (team.member_count && team.member_count >= 5) {
        throw new Error('Team has reached maximum capacity (5 members)')
      }

      // Create team invite
      const { error: inviteError } = await supabase
        .from('team_invites')
        .insert({
          team_id: team.id,
          email: inviteEmail,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
        })

      if (inviteError) throw inviteError

      setInviteEmail('')
      // TODO: Send email invitation
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth/sign-in')
  }

  // Add handler for creating a new team if none exists
  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreatingTeam(true)
    setError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No user found')
      // Create new team
      const { data: teamData, error: teamError } = await supabase
        .from('teams')
        .insert({
          name: newTeamName,
          owner_id: user.id,
          member_count: 1,
        })
        .select()
        .single()
      if (teamError) throw teamError
      // Update user's profile to link to new team
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ team_id: teamData.id, role: 'owner' })
        .eq('id', user.id)
      if (profileError) {
        // Roll back: delete the team if profile update fails
        await supabase.from('teams').delete().eq('id', teamData.id)
        throw profileError
      }
      setNewTeamName('')
      // Reload team data
      await loadTeamData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setCreatingTeam(false)
    }
  }

  // Add onboarding handler
  const handleOnboarding = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No user found')
      // Create team
      const { data: teamData, error: teamError } = await supabase
        .from('teams')
        .insert({
          name: pendingTeamName,
          owner_id: user.id,
          member_count: 1,
        })
        .select()
        .single()
      if (teamError) throw teamError
      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          first_name: pendingFirstName,
          last_name: pendingLastName,
          team_id: teamData.id,
          role: 'owner',
        })
        .eq('id', user.id)
      if (profileError) throw profileError
      // Clear onboarding data
      localStorage.removeItem('pendingSignupFirstName')
      localStorage.removeItem('pendingSignupLastName')
      localStorage.removeItem('pendingSignupTeamName')
      setOnboarding(false)
      // Reload team data
      await loadTeamData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (onboarding && (!pendingFirstName || !pendingLastName || !pendingTeamName)) {
    return (
      <div className="container">
        <div className="card">
          <h1>Team Dashboard</h1>
          {error && <div className="card" style={{background: 'var(--color-secondary-coral)', color: 'var(--color-white)'}}>{error}</div>}
          {loading ? (
            <p>Loading...</p>
          ) : team ? (
            <>
              <h2>{team.name}</h2>
              <div className="flex gap-md">
                <div>
                  <h3>Members</h3>
                  <ul>
                    {members.map(member => (
                      <li key={member.id}>{member.first_name} {member.last_name} <span className="text-sm">({member.role})</span></li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3>Invite Member</h3>
                  <form onSubmit={handleInvite} className="flex flex-col gap-sm">
                    <label htmlFor="inviteEmail">Email</label>
                    <input id="inviteEmail" type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} required />
                    <button type="submit" className="button" disabled={team.member_count >= 5}>Invite</button>
                  </form>
                </div>
              </div>
              <button className="button" onClick={handleSignOut}>Sign Out</button>
            </>
          ) : (
            <>
              <h2>No team found</h2>
              <form onSubmit={handleCreateTeam} className="flex flex-col gap-sm">
                <label htmlFor="newTeamName">Team Name</label>
                <input id="newTeamName" type="text" value={newTeamName} onChange={e => setNewTeamName(e.target.value)} required />
                <button type="submit" className="button" disabled={creatingTeam}>Create Team</button>
              </form>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <div className="card">
        <h1>Team Dashboard</h1>
        {error && <div className="card" style={{background: 'var(--color-secondary-coral)', color: 'var(--color-white)'}}>{error}</div>}
        {loading ? (
          <p>Loading...</p>
        ) : team ? (
          <>
            <h2>{team.name}</h2>
            <div className="flex gap-md">
              <div>
                <h3>Members</h3>
                <ul>
                  {members.map(member => (
                    <li key={member.id}>{member.first_name} {member.last_name} <span className="text-sm">({member.role})</span></li>
                  ))}
                </ul>
              </div>
              <div>
                <h3>Invite Member</h3>
                <form onSubmit={handleInvite} className="flex flex-col gap-sm">
                  <label htmlFor="inviteEmail">Email</label>
                  <input id="inviteEmail" type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} required />
                  <button type="submit" className="button" disabled={team.member_count >= 5}>Invite</button>
                </form>
              </div>
            </div>
            <button className="button" onClick={handleSignOut}>Sign Out</button>
          </>
        ) : (
          <>
            <h2>No team found</h2>
            <form onSubmit={handleCreateTeam} className="flex flex-col gap-sm">
              <label htmlFor="newTeamName">Team Name</label>
              <input id="newTeamName" type="text" value={newTeamName} onChange={e => setNewTeamName(e.target.value)} required />
              <button type="submit" className="button" disabled={creatingTeam}>Create Team</button>
            </form>
          </>
        )}
      </div>
    </div>
  )
} 