"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase-browser'
import type {
  BusinessModel,
  GoToMarketChannel,
  ClientTier,
  ForecastAssumptions
} from '@shared/index'
import { TrashIcon } from '@heroicons/react/24/solid'

const DEFAULT_CLIENT_TIERS: ClientTier[] = [
  { id: '1', tierBottom: 100, tierTop: 1000 },
  { id: '2', tierBottom: 1001, tierTop: 5000 },
  { id: '3', tierBottom: 5001, tierTop: 10000 },
  { id: '4', tierBottom: 10001, tierTop: 25000 },
  { id: '5', tierBottom: 25001, tierTop: 50000 },
  { id: '6', tierBottom: 50001, tierTop: 100000 },
  { id: '7', tierBottom: 100001, tierTop: 250000 },
  { id: '8', tierBottom: 250001, tierTop: 500000 },
  { id: '9', tierBottom: 500001, tierTop: 1000000 },
  { id: '10', tierBottom: 1000001, tierTop: 5000000 },
  { id: '11', tierBottom: 5000001, tierTop: 99999999 },
]

// Helper function to format numbers with thousand separators
function formatNumberWithCommas(num: number | string) {
  if (num === undefined || num === null || num === '') return '';
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export default function BusinessProfilePage() {
  const router = useRouter()
  const [businessModel, setBusinessModel] = useState<BusinessModel>('B2C')
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [endDate, setEndDate] = useState<string>("")
  const [goToMarketChannels, setGoToMarketChannels] = useState<GoToMarketChannel[]>([])
  const [clientTiers, setClientTiers] = useState<ClientTier[]>(DEFAULT_CLIENT_TIERS)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const fetchBusinessProfile = async () => {
      setLoading(true)
      setError(null)
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Not authenticated')
        const { data: profile } = await supabase
          .from('profiles')
          .select('team_id')
          .eq('id', user.id)
          .single()
        if (!profile?.team_id) throw new Error('No team found')
        // Fetch the business profile for this team
        const { data: businessProfile, error: fetchError } = await supabase
          .from('business_profiles')
          .select('*')
          .eq('team_id', profile.team_id)
          .single()
        console.log('BusinessProfilePage: Fetched businessProfile:', businessProfile)
        if (fetchError && fetchError.code !== 'PGRST116') throw fetchError // PGRST116 = no rows found
        if (businessProfile) {
          setBusinessModel(businessProfile.business_model)
          setStartDate(businessProfile.start_date)
          setEndDate(businessProfile.end_date)
          setGoToMarketChannels(businessProfile.go_to_market_channels || [])
          setClientTiers(businessProfile.client_tiers || DEFAULT_CLIENT_TIERS)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load business profile')
      } finally {
        setLoading(false)
      }
    }
    fetchBusinessProfile()
  }, [])

  const handleSave = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { data: profile } = await supabase
        .from('profiles')
        .select('team_id')
        .eq('id', user.id)
        .single()
      if (!profile?.team_id) throw new Error('No team found')
      const saveData = {
        team_id: profile.team_id,
        business_model: businessModel,
        start_date: startDate,
        end_date: endDate,
        go_to_market_channels: goToMarketChannels,
        client_tiers: clientTiers,
        updated_at: new Date().toISOString()
      }
      console.log('BusinessProfilePage: Saving businessProfile:', saveData)
      const { error: saveError } = await supabase
        .from('business_profiles')
        .upsert(saveData)
      if (saveError) throw saveError
      setSuccess(true)
      setTimeout(() => setSuccess(false), 2000) // Auto-clear success message after 2 seconds
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save business profile')
    } finally {
      setLoading(false)
    }
  }

  const businessModels = [
    { value: 'B2C', label: 'B2C (Business-to-Consumer)' },
    { value: 'B2B', label: 'B2B (Business-to-Business)' },
    { value: 'B2B2C', label: 'B2B2C (Business-to-Business-to-Consumer)' },
    { value: 'Marketplace', label: 'Marketplace' },
    { value: 'API/Platform', label: 'API/Platform' },
    { value: 'Hybrid', label: 'Hybrid' }
  ]
  const goToMarketOptions = [
    { value: 'Direct Sales', label: 'Direct Sales' },
    { value: 'Partnerships', label: 'Partnerships' },
    { value: 'Retail', label: 'Retail' },
    { value: 'Platform Integrations', label: 'Platform Integrations' },
    { value: 'Employer Rollouts', label: 'Employer Rollouts' },
    { value: 'Organic', label: 'Organic (SEO, Content)' },
    { value: 'Paid Media', label: 'Paid Media' },
    { value: 'Referral', label: 'Referral-driven' },
    { value: 'Partnership', label: 'Partnership-driven' }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold">Business Profile</h1>
            </div>
            <div className="flex items-center">
              <button
                onClick={() => router.push('/dashboard')}
                className="button secondary back-btn"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-2xl mx-auto py-6 sm:px-6 lg:px-8">
        {error && <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md">{error}</div>}
        {success && <div className="mb-4 p-4 bg-green-50 text-green-700 rounded-md">Saved!</div>}
        <div className="bg-white shadow rounded-lg p-6 space-y-6">
          <div className="form-group form-inline">
            <label>Business Model</label>
            <select
              value={businessModel}
              onChange={e => setBusinessModel(e.target.value as BusinessModel)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              {businessModels.map(model => (
                <option key={model.value} value={model.value}>{model.label}</option>
              ))}
            </select>
          </div>
          <div className="form-group form-inline">
            <label>Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div className="form-group form-inline">
            <label>End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div className="form-group">
            <label>Go-to-Market Channels</label>
            <div className="checkbox-group">
              {goToMarketOptions.map(option => (
                <label key={option.value} className="checkbox">
                  <input
                    type="checkbox"
                    checked={goToMarketChannels.includes(option.value as GoToMarketChannel)}
                    onChange={e => {
                      const updated = e.target.checked
                        ? [...goToMarketChannels, option.value as GoToMarketChannel]
                        : goToMarketChannels.filter(c => c !== option.value)
                      setGoToMarketChannels(updated)
                    }}
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </div>
          {(businessModel === 'B2B' || businessModel === 'B2B2C') && (
            <div>
              <label>Client Tiers</label>
              <div className="space-y-2">
                <div className="flex items-center gap-3 text-sm font-semibold text-gray-600 mb-1">
                  <span className="w-[160px]">Tier name</span>
                  <span className="w-[100px]">Min</span>
                  <span className="w-[20px] text-center">to</span>
                  <span className="w-[100px]">Max</span>
                  <span className="w-[40px]">Users</span>
                  <span className="flex-1" />
                </div>
                {clientTiers.map((tier, index) => (
                  <div
                    key={tier.id}
                    className="flex items-center gap-3 py-1 border-b border-gray-200 hover:bg-gray-50 transition-colors"
                    style={{ minHeight: 36 }}
                  >
                    <input
                      type="text"
                      value={tier.name || ''}
                      onChange={e => {
                        const updated = [...clientTiers]
                        updated[index] = { ...tier, name: e.target.value }
                        setClientTiers(updated)
                      }}
                      className="w-full sm:w-[160px] h-9 px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary/30"
                      placeholder="Tier name (optional)"
                    />
                    <input
                      type="text"
                      value={formatNumberWithCommas(tier.tierBottom)}
                      onChange={e => {
                        const raw = e.target.value.replace(/,/g, '').trim();
                        const updated = [...clientTiers]
                        updated[index] = { ...tier, tierBottom: parseInt(raw) || 0 }
                        setClientTiers(updated)
                      }}
                      className="w-[100px] h-9 px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary/30"
                      placeholder="Min"
                    />
                    <span className="w-[20px] text-center text-sm text-gray-600 flex-shrink-0">to</span>
                    <input
                      type="text"
                      value={formatNumberWithCommas(tier.tierTop)}
                      onChange={e => {
                        const raw = e.target.value.replace(/,/g, '').trim();
                        const updated = [...clientTiers]
                        updated[index] = { ...tier, tierTop: parseInt(raw) || 0 }
                        setClientTiers(updated)
                      }}
                      className="w-[100px] h-9 px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary/30"
                      placeholder="Max"
                    />
                    <span className="w-[40px] text-sm text-gray-600 flex-shrink-0">users</span>
                    <button
                      type="button"
                      className="ml-auto text-gray-400 hover:text-red-500 p-1 rounded-full hover:bg-red-100 transition-colors h-9 w-9 flex items-center justify-center bg-transparent border-none"
                      aria-label="Delete tier"
                      title="Delete tier"
                      onClick={() => {
                        if (clientTiers.length > 1) {
                          setClientTiers(clientTiers.filter((_, i) => i !== index))
                        }
                      }}
                      disabled={clientTiers.length === 1}
                      style={{ background: 'transparent', border: 'none' }}
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="text-sm text-primary hover:underline mt-4"
                  onClick={() => {
                    setClientTiers([
                      ...clientTiers,
                      {
                        id: Date.now().toString(),
                        name: '',
                        tierBottom: 0,
                        tierTop: 0,
                      },
                    ])
                  }}
                >
                  + Add tier
                </button>
              </div>
            </div>
          )}
          <button
            onClick={handleSave}
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 mt-4"
          >
            {loading ? 'Saving...' : 'Save Business Profile'}
          </button>
        </div>
      </main>
    </div>
  )
} 