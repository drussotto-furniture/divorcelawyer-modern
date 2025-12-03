'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { createClient } from '@/lib/supabase/client'

// Pricing data based on the spreadsheet
const pricingPlans = [
  {
    name: 'Premium',
    price: '$1,490',
    period: '/month per lawyer',
    firmPrice: 'Included',
    description: 'Maximum visibility and premium features for top-tier law practices',
    highlighted: true,
    features: [
      { name: 'Law Firm Profile', included: true },
      { name: 'Lawyer Profile', included: true },
      { name: 'Welcome Video', included: true },
      { name: 'Featured Placement', included: true },
      { name: 'Semi-featured', included: true },
      { name: 'Listing', included: true },
      { name: 'Reviews', included: true },
      { name: 'Podcasts (Apple & Spotify)', included: '3' },
      { name: 'Press Release', included: true },
      { name: 'SEO Optimization', included: true },
      { name: 'Profile Articles', included: true },
      { name: 'Profile Videos', included: true },
      { name: 'Geo-fenced Territory', included: true },
      { name: 'Social Media via DivorceLawyer.com', included: true },
      { name: 'Dedicated Client Experience Rep', included: true },
      { name: 'Onboarding Coordinator', included: true },
      { name: 'Digital Badge', included: true },
      { name: 'Digital Badge - Founding Member', included: true },
      { name: 'BestLawyers Announcement', included: true },
      { name: 'Back Links', included: true },
      { name: 'Custom Phone Number', included: true },
      { name: 'Link to Website', included: true },
    ],
    buttonText: 'Upgrade to Premium',
    subscriptionType: 'premium',
  },
  {
    name: 'Enhanced',
    price: '$990',
    period: '/month per lawyer',
    firmPrice: 'GWP',
    description: 'Enhanced visibility with professional features for growing practices',
    highlighted: false,
    features: [
      { name: 'Law Firm Profile', included: true },
      { name: 'Lawyer Profile', included: true },
      { name: 'Welcome Video', included: true },
      { name: 'Featured Placement', included: false },
      { name: 'Semi-featured', included: true },
      { name: 'Listing', included: true },
      { name: 'Reviews', included: true },
      { name: 'Podcasts (Apple & Spotify)', included: '2' },
      { name: 'Press Release', included: true },
      { name: 'SEO Optimization', included: true },
      { name: 'Profile Articles', included: true },
      { name: 'Profile Videos', included: true },
      { name: 'Geo-fenced Territory', included: true },
      { name: 'Social Media via DivorceLawyer.com', included: true },
      { name: 'Dedicated Client Experience Rep', included: true },
      { name: 'Onboarding Coordinator', included: true },
      { name: 'Digital Badge', included: true },
      { name: 'Digital Badge - Founding Member', included: false },
      { name: 'BestLawyers Announcement', included: true },
      { name: 'Back Links', included: true },
      { name: 'Custom Phone Number', included: '?' },
      { name: 'Link to Website', included: true },
    ],
    buttonText: 'Upgrade to Enhanced',
    subscriptionType: 'enhanced',
  },
  {
    name: 'Basic',
    price: '$240',
    period: '/month per lawyer',
    firmPrice: 'N/A',
    description: 'Essential listing to establish your online presence',
    highlighted: false,
    features: [
      { name: 'Law Firm Profile', included: false },
      { name: 'Lawyer Profile', included: false },
      { name: 'Welcome Video', included: false },
      { name: 'Featured Placement', included: false },
      { name: 'Semi-featured', included: false },
      { name: 'Listing', included: true },
      { name: 'Reviews', included: false },
      { name: 'Podcasts (Apple & Spotify)', included: false },
      { name: 'Press Release', included: '?' },
      { name: 'SEO Optimization', included: false },
      { name: 'Profile Articles', included: false },
      { name: 'Profile Videos', included: false },
      { name: 'Geo-fenced Territory', included: true },
      { name: 'Social Media via DivorceLawyer.com', included: false },
      { name: 'Dedicated Client Experience Rep', included: true },
      { name: 'Onboarding Coordinator', included: true },
      { name: 'Digital Badge', included: true },
      { name: 'Digital Badge - Founding Member', included: false },
      { name: 'BestLawyers Announcement', included: false },
      { name: 'Back Links', included: true },
      { name: 'Custom Phone Number', included: false },
      { name: 'Link to Website', included: true },
    ],
    buttonText: 'Upgrade to Basic',
    subscriptionType: 'basic',
  },
]

function UpgradePageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const lawyerId = searchParams.get('lawyerId')
  const dmaId = searchParams.get('dmaId')
  const currentSubscription = searchParams.get('current') || 'free'
  
  const [loading, setLoading] = useState<string | null>(null)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [upgradedPlan, setUpgradedPlan] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleUpgrade = async (subscriptionType: string, planName: string) => {
    if (!lawyerId || !dmaId) {
      setError('Missing lawyer or DMA information. Please go back and try again.')
      return
    }

    setLoading(subscriptionType)
    setError(null)

    try {
      const supabase = createClient()

      // Update the lawyer_service_areas table with the new subscription type
      const { error: updateError } = await (supabase as any)
        .from('lawyer_service_areas')
        .update({ subscription_type: subscriptionType })
        .eq('lawyer_id', lawyerId)
        .eq('dma_id', dmaId)

      if (updateError) {
        throw updateError
      }

      // Also update the lawyer's default subscription_type
      await supabase
        .from('lawyers')
        .update({ subscription_type: subscriptionType })
        .eq('id', lawyerId)

      setUpgradedPlan(planName)
      setShowConfirmation(true)
    } catch (err: any) {
      console.error('Error upgrading subscription:', err)
      setError(err.message || 'Failed to upgrade subscription. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  const handleReturnToProfile = () => {
    router.push(`/admin/directory/lawyers/${lawyerId}#section-subscription`)
  }

  // Confirmation Modal
  if (showConfirmation) {
    return (
      <div className="min-h-screen bg-subtle-sand">
        <Header />
        <main className="pt-[101px] pb-20">
          <div className="container mx-auto px-4 py-16">
            <div className="max-w-lg mx-auto bg-white rounded-2xl shadow-xl p-8 text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Congratulations! 🎉
              </h2>
              <p className="text-lg text-gray-600 mb-2">
                You have successfully upgraded to
              </p>
              <p className="text-2xl font-bold text-primary mb-6">
                {upgradedPlan}
              </p>
              <p className="text-gray-500 mb-8">
                Your new subscription is now active. Enjoy your enhanced visibility and features!
              </p>
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
        <section className="bg-gradient-to-br from-bluish to-bluish/90 text-white py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Upgrade Your Subscription
            </h1>
            <p className="text-xl text-white/80 max-w-2xl mx-auto">
              Boost your visibility and connect with more clients. Choose the plan that's right for your practice.
            </p>
            {currentSubscription && currentSubscription !== 'free' && (
              <p className="mt-4 text-white/70">
                Current plan: <span className="font-semibold capitalize">{currentSubscription}</span>
              </p>
            )}
          </div>
        </section>

        {/* Error Message */}
        {error && (
          <div className="container mx-auto px-4 mt-8">
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          </div>
        )}

        {/* Pricing Cards */}
        <section className="container mx-auto px-4 py-16">
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {pricingPlans.map((plan) => (
              <div
                key={plan.name}
                className={`relative bg-white rounded-2xl shadow-lg overflow-hidden transition-transform hover:scale-105 ${
                  plan.highlighted ? 'ring-4 ring-primary' : ''
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute top-0 left-0 right-0 bg-primary text-white text-center py-2 text-sm font-bold">
                    MOST POPULAR
                  </div>
                )}
                
                <div className={`p-8 ${plan.highlighted ? 'pt-14' : ''}`}>
                  {/* Plan Header */}
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <p className="text-gray-500 text-sm mb-4 h-12">{plan.description}</p>
                  
                  {/* Price */}
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                    <span className="text-gray-500 text-sm">{plan.period}</span>
                    <p className="text-sm text-gray-500 mt-1">
                      Firm pricing: <span className="font-medium">{plan.firmPrice}</span>
                    </p>
                  </div>

                  {/* CTA Button */}
                  <button
                    onClick={() => handleUpgrade(plan.subscriptionType, plan.name)}
                    disabled={loading !== null || currentSubscription === plan.subscriptionType}
                    className={`w-full py-4 rounded-lg font-bold text-lg transition-colors mb-8 ${
                      plan.highlighted
                        ? 'bg-primary text-white hover:bg-primary/90'
                        : 'bg-gray-900 text-white hover:bg-gray-800'
                    } ${
                      (loading !== null || currentSubscription === plan.subscriptionType)
                        ? 'opacity-50 cursor-not-allowed'
                        : ''
                    }`}
                  >
                    {loading === plan.subscriptionType ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Processing...
                      </span>
                    ) : currentSubscription === plan.subscriptionType ? (
                      'Current Plan'
                    ) : (
                      plan.buttonText
                    )}
                  </button>

                  {/* Features List */}
                  <div className="border-t border-gray-100 pt-6">
                    <p className="text-sm font-semibold text-gray-700 mb-4">What's included:</p>
                    <ul className="space-y-3">
                      {plan.features.slice(0, 12).map((feature, index) => (
                        <li key={index} className="flex items-start gap-3 text-sm">
                          {feature.included === true ? (
                            <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : feature.included === false ? (
                            <svg className="w-5 h-5 text-gray-300 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          ) : (
                            <span className="w-5 h-5 flex items-center justify-center text-primary font-bold flex-shrink-0">
                              {feature.included}
                            </span>
                          )}
                          <span className={feature.included ? 'text-gray-700' : 'text-gray-400'}>
                            {feature.name}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Back Link */}
          <div className="text-center mt-12">
            <button
              onClick={() => router.back()}
              className="text-gray-500 hover:text-gray-700 underline"
            >
              ← Back to profile
            </button>
          </div>
        </section>

        {/* FAQ or Additional Info */}
        <section className="bg-white py-16">
          <div className="container mx-auto px-4 max-w-3xl text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Questions about our plans?</h2>
            <p className="text-gray-600 mb-6">
              Our team is here to help you choose the right plan for your practice. 
              Contact us for a personalized consultation.
            </p>
            <a
              href="mailto:support@divorcelawyer.com"
              className="inline-flex items-center gap-2 text-primary font-semibold hover:underline"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              support@divorcelawyer.com
            </a>
          </div>
        </section>
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

