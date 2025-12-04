'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

// Subscription tier order (highest to lowest)
const SUBSCRIPTION_TIERS: Record<string, number> = {
  premium: 4,
  enhanced: 3,
  basic: 2,
  free: 1,
}

// Fallback subscription options (used if API doesn't return data)
const DEFAULT_SUBSCRIPTION_OPTIONS: SubscriptionOption[] = [
  { value: 'premium', label: 'Premium', price: '$1,490/mo', price_cents: 149000, has_override: false, price_overridden: false },
  { value: 'enhanced', label: 'Enhanced', price: '$990/mo', price_cents: 99000, has_override: false, price_overridden: false },
  { value: 'basic', label: 'Basic', price: '$240/mo', price_cents: 24000, has_override: false, price_overridden: false },
  { value: 'free', label: 'Free', price: '$0', price_cents: 0, has_override: false, price_overridden: false },
]

// Helper to determine if change is upgrade, downgrade, or same
const getChangeDirection = (currentTier: string, targetTier: string): 'upgrade' | 'downgrade' | 'same' => {
  const currentRank = SUBSCRIPTION_TIERS[currentTier] || 1
  const targetRank = SUBSCRIPTION_TIERS[targetTier] || 1
  
  if (targetRank > currentRank) return 'upgrade'
  if (targetRank < currentRank) return 'downgrade'
  return 'same'
}

interface PlanFeature {
  feature_name: string
  feature_value: string | null
  is_included: boolean
  is_highlighted: boolean
}

interface SubscriptionOption {
  value: string
  label: string
  price: string
  price_cents: number
  has_override: boolean
  price_overridden: boolean
}

interface SubscriptionPlan {
  id: string
  name: string
  display_name: string
  price_cents: number
  price_display: string
  billing_period: string
  description: string
  is_recommended: boolean
  has_dma_override?: boolean
  price_overridden?: boolean
  features_overridden?: boolean
  override_type?: 'group' | 'global'
  group_id?: string
  group_name?: string
  override_id?: string
  subscription_plan_features: PlanFeature[]
}

interface DmaWithSubscription {
  dma_id: string
  dma_name: string
  dma_code: number
  subscription_type: string
}

interface DmaChange {
  dma_id: string
  dma_name: string
  from: string
  to: string
  direction: 'upgrade' | 'downgrade' | 'same'
}

// Plans cache by DMA ID
type PlansCache = Record<string, SubscriptionPlan[]>

function UpgradePageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const lawyerId = searchParams.get('lawyerId')
  const preselectedDmaId = searchParams.get('dmaId')
  
  const [loading, setLoading] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [completedChanges, setCompletedChanges] = useState<DmaChange[]>([])
  const [error, setError] = useState<string | null>(null)
  const [lawyerDmas, setLawyerDmas] = useState<DmaWithSubscription[]>([])
  const [selectedPlans, setSelectedPlans] = useState<Record<string, string>>({})
  const [loadingDmas, setLoadingDmas] = useState(true)
  const [plansByDma, setPlansByDma] = useState<PlansCache>({})
  const [globalPlans, setGlobalPlans] = useState<SubscriptionPlan[]>([])
  const [selectedComparisonDmaId, setSelectedComparisonDmaId] = useState<string | null>(null)

  // Fetch all DMAs for this lawyer and their DMA-specific plans
  useEffect(() => {
    const fetchLawyerDmas = async () => {
      if (!lawyerId) {
        setLoadingDmas(false)
        return
      }
      
      try {
        const response = await fetch(`/api/lawyers/${lawyerId}/dmas`)
        if (response.ok) {
          const data = await response.json()
          const dmas = data.dmas || []
          setLawyerDmas(dmas)
          
          // Initialize selected plans with current subscriptions
          const initialPlans: Record<string, string> = {}
          dmas.forEach((dma: DmaWithSubscription) => {
            initialPlans[dma.dma_id] = dma.subscription_type || 'free'
          })
          setSelectedPlans(initialPlans)
          
          // Fetch DMA-specific plans for each DMA
          const plansCache: PlansCache = {}
          for (const dma of dmas) {
            try {
              const planResponse = await fetch(`/api/subscription-plans/for-dma?dmaId=${dma.dma_id}`)
              if (planResponse.ok) {
                const planData = await planResponse.json()
                plansCache[dma.dma_id] = (planData.plans || []) as SubscriptionPlan[]
              }
            } catch (err) {
              console.error(`Error fetching plans for DMA ${dma.dma_id}:`, err)
            }
          }
          setPlansByDma(plansCache)
          
          // Use the first DMA's plans as the global reference (or first available)
          if (dmas.length > 0 && plansCache[dmas[0].dma_id]) {
            setGlobalPlans(plansCache[dmas[0].dma_id])
          }
          
          // Initialize comparison DMA selector to first DMA
          if (dmas.length > 0) {
            setSelectedComparisonDmaId(dmas[0].dma_id)
          }
        }
      } catch (err) {
        console.error('Error fetching lawyer DMAs:', err)
      } finally {
        setLoadingDmas(false)
      }
    }
    
    fetchLawyerDmas()
  }, [lawyerId])
  
  // Get subscription options for a specific DMA
  const getSubscriptionOptionsForDma = (dmaId: string): SubscriptionOption[] => {
    const dmaPlans = plansByDma[dmaId]
    if (!dmaPlans || dmaPlans.length === 0) {
      return DEFAULT_SUBSCRIPTION_OPTIONS
    }
    
    // Map plans to options, sorting by tier order
    const options: SubscriptionOption[] = dmaPlans.map(plan => ({
      value: plan.name.toLowerCase(),
      label: plan.display_name,
      price: plan.price_display + '/' + (plan.billing_period || 'mo'),
      price_cents: plan.price_cents,
      has_override: plan.has_dma_override || false,
      price_overridden: plan.price_overridden || false,
    })).sort((a, b) => (SUBSCRIPTION_TIERS[b.value] || 0) - (SUBSCRIPTION_TIERS[a.value] || 0))
    
    // Add free option if not present
    if (!options.find(o => o.value === 'free')) {
      options.push({ value: 'free', label: 'Free', price: '$0', price_cents: 0, has_override: false, price_overridden: false })
    }
    
    return options
  }
  
  // Check if any DMA has custom pricing
  const hasDmaWithCustomPricing = () => {
    return Object.values(plansByDma).some(plans => 
      plans.some(plan => plan.has_dma_override && plan.price_overridden === true)
    )
  }

  // Get list of changes (DMAs where selected plan differs from current)
  const getChanges = (): DmaChange[] => {
    return lawyerDmas
      .filter(dma => {
        const currentPlan = dma.subscription_type || 'free'
        const newPlan = selectedPlans[dma.dma_id] || 'free'
        return currentPlan !== newPlan
      })
      .map(dma => ({
        dma_id: dma.dma_id,
        dma_name: dma.dma_name,
        from: dma.subscription_type || 'free',
        to: selectedPlans[dma.dma_id] || 'free',
        direction: getChangeDirection(dma.subscription_type || 'free', selectedPlans[dma.dma_id] || 'free'),
      }))
  }

  const hasChanges = getChanges().length > 0

  const handlePlanChange = (dmaId: string, newPlan: string) => {
    setSelectedPlans(prev => ({
      ...prev,
      [dmaId]: newPlan,
    }))
  }

  const handleSaveChanges = async () => {
    const changes = getChanges()
    
    if (!lawyerId || changes.length === 0) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Update all changed DMAs
      const results = await Promise.all(
        changes.map(change =>
          fetch('/api/subscription/upgrade', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              lawyerId,
              dmaId: change.dma_id,
              subscriptionType: change.to,
            }),
          }).then(res => res.json())
        )
      )

      // Check if any failed
      const failures = results.filter(r => r.error)
      if (failures.length > 0) {
        throw new Error(failures[0].error || 'Some updates failed')
      }

      console.log('All updates successful:', results)

      setCompletedChanges(changes)
      setShowConfirmation(true)
    } catch (err: any) {
      console.error('Error updating subscriptions:', err)
      setError(err?.message || 'Failed to update subscriptions. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleReturnToProfile = () => {
    window.location.href = `/admin/directory/lawyers/${lawyerId}?t=${Date.now()}#section-subscription`
  }

  // Get subscription badge color
  const getSubscriptionBadge = (type: string) => {
    switch (type) {
      case 'premium':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'enhanced':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'basic':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200'
    }
  }

  const getDirectionBadge = (direction: 'upgrade' | 'downgrade' | 'same') => {
    if (direction === 'upgrade') {
      return 'bg-green-100 text-green-700'
    } else if (direction === 'downgrade') {
      return 'bg-amber-100 text-amber-700'
    }
    return 'bg-gray-100 text-gray-600'
  }

  // Confirmation Modal
  if (showConfirmation) {
    const upgrades = completedChanges.filter(c => c.direction === 'upgrade')
    const downgrades = completedChanges.filter(c => c.direction === 'downgrade')
    
    return (
      <div className="min-h-screen bg-subtle-sand">
        <Header />
        <main className="pt-[101px] pb-20">
          <div className="container mx-auto px-4 py-16">
            <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl p-8">
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  Changes Saved! 🎉
                </h2>
                <p className="text-gray-600">
                  Your subscription changes have been applied successfully.
                </p>
              </div>

              {/* Summary of changes */}
              <div className="space-y-4 mb-8">
                {upgrades.length > 0 && (
                  <div className="bg-green-50 rounded-lg p-4">
                    <h3 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                      </svg>
                      Upgraded ({upgrades.length})
                    </h3>
                    <div className="space-y-2">
                      {upgrades.map(change => (
                        <div key={change.dma_id} className="flex items-center justify-between text-sm">
                          <span className="font-medium text-gray-900">{change.dma_name}</span>
                          <span className="text-green-700">
                            {change.from.charAt(0).toUpperCase() + change.from.slice(1)} → {change.to.charAt(0).toUpperCase() + change.to.slice(1)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {downgrades.length > 0 && (
                  <div className="bg-amber-50 rounded-lg p-4">
                    <h3 className="font-semibold text-amber-800 mb-3 flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                      Downgraded ({downgrades.length})
                    </h3>
                    <div className="space-y-2">
                      {downgrades.map(change => (
                        <div key={change.dma_id} className="flex items-center justify-between text-sm">
                          <span className="font-medium text-gray-900">{change.dma_name}</span>
                          <span className="text-amber-700">
                            {change.from.charAt(0).toUpperCase() + change.from.slice(1)} → {change.to.charAt(0).toUpperCase() + change.to.slice(1)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={handleReturnToProfile}
                className="w-full px-6 py-4 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 transition-colors text-lg"
              >
                Return to Profile →
              </button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-subtle-sand">
      <Header />
      <main className="pt-[101px] pb-20">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-bluish to-bluish/90 text-white py-12">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Manage Your Subscriptions
            </h1>
            <p className="text-xl text-white/80 max-w-2xl mx-auto">
              Customize your subscription level for each market area. Choose the right plan for each region to maximize your visibility.
            </p>
          </div>
        </section>

        <div className="container mx-auto px-4 py-8">
          <div className="max-w-5xl mx-auto">
            
            {/* Main Table */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">Your Market Areas</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Select a subscription level for each market. Changes won't be applied until you click "Save Changes".
                </p>
              </div>

              {loadingDmas ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                </div>
              ) : lawyerDmas.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p>No market areas found.</p>
                  <p className="text-sm mt-2">Please add a service area in your profile first.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {/* Table Header */}
                  <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 text-sm font-medium text-gray-500">
                    <div className="col-span-4">Market Area</div>
                    <div className="col-span-3">Current Plan</div>
                    <div className="col-span-3">New Plan</div>
                    <div className="col-span-2 text-center">Change</div>
                  </div>

                  {/* Table Rows */}
                  {lawyerDmas.map(dma => {
                    const currentPlan = dma.subscription_type || 'free'
                    const newPlan = selectedPlans[dma.dma_id] || 'free'
                    const direction = getChangeDirection(currentPlan, newPlan)
                    const hasChange = currentPlan !== newPlan
                    const subscriptionOptions = getSubscriptionOptionsForDma(dma.dma_id)
                    const hasCustomPricing = subscriptionOptions.some(o => o.price_overridden)
                    
                    return (
                      <div 
                        key={dma.dma_id} 
                        className={`grid grid-cols-12 gap-4 px-6 py-4 items-center ${hasChange ? 'bg-blue-50/50' : ''}`}
                      >
                        {/* Market Name */}
                        <div className="col-span-4">
                          <span className="font-semibold text-gray-900">{dma.dma_name}</span>
                          <span className="text-xs text-gray-400 ml-2">DMA {dma.dma_code}</span>
                          {hasCustomPricing && (
                            <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700">
                              Special Pricing
                            </span>
                          )}
                        </div>

                        {/* Current Plan */}
                        <div className="col-span-3">
                          <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium border capitalize ${getSubscriptionBadge(currentPlan)}`}>
                            {currentPlan}
                          </span>
                        </div>

                        {/* New Plan Selector */}
                        <div className="col-span-3">
                          <select
                            value={newPlan}
                            onChange={(e) => handlePlanChange(dma.dma_id, e.target.value)}
                            className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary ${
                              hasChange ? 'border-primary bg-white' : 'border-gray-300'
                            }`}
                          >
                            {subscriptionOptions.map(option => (
                              <option key={option.value} value={option.value}>
                                {option.label} ({option.price}){option.price_overridden ? ' ★' : ''}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Change Indicator */}
                        <div className="col-span-2 text-center">
                          {hasChange ? (
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getDirectionBadge(direction)}`}>
                              {direction === 'upgrade' ? (
                                <>
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                                  </svg>
                                  Upgrade
                                </>
                              ) : (
                                <>
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                                  </svg>
                                  Downgrade
                                </>
                              )}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">No change</span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="px-6 py-4 bg-red-50 border-t border-red-200">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {/* Actions Footer */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                <div>
                  {hasChanges && (
                    <p className="text-sm text-gray-600">
                      <span className="font-semibold text-primary">{getChanges().length}</span> change{getChanges().length !== 1 ? 's' : ''} pending
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => router.back()}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveChanges}
                    disabled={!hasChanges || loading}
                    className={`px-6 py-3 rounded-lg font-bold transition-colors ${
                      hasChanges && !loading
                        ? 'bg-primary text-white hover:bg-primary/90'
                        : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Saving...
                      </span>
                    ) : (
                      'Save Changes'
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Plan Comparison Cards */}
            <div className="mt-12">
              {/* Summary Banner */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-6 border border-blue-200">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">Compare Plans Across Your Markets</h2>
                
                <p className="text-sm text-gray-700 mb-4 text-center">
                  Pricing and features may vary by market. View plan details for a specific market below.
                </p>
                
                {/* DMA Selector */}
                {lawyerDmas.length > 0 && (
                  <div className="flex items-center gap-3 justify-center">
                    <label className="text-sm font-medium text-gray-700">Viewing plans for:</label>
                    <select
                      value={selectedComparisonDmaId || ''}
                      onChange={(e) => setSelectedComparisonDmaId(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary min-w-[250px]"
                    >
                      {lawyerDmas.map(dma => {
                        const dmaPlans: SubscriptionPlan[] = plansByDma[dma.dma_id] || []
                        const hasOverride = dmaPlans.some(p => p.has_dma_override)
                        const overrideType = dmaPlans.find(p => p.has_dma_override)?.override_type
                        const groupName = dmaPlans.find(p => p.group_name)?.group_name
                        
                        return (
                          <option key={dma.dma_id} value={dma.dma_id}>
                            {dma.dma_name} (DMA {dma.dma_code})
                            {hasOverride && overrideType === 'group' && groupName && ` - ${groupName} Group`}
                          </option>
                        )
                      })}
                    </select>
                  </div>
                )}
              </div>
              
              <div className="grid md:grid-cols-4 gap-6">
                {/* Dynamically render plan cards from database or fallback to defaults */}
                {(() => {
                  // Use selected DMA's plans, or fallback to global
                  const comparisonPlans = selectedComparisonDmaId && plansByDma[selectedComparisonDmaId]
                    ? plansByDma[selectedComparisonDmaId]
                    : (globalPlans.length > 0 ? globalPlans : [])
                  
                  return comparisonPlans.map((plan, index) => {
                  const isRecommended = plan.is_recommended
                  // Deduplicate features by feature_name (in case Supabase returns duplicates)
                  const allFeatures = plan.subscription_plan_features || []
                  const seenFeatures = new Set<string>()
                  const features = allFeatures.filter((feature: PlanFeature) => {
                    const key = feature.feature_name
                    if (seenFeatures.has(key)) {
                      return false
                    }
                    seenFeatures.add(key)
                    return true
                  })
                  
                  return (
                    <div 
                      key={plan.id} 
                      className={`bg-white rounded-xl shadow-${isRecommended ? 'xl' : 'lg'} overflow-hidden ${
                        isRecommended 
                          ? 'border-2 border-primary relative transform md:-translate-y-2' 
                          : 'border border-gray-200'
                      }`}
                    >
                      {/* Recommended ribbon */}
                      {isRecommended && (
                        <>
                          <div className="absolute -right-12 top-6 rotate-45 bg-gradient-to-r from-amber-400 to-amber-500 text-white text-xs font-bold py-1 px-12 shadow-md">
                            RECOMMENDED
                          </div>
                          <div className="bg-gradient-to-r from-primary to-primary/80 text-white text-center py-3">
                            <span className="text-sm font-bold tracking-wide">⭐ BEST VALUE ⭐</span>
                          </div>
                        </>
                      )}
                      <div className={`p-6 ${!isRecommended ? 'pt-8' : ''}`}>
                        <h3 className="text-xl font-bold text-gray-900">{plan.display_name}</h3>
                        <div className="mt-2">
                          <span className="text-3xl font-bold text-gray-900">{plan.price_display}</span>
                          <span className="text-gray-500">/{plan.billing_period || 'month'}</span>
                        </div>
                        {selectedComparisonDmaId && lawyerDmas.find(d => d.dma_id === selectedComparisonDmaId) && (
                          <p className="text-xs text-gray-400 mt-1">
                            for {lawyerDmas.find(d => d.dma_id === selectedComparisonDmaId)?.dma_name}
                          </p>
                        )}
                        <p className="text-sm text-gray-500 mt-2">{plan.description}</p>
                        <ul className="mt-4 space-y-2 text-sm">
                          {features.map((feature, fIndex) => (
                            <li key={fIndex} className="flex items-start gap-2">
                              {feature.is_included ? (
                                <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              ) : (
                                <svg className="w-5 h-5 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              )}
                              <span className={!feature.is_included ? 'text-gray-400' : ''}>
                                {feature.is_highlighted && feature.is_included ? <strong>{feature.feature_name}</strong> : feature.feature_name}
                                {feature.feature_value && feature.is_included && ` (${feature.feature_value})`}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )
                  })
                })()}
                
                {/* Free plan (if not in database) */}
                {(() => {
                  const comparisonPlans = selectedComparisonDmaId && plansByDma[selectedComparisonDmaId]
                    ? plansByDma[selectedComparisonDmaId]
                    : (globalPlans.length > 0 ? globalPlans : [])
                  return !comparisonPlans.find(p => p.name.toLowerCase() === 'free')
                })() && (
                  <div className="bg-gray-50 rounded-xl shadow-lg overflow-hidden border border-gray-200">
                    <div className="p-6 pt-8">
                      <h3 className="text-xl font-bold text-gray-900">Free</h3>
                      <div className="mt-2">
                        <span className="text-3xl font-bold text-gray-900">$0</span>
                        <span className="text-gray-500">/month</span>
                      </div>
                      <p className="text-sm text-gray-500 mt-2">Basic directory presence</p>
                      <ul className="mt-4 space-y-2 text-sm">
                        <li className="flex items-start gap-2">
                          <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>Basic listing only</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <svg className="w-5 h-5 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          <span className="text-gray-400">No priority placement</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <svg className="w-5 h-5 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          <span className="text-gray-400">No profile page</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <svg className="w-5 h-5 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          <span className="text-gray-400">No featured content</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <svg className="w-5 h-5 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          <span className="text-gray-400">No SEO benefits</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Help Section */}
            <div className="mt-12 text-center">
              <p className="text-gray-600 mb-2">Questions about our plans?</p>
              <a
                href="mailto:support@divorcelawyer.com"
                className="inline-flex items-center gap-2 text-primary font-semibold hover:underline"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Contact support@divorcelawyer.com
              </a>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default function UpgradePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-subtle-sand flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    }>
      <UpgradePageContent />
    </Suspense>
  )
}
