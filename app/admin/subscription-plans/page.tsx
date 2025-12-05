'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

// Utility function to convert price_display (e.g., "$1,490") to price_cents (149000)
function priceDisplayToCents(priceDisplay: string): number {
  if (!priceDisplay || priceDisplay.trim() === '') return 0
  
  // Remove currency symbols, commas, and whitespace
  const cleaned = priceDisplay.replace(/[$,\s]/g, '')
  
  // Parse as float and convert to cents
  const dollars = parseFloat(cleaned)
  
  if (isNaN(dollars)) return 0
  
  return Math.round(dollars * 100)
}

interface Feature {
  id?: string
  feature_name: string
  feature_value: string | null
  is_included: boolean
  is_highlighted: boolean
  sort_order: number
}

interface Plan {
  id: string
  name: string
  display_name: string
  price_cents: number
  price_display: string
  billing_period: string
  description: string
  is_recommended: boolean
  is_active: boolean
  sort_order: number
  subscription_plan_features: Feature[]
}

interface DMA {
  id: string
  name: string
  code: string
}

interface DMAWithAssignment {
  id: string
  name: string
  code: string
  assignment_type: 'global' | 'group'
  group_id: string | null
  group_name: string | null
}

interface PlanGroup {
  id: string
  name: string
  description: string | null
  is_active: boolean
  dma_count: number
  dmas: DMA[]
  overrides: {
    id: string
    plan_id: string
    plan: { id: string; name: string; display_name: string }
    price_cents: number | null
    price_display: string | null
    has_custom_features: boolean
    features: Feature[]
  }[]
}

export default function SubscriptionPlansAdminPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'plans' | 'groups' | 'overrides'>('plans')
  const [plans, setPlans] = useState<Plan[]>([])
  const [dmas, setDmas] = useState<DMA[]>([])
  const [dmasWithAssignment, setDmasWithAssignment] = useState<DMAWithAssignment[]>([])
  const [groups, setGroups] = useState<PlanGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [editingPlan, setEditingPlan] = useState<string | null>(null)
  const [editingFeature, setEditingFeature] = useState<{ planId: string; index: number } | null>(null)
  
  // Group modal state
  const [showGroupModal, setShowGroupModal] = useState(false)
  const [editingGroup, setEditingGroup] = useState<PlanGroup | null>(null)
  const [groupForm, setGroupForm] = useState({
    name: '',
    description: '',
  })
  
  // Group override modal state
  const [showGroupOverrideModal, setShowGroupOverrideModal] = useState(false)
  const [editingGroupForOverride, setEditingGroupForOverride] = useState<PlanGroup | null>(null)
  const [groupOverrideForm, setGroupOverrideForm] = useState({
    plan_id: '',
    price_display: null as string | null,
    description: null as string | null,
    has_custom_features: false,
    features: [] as Feature[],
  })
  
  // DMA assignment modal state
  const [showAssignmentModal, setShowAssignmentModal] = useState(false)
  const [selectedDmaIds, setSelectedDmaIds] = useState<string[]>([])
  const [assignmentTarget, setAssignmentTarget] = useState<{ type: 'global' | 'group'; groupId?: string }>({ type: 'global' })

  useEffect(() => {
    fetchPlans()
    fetchDMAs()
    fetchDMAsWithAssignment()
    fetchGroups()
  }, [])

  const fetchPlans = async () => {
    try {
      const response = await fetch('/api/admin/subscription-plans')
      if (response.ok) {
        const data = await response.json()
        setPlans(data.plans || [])
      } else {
        const err = await response.json()
        setError(err.error || 'Failed to fetch plans')
      }
    } catch (err) {
      setError('Failed to fetch plans')
    } finally {
      setLoading(false)
    }
  }

  const fetchDMAs = async () => {
    try {
      const response = await fetch('/api/dmas')
      if (response.ok) {
        const data = await response.json()
        setDmas(data.dmas || data || [])
      }
    } catch (err) {
      console.error('Failed to fetch DMAs:', err)
    }
  }


  const fetchGroups = async () => {
    try {
      const response = await fetch('/api/admin/subscription-plans/groups')
      if (response.ok) {
        const data = await response.json()
        setGroups(data.groups || [])
      }
    } catch (err) {
      console.error('Failed to fetch groups:', err)
    }
  }

  const fetchDMAsWithAssignment = async () => {
    try {
      const response = await fetch('/api/admin/subscription-plans/dma-assignments')
      if (response.ok) {
        const data = await response.json()
        setDmasWithAssignment(data.dmas || [])
      }
    } catch (err) {
      console.error('Failed to fetch DMA assignments:', err)
    }
  }

  // Group management functions
  const openNewGroupModal = () => {
    setEditingGroup(null)
    setGroupForm({ name: '', description: '' })
    setShowGroupModal(true)
  }

  const openEditGroupModal = (group: PlanGroup) => {
    setEditingGroup(group)
    setGroupForm({ name: group.name, description: group.description || '' })
    setShowGroupModal(true)
  }

  const saveGroup = async () => {
    setSaving('group')
    setError(null)
    
    try {
      const url = editingGroup 
        ? `/api/admin/subscription-plans/groups/${editingGroup.id}`
        : '/api/admin/subscription-plans/groups'
      
      const response = await fetch(url, {
        method: editingGroup ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(groupForm),
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'Failed to save group')
      }

      setSuccess(editingGroup ? 'Group updated successfully!' : 'Group created successfully!')
      setShowGroupModal(false)
      await fetchGroups()
      await fetchDMAsWithAssignment()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(null)
    }
  }

  const deleteGroup = async (id: string) => {
    if (!confirm('Are you sure you want to delete this group? DMAs will be moved back to Global.')) return
    
    setSaving(id)
    setError(null)
    
    try {
      const response = await fetch(`/api/admin/subscription-plans/groups/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'Failed to delete group')
      }

      setSuccess('Group deleted successfully!')
      await fetchGroups()
      await fetchDMAsWithAssignment()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(null)
    }
  }

  // Group override functions
  const openGroupOverrideModal = (group: PlanGroup) => {
    setEditingGroupForOverride(group)
    setGroupOverrideForm({
      plan_id: plans[0]?.id || '',
      price_display: null,
      description: null,
      has_custom_features: false,
      features: [],
    })
    setShowGroupOverrideModal(true)
  }

  const prefillGroupOverrideFromGlobal = () => {
    const selectedPlan = plans.find(p => p.id === groupOverrideForm.plan_id)
    if (selectedPlan) {
      // Deduplicate features by feature_name
      const seenFeatures = new Set<string>()
      const uniqueFeatures = selectedPlan.subscription_plan_features
        .filter(f => {
          if (seenFeatures.has(f.feature_name)) {
            return false
          }
          seenFeatures.add(f.feature_name)
          return true
        })
        .map(f => ({
          feature_name: f.feature_name,
          feature_value: f.feature_value,
          is_included: f.is_included,
          is_highlighted: f.is_highlighted,
          sort_order: f.sort_order,
        }))
        .sort((a, b) => a.sort_order - b.sort_order)

      setGroupOverrideForm(prev => ({
        ...prev,
        price_display: selectedPlan.price_display,
        description: selectedPlan.description,
        has_custom_features: true,
        features: uniqueFeatures,
      }))
    }
  }

  const saveGroupOverride = async () => {
    if (!editingGroupForOverride) return
    
    setSaving('group-override')
    setError(null)
    
    try {
      // Auto-calculate price_cents from price_display
      const price_cents = groupOverrideForm.price_display 
        ? priceDisplayToCents(groupOverrideForm.price_display)
        : null

      const response = await fetch(`/api/admin/subscription-plans/groups/${editingGroupForOverride.id}/overrides`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan_id: groupOverrideForm.plan_id,
          price_cents: price_cents,
          price_display: groupOverrideForm.price_display,
          description: groupOverrideForm.description,
          has_custom_features: groupOverrideForm.has_custom_features,
          features: groupOverrideForm.has_custom_features ? groupOverrideForm.features : [],
        }),
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'Failed to save group override')
      }

      setSuccess('Group override saved successfully!')
      setShowGroupOverrideModal(false)
      await fetchGroups()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(null)
    }
  }

  const deleteGroupOverride = async (groupId: string, planId: string) => {
    if (!confirm('Are you sure you want to remove this plan override from the group?')) return
    
    const savingKey = `${groupId}-${planId}`
    setSaving(savingKey)
    setError(null)
    
    // Optimistically update UI first
    setGroups(prev => prev.map(group => {
      if (group.id === groupId) {
        return {
          ...group,
          overrides: group.overrides.filter(o => o.plan_id !== planId)
        }
      }
      return group
    }))
    
    try {
      const response = await fetch(`/api/admin/subscription-plans/groups/${groupId}/overrides?plan_id=${planId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const err = await response.json()
        // Revert optimistic update on error
        await fetchGroups()
        throw new Error(err.error || 'Failed to delete group override')
      }

      setSuccess('Group override removed successfully!')
      // Refresh in background (non-blocking)
      fetchGroups().catch(err => {
        console.error('Error refreshing groups:', err)
        // Silently fail - UI already updated optimistically
      })
    } catch (err: any) {
      setError(err.message)
      // Revert on error
      await fetchGroups()
    } finally {
      setSaving(null)
    }
  }

  // DMA assignment functions
  const openAssignmentModal = (dmaIds: string[]) => {
    setSelectedDmaIds(dmaIds)
    setAssignmentTarget({ type: 'global' })
    setShowAssignmentModal(true)
  }

  const saveAssignment = async () => {
    setSaving('assignment')
    setError(null)
    
    try {
      const response = await fetch('/api/admin/subscription-plans/dma-assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dma_ids: selectedDmaIds,
          target_type: assignmentTarget.type,
          target_id: assignmentTarget.type === 'group' ? assignmentTarget.groupId : null,
        }),
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'Failed to update assignments')
      }

      setSuccess(`${selectedDmaIds.length} DMA(s) assignment updated successfully!`)
      setShowAssignmentModal(false)
      setSelectedDmaIds([])
      await fetchDMAsWithAssignment()
      await fetchGroups()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(null)
    }
  }

  const updateGroupOverrideFeature = (index: number, field: string, value: any) => {
    setGroupOverrideForm(prev => ({
      ...prev,
      features: prev.features.map((f, i) => 
        i === index ? { ...f, [field]: value } : f
      ),
    }))
  }

  const addGroupOverrideFeature = () => {
    const maxOrder = Math.max(0, ...groupOverrideForm.features.map(f => f.sort_order))
    setGroupOverrideForm(prev => ({
      ...prev,
      features: [...prev.features, {
        feature_name: 'New Feature',
        feature_value: null,
        is_included: true,
        is_highlighted: false,
        sort_order: maxOrder + 1,
      }],
    }))
  }

  const removeGroupOverrideFeature = (index: number) => {
    setGroupOverrideForm(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index),
    }))
  }


  const savePlan = async (plan: Plan) => {
    setSaving(plan.id)
    setError(null)
    setSuccess(null)

    try {
      // Auto-calculate price_cents from price_display
      const planWithCents = {
        ...plan,
        price_cents: priceDisplayToCents(plan.price_display),
      }

      // Save plan details
      const planResponse = await fetch(`/api/admin/subscription-plans/${plan.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(planWithCents),
      })

      if (!planResponse.ok) {
        const err = await planResponse.json()
        throw new Error(err.error || 'Failed to save plan')
      }

      // Save features
      const featuresResponse = await fetch(`/api/admin/subscription-plans/${plan.id}/features`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ features: plan.subscription_plan_features }),
      })

      if (!featuresResponse.ok) {
        const err = await featuresResponse.json()
        throw new Error(err.error || 'Failed to save features')
      }

      setSuccess(`${plan.display_name} plan saved successfully!`)
      setEditingPlan(null)
      
      // Refresh data
      await fetchPlans()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(null)
    }
  }

  const updatePlanField = (planId: string, field: string, value: any) => {
    setPlans((prev: Plan[]) => prev.map((p: Plan): Plan => {
      if (p.id === planId) {
        return { ...p, [field]: value }
      }
      return p
    }))
  }

  const updateFeature = (planId: string, featureIndex: number, field: string, value: any) => {
    setPlans((prev: Plan[]) => prev.map((p: Plan): Plan => {
      if (p.id === planId) {
        const features = [...p.subscription_plan_features]
        features[featureIndex] = { ...features[featureIndex], [field]: value }
        return { ...p, subscription_plan_features: features }
      }
      return p
    }))
  }

  const addFeature = (planId: string) => {
    setPlans((prev: Plan[]) => prev.map((p: Plan): Plan => {
      if (p.id === planId) {
        const maxOrder = Math.max(0, ...p.subscription_plan_features.map(f => f.sort_order))
        return {
          ...p,
          subscription_plan_features: [
            ...p.subscription_plan_features,
            {
              feature_name: 'New Feature',
              feature_value: null,
              is_included: true,
              is_highlighted: false,
              sort_order: maxOrder + 1,
            }
          ]
        }
      }
      return p
    }))
  }

  const removeFeature = (planId: string, featureIndex: number) => {
    setPlans((prev: Plan[]) => prev.map((p: Plan): Plan => {
      if (p.id === planId) {
        return {
          ...p,
          subscription_plan_features: p.subscription_plan_features.filter((_, i) => i !== featureIndex)
        }
      }
      return p
    }))
  }

  const moveFeature = (planId: string, featureIndex: number, direction: 'up' | 'down') => {
    setPlans((prev: Plan[]): Plan[] => {
      return prev.map((p: Plan): Plan => {
        if (p.id === planId) {
          const features = [...p.subscription_plan_features]
          const newIndex = direction === 'up' ? featureIndex - 1 : featureIndex + 1
          
          if (newIndex < 0 || newIndex >= features.length) {
            return p
          }
          
          // Swap
          [features[featureIndex], features[newIndex]] = [features[newIndex], features[featureIndex]]
          
          // Update sort orders
          features.forEach((f, i) => { f.sort_order = i + 1 })
          
          return { ...p, subscription_plan_features: features }
        }
        return p
      })
    })
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Subscription Plans</h1>
        <p className="text-gray-600 mt-1">Manage subscription plan pricing and features</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
          {success}
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('plans')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'plans'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Global Plans
          </button>
          <button
            onClick={() => setActiveTab('groups')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'groups'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            DMA Groups {groups.length > 0 && <span className="ml-2 px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs">{groups.length}</span>}
          </button>
          <button
            onClick={() => setActiveTab('overrides')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overrides'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Assign DMAs to Group
          </button>
        </nav>
      </div>

      {activeTab === 'plans' && (
      <div className="space-y-6">
        {plans.map(plan => (
          <div key={plan.id} className="bg-white rounded-xl shadow-lg overflow-hidden">
            {/* Plan Header */}
            <div className={`px-6 py-4 flex items-center justify-between ${plan.is_recommended ? 'bg-primary text-white' : 'bg-gray-50'}`}>
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-bold">{plan.display_name}</h2>
                {plan.is_recommended && (
                  <span className="px-2 py-1 bg-white/20 rounded text-xs font-medium">RECOMMENDED</span>
                )}
                <span className={`px-2 py-1 rounded text-xs font-medium ${plan.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {plan.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {editingPlan === plan.id ? (
                  <>
                    <button
                      onClick={() => savePlan(plan)}
                      disabled={saving === plan.id}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      {saving === plan.id ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                      onClick={() => { setEditingPlan(null); fetchPlans(); }}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setEditingPlan(plan.id)}
                    className={`px-4 py-2 rounded-lg ${plan.is_recommended ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-primary text-white hover:bg-primary/90'}`}
                  >
                    Edit Plan
                  </button>
                )}
              </div>
            </div>

            {/* Plan Details */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {/* Price Display */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                  {editingPlan === plan.id ? (
                    <input
                      type="text"
                      value={plan.price_display}
                      onChange={(e) => updatePlanField(plan.id, 'price_display', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                      placeholder="$1,490"
                    />
                  ) : (
                    <p className="text-2xl font-bold text-gray-900">{plan.price_display}<span className="text-sm font-normal text-gray-500">/{plan.billing_period}</span></p>
                  )}
                </div>

                {/* Billing Period */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Billing Period</label>
                  {editingPlan === plan.id ? (
                    <select
                      value={plan.billing_period}
                      onChange={(e) => updatePlanField(plan.id, 'billing_period', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                    >
                      <option value="month">Monthly</option>
                      <option value="year">Yearly</option>
                    </select>
                  ) : (
                    <p className="text-gray-600 capitalize">{plan.billing_period}ly</p>
                  )}
                </div>

                {/* Options */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Options</label>
                  {editingPlan === plan.id ? (
                    <div className="space-y-2">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={plan.is_recommended}
                          onChange={(e) => updatePlanField(plan.id, 'is_recommended', e.target.checked)}
                          className="rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <span className="text-sm">Recommended</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={plan.is_active}
                          onChange={(e) => updatePlanField(plan.id, 'is_active', e.target.checked)}
                          className="rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <span className="text-sm">Active</span>
                      </label>
                    </div>
                  ) : (
                    <div className="text-gray-600 text-sm">
                      {plan.is_recommended && <span className="block">✓ Recommended</span>}
                      {plan.is_active && <span className="block">✓ Active</span>}
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                {editingPlan === plan.id ? (
                  <textarea
                    value={plan.description || ''}
                    onChange={(e) => updatePlanField(plan.id, 'description', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                    rows={2}
                  />
                ) : (
                  <p className="text-gray-600">{plan.description || 'No description'}</p>
                )}
              </div>

              {/* Features */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">Features</label>
                  {editingPlan === plan.id && (
                    <button
                      onClick={() => addFeature(plan.id)}
                      className="px-3 py-1 text-sm bg-primary text-white rounded hover:bg-primary/90"
                    >
                      + Add Feature
                    </button>
                  )}
                </div>
                
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Feature Name</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase w-24">Value</th>
                        <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase w-24">Included</th>
                        <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase w-24">Highlight</th>
                        {editingPlan === plan.id && (
                          <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase w-32">Actions</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {plan.subscription_plan_features.map((feature, index) => (
                        <tr key={feature.id || index} className="hover:bg-gray-50">
                          <td className="px-4 py-2">
                            {editingPlan === plan.id ? (
                              <input
                                type="text"
                                value={feature.feature_name}
                                onChange={(e) => updateFeature(plan.id, index, 'feature_name', e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-primary focus:border-primary text-sm"
                              />
                            ) : (
                              <span className={feature.is_highlighted ? 'font-semibold' : ''}>{feature.feature_name}</span>
                            )}
                          </td>
                          <td className="px-4 py-2">
                            {editingPlan === plan.id ? (
                              <input
                                type="text"
                                value={feature.feature_value || ''}
                                onChange={(e) => updateFeature(plan.id, index, 'feature_value', e.target.value || null)}
                                className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-primary focus:border-primary text-sm"
                                placeholder="—"
                              />
                            ) : (
                              <span className="text-gray-600">{feature.feature_value || '—'}</span>
                            )}
                          </td>
                          <td className="px-4 py-2 text-center">
                            {editingPlan === plan.id ? (
                              <input
                                type="checkbox"
                                checked={feature.is_included}
                                onChange={(e) => updateFeature(plan.id, index, 'is_included', e.target.checked)}
                                className="rounded border-gray-300 text-primary focus:ring-primary"
                              />
                            ) : (
                              feature.is_included ? (
                                <svg className="w-5 h-5 text-green-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              ) : (
                                <svg className="w-5 h-5 text-red-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              )
                            )}
                          </td>
                          <td className="px-4 py-2 text-center">
                            {editingPlan === plan.id ? (
                              <input
                                type="checkbox"
                                checked={feature.is_highlighted}
                                onChange={(e) => updateFeature(plan.id, index, 'is_highlighted', e.target.checked)}
                                className="rounded border-gray-300 text-primary focus:ring-primary"
                              />
                            ) : (
                              feature.is_highlighted && <span className="text-yellow-500">★</span>
                            )}
                          </td>
                          {editingPlan === plan.id && (
                            <td className="px-4 py-2 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => moveFeature(plan.id, index, 'up')}
                                  disabled={index === 0}
                                  className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                                >
                                  ↑
                                </button>
                                <button
                                  onClick={() => moveFeature(plan.id, index, 'down')}
                                  disabled={index === plan.subscription_plan_features.length - 1}
                                  className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                                >
                                  ↓
                                </button>
                                <button
                                  onClick={() => removeFeature(plan.id, index)}
                                  className="p-1 text-red-400 hover:text-red-600"
                                >
                                  ×
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                      {plan.subscription_plan_features.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                            No features defined. {editingPlan === plan.id && 'Click "Add Feature" to add one.'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      )}

      {activeTab === 'groups' && (
        <div>
          {/* Header with Add button */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">DMA Groups</h2>
              <p className="text-sm text-gray-600">Create named groups to apply shared pricing/features to multiple DMAs at once.</p>
            </div>
            <button
              onClick={openNewGroupModal}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 font-medium"
            >
              + Create Group
            </button>
          </div>

          {/* Groups List */}
          {groups.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
              <p className="mb-4">No DMA groups created yet.</p>
              <p className="text-sm">Create a group to apply shared pricing to multiple DMAs.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {groups.map(group => (
                <div key={group.id} className="bg-white rounded-xl shadow-lg overflow-hidden">
                  {/* Group Header */}
                  <div className="px-6 py-4 bg-blue-50 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <h3 className="text-lg font-bold text-gray-900">{group.name}</h3>
                      <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
                        {group.dma_count} DMA{group.dma_count !== 1 ? 's' : ''}
                      </span>
                      {group.overrides.length > 0 && (
                        <span className="px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                          {group.overrides.length} plan override{group.overrides.length !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openGroupOverrideModal(group)}
                        className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                      >
                        + Add Plan Override
                      </button>
                      <button
                        onClick={() => openEditGroupModal(group)}
                        className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteGroup(group.id)}
                        disabled={saving === group.id}
                        className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium disabled:opacity-50"
                      >
                        {saving === group.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </div>

                  <div className="p-6">
                    {/* Description */}
                    {group.description && (
                      <p className="text-gray-600 mb-4">{group.description}</p>
                    )}

                    {/* DMAs in this group */}
                    <div className="mb-6">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">DMAs in this group:</h4>
                      {group.dmas.length === 0 ? (
                        <p className="text-sm text-gray-400">No DMAs assigned yet. Use the "Assign DMAs to Group" tab to assign DMAs.</p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {group.dmas.map(dma => (
                            <span key={dma.id} className="px-2 py-1 rounded bg-gray-100 text-gray-700 text-sm">
                              {dma.name} (DMA {dma.code})
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Plan overrides for this group */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Plan Overrides:</h4>
                      {group.overrides.length === 0 ? (
                        <p className="text-sm text-gray-400">No plan overrides. Click "Add Plan Override" above.</p>
                      ) : (
                        <div className="border rounded-lg overflow-hidden">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Plan</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Price Override</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Custom Features</th>
                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {group.overrides.map(override => {
                                const globalPlan = plans.find(p => p.id === override.plan_id)
                                return (
                                  <tr key={override.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-2">
                                      <span className="font-medium text-gray-900">{override.plan?.display_name || 'Unknown'}</span>
                                    </td>
                                    <td className="px-4 py-2">
                                      {override.price_display ? (
                                        <span className="text-green-600 font-medium">{override.price_display}</span>
                                      ) : (
                                        <span className="text-gray-400">Using global ({globalPlan?.price_display})</span>
                                      )}
                                    </td>
                                    <td className="px-4 py-2">
                                      {override.has_custom_features ? (
                                        <span className="text-purple-600">{override.features.length} custom features</span>
                                      ) : (
                                        <span className="text-gray-400">Using global</span>
                                      )}
                                    </td>
                                    <td className="px-4 py-2 text-right">
                                      <button
                                        onClick={() => deleteGroupOverride(group.id, override.plan_id)}
                                        disabled={saving === `${group.id}-${override.plan_id}`}
                                        className="text-red-600 hover:text-red-800 text-sm font-medium disabled:opacity-50"
                                      >
                                        Remove
                                      </button>
                                    </td>
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'overrides' && (
        <div>
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Assign DMAs to Group</h2>
              <p className="text-sm text-gray-600">View all DMAs and assign them to Global or a Group. Each DMA can only be in one group or use global settings.</p>
            </div>
            <div className="flex gap-2">
              {selectedDmaIds.length > 0 && (
                <button
                  onClick={() => openAssignmentModal(selectedDmaIds)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  Move {selectedDmaIds.length} Selected
                </button>
              )}
            </div>
          </div>

          {/* All DMAs with Assignment */}
          <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
            <div className="px-6 py-4 border-b bg-gray-50">
              <h3 className="font-medium text-gray-900">All DMAs</h3>
              <p className="text-sm text-gray-500">Select DMAs to move them between Global and Groups</p>
            </div>
            <div className="max-h-96 overflow-y-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-2 w-10">
                      <input
                        type="checkbox"
                        checked={selectedDmaIds.length === dmasWithAssignment.length && dmasWithAssignment.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedDmaIds(dmasWithAssignment.map(d => d.id))
                          } else {
                            setSelectedDmaIds([])
                          }
                        }}
                        className="rounded border-gray-300 text-primary focus:ring-primary"
                      />
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">DMA</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Current Assignment</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {dmasWithAssignment.map(dma => (
                    <tr key={dma.id} className={`hover:bg-gray-50 ${selectedDmaIds.includes(dma.id) ? 'bg-blue-50' : ''}`}>
                      <td className="px-4 py-2">
                        <input
                          type="checkbox"
                          checked={selectedDmaIds.includes(dma.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedDmaIds(prev => [...prev, dma.id])
                            } else {
                              setSelectedDmaIds(prev => prev.filter(id => id !== dma.id))
                            }
                          }}
                          className="rounded border-gray-300 text-primary focus:ring-primary"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <span className="font-medium text-gray-900">{dma.name}</span>
                        <span className="text-xs text-gray-400 ml-2">DMA {dma.code}</span>
                      </td>
                      <td className="px-4 py-2">
                        {dma.assignment_type === 'global' && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                            Global
                          </span>
                        )}
                        {dma.assignment_type === 'group' && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                            Group: {dma.group_name}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-right">
                        <button
                          onClick={() => openAssignmentModal([dma.id])}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          Change
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* Group Modal */}
      {showGroupModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setShowGroupModal(false)} />
            
            <div className="inline-block w-full max-w-md my-8 overflow-hidden text-left align-middle transition-all transform bg-white rounded-lg shadow-xl">
              <div className="px-6 py-4 bg-blue-50 border-b">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingGroup ? 'Edit Group' : 'Create Group'}
                </h3>
              </div>

              <div className="px-6 py-4">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Group Name</label>
                  <input
                    type="text"
                    value={groupForm.name}
                    onChange={(e) => setGroupForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                    placeholder="e.g., Tier 2 Markets"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
                  <textarea
                    value={groupForm.description}
                    onChange={(e) => setGroupForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                    rows={3}
                    placeholder="Describe this group..."
                  />
                </div>
              </div>

              <div className="px-6 py-4 bg-gray-50 border-t flex justify-end gap-3">
                <button
                  onClick={() => setShowGroupModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={saveGroup}
                  disabled={saving === 'group' || !groupForm.name}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
                >
                  {saving === 'group' ? 'Saving...' : (editingGroup ? 'Update Group' : 'Create Group')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Group Override Modal */}
      {showGroupOverrideModal && editingGroupForOverride && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setShowGroupOverrideModal(false)} />
            
            <div className="inline-block w-full max-w-3xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white rounded-lg shadow-xl">
              <div className="px-6 py-4 bg-green-50 border-b">
                <h3 className="text-lg font-semibold text-gray-900">
                  Add Plan Override to "{editingGroupForOverride.name}"
                </h3>
              </div>

              <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
                {/* Plan Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Plan</label>
                  <select
                    value={groupOverrideForm.plan_id}
                    onChange={(e) => setGroupOverrideForm(prev => ({ ...prev, plan_id: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                  >
                    <option value="">Select a plan</option>
                    {plans.map(plan => (
                      <option key={plan.id} value={plan.id}>{plan.display_name}</option>
                    ))}
                  </select>
                </div>

                {/* Prefill Button */}
                {groupOverrideForm.plan_id && (
                  <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-blue-800">Pre-fill from Global Settings</p>
                        <p className="text-xs text-blue-600">Copy all settings from the global plan, then modify what's different.</p>
                      </div>
                      <button
                        onClick={prefillGroupOverrideFromGlobal}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                      >
                        Copy Global
                      </button>
                    </div>
                  </div>
                )}

                {/* Price Override */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Price Override</h4>
                  <p className="text-xs text-gray-500 mb-2">Leave blank to use global pricing</p>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Price</label>
                    <input
                      type="text"
                      value={groupOverrideForm.price_display || ''}
                      onChange={(e) => setGroupOverrideForm(prev => ({ ...prev, price_display: e.target.value || null }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder={plans.find(p => p.id === groupOverrideForm.plan_id)?.price_display || 'Global'}
                    />
                  </div>
                </div>

                {/* Custom Features Toggle */}
                <div className="mb-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={groupOverrideForm.has_custom_features}
                      onChange={(e) => setGroupOverrideForm(prev => ({ ...prev, has_custom_features: e.target.checked }))}
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-gray-700">Use custom features for this group</span>
                  </label>
                </div>

                {/* Features Table (if enabled) */}
                {groupOverrideForm.has_custom_features && (
                  <div className="mb-4">
                    <div className="flex justify-end mb-2">
                      <button
                        onClick={addGroupOverrideFeature}
                        className="px-3 py-1 text-sm bg-primary text-white rounded hover:bg-primary/90"
                      >
                        + Add Feature
                      </button>
                    </div>
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase w-20">Value</th>
                            <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase w-16">Inc.</th>
                            <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase w-16">★</th>
                            <th className="px-3 py-2 w-16"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {groupOverrideForm.features.map((feature, index) => (
                            <tr key={index}>
                              <td className="px-3 py-2">
                                <input
                                  type="text"
                                  value={feature.feature_name}
                                  onChange={(e) => updateGroupOverrideFeature(index, 'feature_name', e.target.value)}
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                />
                              </td>
                              <td className="px-3 py-2">
                                <input
                                  type="text"
                                  value={feature.feature_value || ''}
                                  onChange={(e) => updateGroupOverrideFeature(index, 'feature_value', e.target.value || null)}
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                  placeholder="—"
                                />
                              </td>
                              <td className="px-3 py-2 text-center">
                                <input
                                  type="checkbox"
                                  checked={feature.is_included}
                                  onChange={(e) => updateGroupOverrideFeature(index, 'is_included', e.target.checked)}
                                  className="rounded border-gray-300 text-primary focus:ring-primary"
                                />
                              </td>
                              <td className="px-3 py-2 text-center">
                                <input
                                  type="checkbox"
                                  checked={feature.is_highlighted}
                                  onChange={(e) => updateGroupOverrideFeature(index, 'is_highlighted', e.target.checked)}
                                  className="rounded border-gray-300 text-primary focus:ring-primary"
                                />
                              </td>
                              <td className="px-3 py-2 text-center">
                                <button
                                  onClick={() => removeGroupOverrideFeature(index)}
                                  className="text-red-400 hover:text-red-600"
                                >
                                  ×
                                </button>
                              </td>
                            </tr>
                          ))}
                          {groupOverrideForm.features.length === 0 && (
                            <tr>
                              <td colSpan={5} className="px-3 py-4 text-center text-gray-400 text-sm">
                                No features. Click "Add Feature" or "Copy Global" above.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              <div className="px-6 py-4 bg-gray-50 border-t flex justify-end gap-3">
                <button
                  onClick={() => setShowGroupOverrideModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={saveGroupOverride}
                  disabled={saving === 'group-override' || !groupOverrideForm.plan_id}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
                >
                  {saving === 'group-override' ? 'Saving...' : 'Save Override'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assignment Modal */}
      {showAssignmentModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setShowAssignmentModal(false)} />
            
            <div className="inline-block w-full max-w-md my-8 overflow-hidden text-left align-middle transition-all transform bg-white rounded-lg shadow-xl">
              <div className="px-6 py-4 bg-blue-50 border-b">
                <h3 className="text-lg font-semibold text-gray-900">
                  Move {selectedDmaIds.length} DMA{selectedDmaIds.length !== 1 ? 's' : ''}
                </h3>
              </div>

              <div className="px-6 py-4">
                <p className="text-sm text-gray-600 mb-4">
                  Select where to move the selected DMA{selectedDmaIds.length !== 1 ? 's' : ''}:
                </p>

                <div className="space-y-3">
                  {/* Global option */}
                  <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      checked={assignmentTarget.type === 'global'}
                      onChange={() => setAssignmentTarget({ type: 'global' })}
                      className="text-primary focus:ring-primary"
                    />
                    <div>
                      <span className="font-medium text-gray-900">Global</span>
                      <p className="text-xs text-gray-500">Use default global pricing</p>
                    </div>
                  </label>

                  {/* Group options */}
                  {groups.map(group => (
                    <label key={group.id} className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        checked={assignmentTarget.type === 'group' && assignmentTarget.groupId === group.id}
                        onChange={() => setAssignmentTarget({ type: 'group', groupId: group.id })}
                        className="text-primary focus:ring-primary"
                      />
                      <div>
                        <span className="font-medium text-gray-900">{group.name}</span>
                        <p className="text-xs text-gray-500">
                          {group.dma_count} DMA{group.dma_count !== 1 ? 's' : ''} • {group.overrides.length} override{group.overrides.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </label>
                  ))}

                  {groups.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-4">
                      No groups created yet. Create a group in the DMA Groups tab first.
                    </p>
                  )}
                </div>
              </div>

              <div className="px-6 py-4 bg-gray-50 border-t flex justify-end gap-3">
                <button
                  onClick={() => setShowAssignmentModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={saveAssignment}
                  disabled={saving === 'assignment'}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
                >
                  {saving === 'assignment' ? 'Moving...' : 'Move DMAs'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

