/**
 * Geocoding utility functions
 * Converts addresses to coordinates using a geocoding service
 */

export interface Coordinates {
  latitude: number
  longitude: number
}

/**
 * Geocode an address to get coordinates
 * Uses a free geocoding service (Nominatim OpenStreetMap)
 */
export async function geocodeAddress(address: string): Promise<Coordinates | null> {
  try {
    const encodedAddress = encodeURIComponent(address)
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1`,
      {
        headers: {
          'User-Agent': 'DivorceLawyer.com/1.0' // Required by Nominatim
        }
      }
    )

    if (!response.ok) {
      throw new Error('Geocoding request failed')
    }

    const data = await response.json()
    
    if (data && data.length > 0) {
      return {
        latitude: parseFloat(data[0].lat),
        longitude: parseFloat(data[0].lon)
      }
    }

    return null
  } catch (error) {
    console.error('Error geocoding address:', error)
    return null
  }
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in miles
 */
export function calculateDistance(
  coord1: Coordinates,
  coord2: Coordinates
): number {
  const R = 3959 // Earth's radius in miles
  const dLat = toRadians(coord2.latitude - coord1.latitude)
  const dLon = toRadians(coord2.longitude - coord1.longitude)
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(coord1.latitude)) *
      Math.cos(toRadians(coord2.latitude)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c
  
  return distance
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180)
}

/**
 * Geocode a city name and return coordinates and zip codes
 * Uses Nominatim OpenStreetMap which can return postal codes
 */
export async function geocodeCityWithZipCodes(
  cityName: string,
  stateAbbr?: string
): Promise<{
  coordinates: Coordinates | null
  zipCodes: string[]
  cityName: string
} | null> {
  try {
    // Build search query: "City, State" or just "City"
    const query = stateAbbr 
      ? `${cityName}, ${stateAbbr}, USA`
      : `${cityName}, USA`
    
    console.log(`🌐 Geocoding city via Nominatim: "${query}"`)
    const encodedQuery = encodeURIComponent(query)
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodedQuery}&addressdetails=1&limit=10`,
      {
        headers: {
          'User-Agent': 'DivorceLawyer.com/1.0' // Required by Nominatim
        }
      }
    )

    if (!response.ok) {
      throw new Error('Geocoding request failed')
    }

    const data = await response.json()
    
    if (data && data.length > 0) {
      // Find the best match (usually the first one)
      const result = data[0]
      const coordinates = {
        latitude: parseFloat(result.lat),
        longitude: parseFloat(result.lon)
      }
      
      // Extract zip codes from the results
      // Nominatim returns postal codes in the address object
      const zipCodes: string[] = []
      
      // The result might have postal_code in address
      if (result.address?.postcode) {
        zipCodes.push(result.address.postcode)
      }
      
      // Also check other results for more zip codes in the same city
      data.forEach((item: any) => {
        if (item.address?.postcode && !zipCodes.includes(item.address.postcode)) {
          zipCodes.push(item.address.postcode)
        }
      })
      
      console.log(`✅ Geocoded city "${cityName}": ${coordinates.latitude}, ${coordinates.longitude}, found ${zipCodes.length} zip codes from Nominatim`)
      
      // If no zip codes from Nominatim, we'll need to find them another way
      // But for now, return what we have - the calling function can handle this
      
      return {
        coordinates,
        zipCodes,
        cityName: result.address?.city || result.address?.town || result.address?.municipality || cityName
      }
    }

    console.warn(`⚠️ No results from Nominatim for "${query}"`)
    return null
  } catch (error) {
    console.error('Error geocoding city:', error)
    return null
  }
}

