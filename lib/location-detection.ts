/**
 * Location Detection Utility
 * Attempts to detect user's location using IP geolocation
 * Falls back gracefully if detection fails
 */

export interface UserLocation {
  city: string | null
  state: string | null
  stateCode: string | null
  zipCode: string | null
  detected: boolean
  method: 'ip' | 'browser' | 'fallback'
}

/**
 * Attempts to detect user's location using IP geolocation
 * Uses ipapi.co free tier API
 */
export async function detectUserLocation(): Promise<UserLocation> {
  try {
    // Try IP-based geolocation first
    const response = await fetch('https://ipapi.co/json/', {
      headers: {
        'Accept': 'application/json',
      },
    })
    
    if (response.ok) {
      const data = await response.json()
      
      if (data.city && data.region_code) {
        return {
          city: data.city,
          state: data.region,
          stateCode: data.region_code,
          zipCode: data.postal || null, // Extract zip code from postal field
          detected: true,
          method: 'ip',
        }
      }
    }
  } catch (error) {
    console.error('IP geolocation failed:', error)
  }

  // Fallback: return signal that we couldn't detect location
  return {
    city: null,
    state: null,
    stateCode: null,
    zipCode: null,
    detected: false,
    method: 'fallback',
  }
}

/**
 * React hook to detect and manage user location
 * For use in client components
 */
export function useUserLocation() {
  if (typeof window === 'undefined') {
    // Server-side: return loading state
    return { location: null, isLoading: true }
  }

  // This will be implemented in the client component
  // We'll use React hooks there
  return { location: null, isLoading: true }
}


