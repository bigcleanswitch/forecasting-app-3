'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase-browser'
import type {
  ForecastAssumptions,
  AssumptionStep,
  AssumptionFormState,
  BusinessModel,
  GoToMarketChannel,
  ClientTier,
  RevenueStream,
  GrowthCurve,
  TeamMember,
  CustomerAcquisition,
  Infrastructure,
  Overheads
} from '@shared/index'
import ProductAndPricingStep from './ProductAndPricingStep'

const STEPS: { key: AssumptionStep; title: string; description: string }[] = [
  {
    key: 'pricing',
    title: 'Product and Pricing',
    description: 'Set up your revenue streams, products, and pricing (including tiered pricing)'
  },
  {
    key: 'user-growth',
    title: 'User Growth',
    description: 'Model how users and clients will grow'
  },
  {
    key: 'cost-drivers',
    title: 'Cost Drivers',
    description: 'Define your key cost assumptions'
  },
  {
    key: 'review',
    title: 'Review & Save',
    description: 'Review your assumptions and save'
  }
]

export default function AssumptionsPage() {
  const router = useRouter()
  const [formState, setFormState] = useState<AssumptionFormState>({
    currentStep: 'pricing',
    assumptions: {
      revenueStreams: [],
      growthCurve: {
        steepness: 0.5,
        offset: 3,
        length: 24
      },
      teamMembers: [],
      customerAcquisition: {
        costPerLead: 50,
        costPerAcquisition: 100,
        marketingBudgetPercent: 15,
        salesTeamCosts: 0
      },
      infrastructure: {
        tieredPricing: [],
        externalAPIs: 0,
        dataLicensing: 0
      },
      overheads: {
        insurance: 0,
        office: 0,
        software: 0,
        professionalServices: 0
      }
    },
    isComplete: false
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Check authentication
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/sign-in')
      }
    }
    checkAuth()
  }, [router])

  const updateAssumptions = (updates: Partial<ForecastAssumptions>) => {
    setFormState((prev: AssumptionFormState) => ({
      ...prev,
      assumptions: { ...prev.assumptions, ...updates }
    }))
  }

  const nextStep = () => {
    const currentIndex = STEPS.findIndex((step: { key: AssumptionStep }) => step.key === formState.currentStep)
    if (currentIndex < STEPS.length - 1) {
      setFormState((prev: AssumptionFormState) => ({
        ...prev,
        currentStep: STEPS[currentIndex + 1].key
      }))
    }
  }

  const prevStep = () => {
    const currentIndex = STEPS.findIndex((step: { key: AssumptionStep }) => step.key === formState.currentStep)
    if (currentIndex > 0) {
      setFormState((prev: AssumptionFormState) => ({
        ...prev,
        currentStep: STEPS[currentIndex - 1].key
      }))
    }
  }

  const saveAssumptions = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Get user's team
      const { data: profile } = await supabase
        .from('profiles')
        .select('team_id')
        .eq('id', user.id)
        .single()

      if (!profile?.team_id) throw new Error('No team found')

      // Save assumptions to database
      const { error: saveError } = await supabase
        .from('forecast_assumptions')
        .upsert({
          team_id: profile.team_id,
          created_by: user.id,
          assumptions: formState.assumptions,
          updated_at: new Date().toISOString()
        })

      if (saveError) throw saveError

      // Mark as complete
      setFormState(prev => ({ ...prev, isComplete: true }))
      
      // Redirect to dashboard or forecast view
      router.push('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save assumptions')
    } finally {
      setLoading(false)
    }
  }

  const renderStepContent = () => {
    switch (formState.currentStep) {
      case 'pricing':
        return <ProductAndPricingStep assumptions={formState.assumptions} onUpdate={updateAssumptions} />
      case 'user-growth':
        return <UserGrowthStep assumptions={formState.assumptions} onUpdate={updateAssumptions} />
      case 'cost-drivers':
        return <CostDriversStep assumptions={formState.assumptions} onUpdate={updateAssumptions} />
      case 'review':
        return <ReviewStep assumptions={formState.assumptions} />
      default:
        return null
    }
  }

  const canProceed = () => {
    switch (formState.currentStep) {
      case 'pricing':
        return (formState.assumptions.revenueStreams?.length ?? 0) > 0
      case 'user-growth':
        return Boolean(
          formState.assumptions.growthCurve &&
          (formState.assumptions.clientGrowth || (formState.assumptions.directUserAcquisition?.length ?? 0) > 0)
        )
      case 'cost-drivers':
        return (formState.assumptions.teamMembers?.length ?? 0) > 0
      case 'review':
        return true
      default:
        return false
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold">Forecast Assumptions</h1>
            </div>
            <div className="flex items-center">
              <button
                onClick={() => router.push('/dashboard')}
                className="ml-4 px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md">
            {error}
          </div>
        )}

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => (
              <div key={step.key} className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                  STEPS.findIndex(s => s.key === formState.currentStep) >= index
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {index + 1}
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">{step.title}</p>
                  <p className="text-xs text-gray-500">{step.description}</p>
                </div>
                {index < STEPS.length - 1 && (
                  <div className="ml-4 w-16 h-0.5 bg-gray-200" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white shadow rounded-lg p-6">
          {renderStepContent()}
        </div>

        {/* Navigation */}
        <div className="mt-6 flex justify-between">
          <button
            onClick={prevStep}
            disabled={STEPS.findIndex(step => step.key === formState.currentStep) === 0}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          
          <div className="flex gap-4">
            {formState.currentStep === 'review' ? (
              <button
                onClick={saveAssumptions}
                disabled={loading}
                className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Assumptions'}
              </button>
            ) : (
              <button
                onClick={nextStep}
                disabled={!canProceed()}
                className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

function UserGrowthStep({ 
  assumptions, 
  onUpdate 
}: { 
  assumptions: Partial<ForecastAssumptions>
  onUpdate: (updates: Partial<ForecastAssumptions>) => void 
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium mb-4">User Growth Assumptions</h2>
        <p className="text-gray-600 mb-6">Model how users and clients will grow over time.</p>
      </div>

      {/* Growth Curve Parameters */}
      <div>
        <h3 className="text-md font-medium mb-4">Growth Curve Parameters</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label>
              Curve Steepness (0-1)
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={assumptions.growthCurve?.steepness || 0.5}
              onChange={(e) => onUpdate({ 
                growthCurve: { 
                  ...assumptions.growthCurve!, 
                  steepness: parseFloat(e.target.value) 
                } 
              })}
              className="w-full"
            />
            <p className="text-xs text-gray-500 mt-1">
              {assumptions.growthCurve?.steepness || 0.5} - How sharp the S-curve is
            </p>
          </div>
          <div>
            <label>
              Growth Offset (months)
            </label>
            <input
              type="number"
              value={assumptions.growthCurve?.offset || 3}
              onChange={(e) => onUpdate({ 
                growthCurve: { 
                  ...assumptions.growthCurve!, 
                  offset: parseInt(e.target.value) 
                } 
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
            <p className="text-xs text-gray-500 mt-1">Delay before growth starts</p>
          </div>
          <div>
            <label>
              Growth Length (months)
            </label>
            <input
              type="number"
              value={assumptions.growthCurve?.length || 24}
              onChange={(e) => onUpdate({ 
                growthCurve: { 
                  ...assumptions.growthCurve!, 
                  length: parseInt(e.target.value) 
                } 
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
            <p className="text-xs text-gray-500 mt-1">Total growth period</p>
          </div>
        </div>
      </div>

      {/* Client Growth for B2B/B2B2C */}
      {(assumptions.businessModel === 'B2B' || assumptions.businessModel === 'B2B2C') && (
        <div>
          <h3 className="text-md font-medium mb-4">Client Growth</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label>
                Target Clients
              </label>
              <input
                type="number"
                value={assumptions.clientGrowth?.targetClients || 0}
                onChange={(e) => onUpdate({ 
                  clientGrowth: { 
                    ...assumptions.clientGrowth!,
                    targetClients: parseInt(e.target.value),
                    startDate: assumptions.clientGrowth?.startDate || new Date(),
                    endDate: assumptions.clientGrowth?.endDate || new Date(),
                    curve: assumptions.growthCurve!
                  } 
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label>
                Growth End Date
              </label>
              <input
                type="date"
                value={assumptions.clientGrowth?.endDate ? new Date(assumptions.clientGrowth.endDate).toISOString().split('T')[0] : ''}
                onChange={(e) => onUpdate({ 
                  clientGrowth: { 
                    ...assumptions.clientGrowth!,
                    endDate: new Date(e.target.value)
                  } 
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
        </div>
      )}

      {/* Direct User Acquisition for B2C */}
      {assumptions.businessModel === 'B2C' && (
        <div>
          <h3 className="text-md font-medium mb-4">Direct User Acquisition</h3>
          <p className="text-sm text-gray-600 mb-4">
            Define how many users you expect to acquire per month through each channel.
          </p>
          <div className="space-y-4">
            {assumptions.goToMarketChannels?.map((channel) => (
              <div key={channel} className="flex items-center gap-4">
                <span className="w-32 text-sm font-medium">{channel}</span>
                <input
                  type="number"
                  placeholder="Monthly acquisitions"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                />
                <input
                  type="number"
                  placeholder="Cost per acquisition"
                  className="w-32 px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function CostDriversStep({ 
  assumptions, 
  onUpdate 
}: { 
  assumptions: Partial<ForecastAssumptions>
  onUpdate: (updates: Partial<ForecastAssumptions>) => void 
}) {
  const [newMember, setNewMember] = useState({
    role: '',
    startDate: new Date(),
    baseSalary: 0,
    inflationUplift: 0,
    onCosts: 20
  })

  const addTeamMember = () => {
    if (!newMember.role || newMember.baseSalary <= 0) return
    
    const member: TeamMember = {
      role: newMember.role,
      startDate: newMember.startDate,
      baseSalary: newMember.baseSalary,
      inflationUplift: newMember.inflationUplift,
      onCosts: newMember.onCosts
    }

    onUpdate({
      teamMembers: [...(assumptions.teamMembers || []), member]
    })
    
    setNewMember({
      role: '',
      startDate: new Date(),
      baseSalary: 0,
      inflationUplift: 0,
      onCosts: 20
    })
  }

  const removeTeamMember = (index: number) => {
    onUpdate({
      teamMembers: assumptions.teamMembers?.filter((_, i: number) => i !== index) || []
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium mb-4">Key Cost Drivers</h2>
        <p className="text-gray-600 mb-6">Define your key cost assumptions for the forecast.</p>
      </div>

      {/* Team and Salaries */}
      <div>
        <h3 className="text-md font-medium mb-4">Team and Salaries</h3>
        
        {assumptions.teamMembers?.map((member: TeamMember, index: number) => (
          <div key={index} className="border rounded-lg p-4 mb-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h4 className="font-medium">{member.role}</h4>
                <p className="text-sm text-gray-500">
                  Start: {new Date(member.startDate).toLocaleDateString()} • 
                  Salary: £{member.baseSalary.toLocaleString()}/year
                </p>
              </div>
              <button
                onClick={() => removeTeamMember(index)}
                className="text-red-600 hover:text-red-800 text-sm"
              >
                Remove
              </button>
            </div>
          </div>
        ))}

        {/* Add New Member */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
          <h4 className="font-medium mb-3">Add Team Member</h4>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <input
              type="text"
              placeholder="Role (e.g., CEO, Developer)"
              value={newMember.role}
              onChange={(e) => setNewMember(prev => ({ ...prev, role: e.target.value }))}
              className="col-span-2 px-3 py-2 border border-gray-300 rounded-md"
            />
            <input
              type="date"
              value={new Date(newMember.startDate).toISOString().split('T')[0]}
              onChange={(e) => setNewMember(prev => ({ ...prev, startDate: new Date(e.target.value) }))}
              className="px-3 py-2 border border-gray-300 rounded-md"
            />
            <input
              type="number"
              placeholder="Base salary (£/year)"
              value={newMember.baseSalary}
              onChange={(e) => setNewMember(prev => ({ ...prev, baseSalary: parseFloat(e.target.value) || 0 }))}
              className="px-3 py-2 border border-gray-300 rounded-md"
            />
            <input
              type="number"
              placeholder="Inflation uplift (%)"
              value={newMember.inflationUplift}
              onChange={(e) => setNewMember(prev => ({ ...prev, inflationUplift: parseFloat(e.target.value) || 0 }))}
              className="px-3 py-2 border border-gray-300 rounded-md"
            />
            <input
              type="number"
              placeholder="On-costs (%)"
              value={newMember.onCosts}
              onChange={(e) => setNewMember(prev => ({ ...prev, onCosts: parseFloat(e.target.value) || 0 }))}
              className="px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <button
            onClick={addTeamMember}
            disabled={!newMember.role || newMember.baseSalary <= 0}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            Add Member
          </button>
        </div>
      </div>

      {/* Customer Acquisition */}
      <div>
        <h3 className="text-md font-medium mb-4">Customer Acquisition</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label>
              Cost per Lead (£)
            </label>
            <input
              type="number"
              value={assumptions.customerAcquisition?.costPerLead || 0}
              onChange={(e) => onUpdate({ 
                customerAcquisition: { 
                  ...assumptions.customerAcquisition!,
                  costPerLead: parseFloat(e.target.value) || 0
                } 
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label>
              Cost per Acquisition (£)
            </label>
            <input
              type="number"
              value={assumptions.customerAcquisition?.costPerAcquisition || 0}
              onChange={(e) => onUpdate({ 
                customerAcquisition: { 
                  ...assumptions.customerAcquisition!,
                  costPerAcquisition: parseFloat(e.target.value) || 0
                } 
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label>
              Marketing Budget (% of revenue)
            </label>
            <input
              type="number"
              value={assumptions.customerAcquisition?.marketingBudgetPercent || 0}
              onChange={(e) => onUpdate({ 
                customerAcquisition: { 
                  ...assumptions.customerAcquisition!,
                  marketingBudgetPercent: parseFloat(e.target.value) || 0
                } 
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
        </div>
      </div>

      {/* Overheads */}
      <div>
        <h3 className="text-md font-medium mb-4">Overheads</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label>
              Insurance (£/month)
            </label>
            <input
              type="number"
              value={assumptions.overheads?.insurance || 0}
              onChange={(e) => onUpdate({ 
                overheads: { 
                  ...assumptions.overheads!,
                  insurance: parseFloat(e.target.value) || 0
                } 
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label>
              Office (£/month)
            </label>
            <input
              type="number"
              value={assumptions.overheads?.office || 0}
              onChange={(e) => onUpdate({ 
                overheads: { 
                  ...assumptions.overheads!,
                  office: parseFloat(e.target.value) || 0
                } 
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label>
              Software (£/month)
            </label>
            <input
              type="number"
              value={assumptions.overheads?.software || 0}
              onChange={(e) => onUpdate({ 
                overheads: { 
                  ...assumptions.overheads!,
                  software: parseFloat(e.target.value) || 0
                } 
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label>
              Professional Services (£/month)
            </label>
            <input
              type="number"
              value={assumptions.overheads?.professionalServices || 0}
              onChange={(e) => onUpdate({ 
                overheads: { 
                  ...assumptions.overheads!,
                  professionalServices: parseFloat(e.target.value) || 0
                } 
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function ReviewStep({ 
  assumptions 
}: { 
  assumptions: Partial<ForecastAssumptions>
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium mb-4">Review Your Assumptions</h2>
        <p className="text-gray-600 mb-6">Review all your assumptions before saving.</p>
      </div>

      {/* Pricing */}
      <div className="border rounded-lg p-4">
        <h3 className="font-medium mb-3">Pricing Assumptions</h3>
        <div className="space-y-2">
          {assumptions.revenueStreams?.map((stream: RevenueStream) => (
            <div key={stream.id} className="flex justify-between text-sm">
              <span>{stream.name}</span>
              <span className="font-medium">
                {stream.pricing.currency} {stream.pricing.basePrice} / {stream.pricing.billingFrequency}
              </span>
            </div>
          ))}
          {(!assumptions.revenueStreams || assumptions.revenueStreams.length === 0) && (
            <p className="text-gray-500 text-sm">No revenue streams defined</p>
          )}
        </div>
      </div>

      {/* User Growth */}
      <div className="border rounded-lg p-4">
        <h3 className="font-medium mb-3">User Growth Assumptions</h3>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Curve Steepness:</span>
            <span className="ml-2 font-medium">{assumptions.growthCurve?.steepness}</span>
          </div>
          <div>
            <span className="text-gray-500">Growth Offset:</span>
            <span className="ml-2 font-medium">{assumptions.growthCurve?.offset} months</span>
          </div>
          <div>
            <span className="text-gray-500">Growth Length:</span>
            <span className="ml-2 font-medium">{assumptions.growthCurve?.length} months</span>
          </div>
        </div>
        {assumptions.clientGrowth && (
          <div className="mt-3 text-sm">
            <span className="text-gray-500">Target Clients:</span>
            <span className="ml-2 font-medium">{assumptions.clientGrowth.targetClients}</span>
          </div>
        )}
      </div>

      {/* Cost Drivers */}
      <div className="border rounded-lg p-4">
        <h3 className="font-medium mb-3">Cost Drivers</h3>
        <div className="space-y-2">
          <div className="text-sm">
            <span className="text-gray-500">Team Members:</span>
            <span className="ml-2 font-medium">{assumptions.teamMembers?.length || 0}</span>
          </div>
          <div className="text-sm">
            <span className="text-gray-500">Cost per Lead:</span>
            <span className="ml-2 font-medium">£{assumptions.customerAcquisition?.costPerLead || 0}</span>
          </div>
          <div className="text-sm">
            <span className="text-gray-500">Marketing Budget:</span>
            <span className="ml-2 font-medium">{assumptions.customerAcquisition?.marketingBudgetPercent || 0}% of revenue</span>
          </div>
        </div>
      </div>
    </div>
  )
} 