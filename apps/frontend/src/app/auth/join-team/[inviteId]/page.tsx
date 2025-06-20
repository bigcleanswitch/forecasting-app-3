'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-browser'
import type { Database } from '@/types/supabase'

type TeamInvite = Database['public']['Tables']['team_invites']['Row']
type Team = Database['public']['Tables']['teams']['Row']

export default function JoinTeam({ params }: { params: { inviteId: string } }) {
  const router = useRouter()
  const [invite, setInvite] = useState<TeamInvite | null>(null)
  const [team, setTeam] = useState<Team | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadInviteData()
  }, [params.inviteId])

  const loadInviteData = async () => {
    try {
      // Get invite details
      const { data: inviteData, error: inviteError } = await supabase
        .from('team_invites')
        .select('*')
        .eq('id', params.inviteId)
        .single()

      if (inviteError) throw inviteError
      if (!inviteData) throw new Error('Invite not found')
      if (inviteData.status !== 'pending') throw new Error('Invite is no longer valid')
      if (new Date(inviteData.expires_at) < new Date()) throw new Error('Invite has expired')

      setInvite(inviteData)

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
    } finally {
      setLoading(false)
    }
  }

  const handleAcceptInvite = async () => {
    if (!invite || !team) return

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        // Store invite ID in localStorage and redirect to sign up
        localStorage.setItem('pendingInviteId', invite.id)
        router.push('/auth/sign-up')
        return
      }

      // Update invite status
      const { error: inviteError } = await supabase
        .from('team_invites')
        .update({ status: 'accepted' })
        .eq('id', invite.id)

      if (inviteError) throw inviteError

      // Create user profile and add to team
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email!,
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

      router.push('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-red-600">{error}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Join {team?.name}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            You've been invited to join this team
          </p>
        </div>

        <div className="mt-8 space-y-6">
          <button
            onClick={handleAcceptInvite}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Accept Invitation
          </button>
        </div>
      </div>
    </div>
  )
} 