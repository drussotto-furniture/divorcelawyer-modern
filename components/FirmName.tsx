'use client'

// Decode HTML entities
function decodeHtmlEntities(text: string): string {
  const entities: { [key: string]: string } = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#039;': "'",
    '&apos;': "'",
  }
  return text.replace(/&amp;|&lt;|&gt;|&quot;|&#039;|&apos;/g, (match) => entities[match] || match)
}

interface FirmNameProps {
  name: string
}

export default function FirmName({ name }: FirmNameProps) {
  const decodedName = decodeHtmlEntities(name)
  
  // Split the name into words
  const words = decodedName.split(' ').filter(word => word.length > 0)
  
  // If name is 2 words or less, return as is (will fit on one line)
  if (words.length <= 2) {
    return (
      <h3 className="firm-name-title firm-name-single">
        {decodedName}
      </h3>
    )
  }
  
  // For names with 3+ words, always split into exactly 2 lines
  // Strategy: Find the best breaking point to balance the two lines
  
  // First, try to find natural break points (after "&", "LLC", "P.C.", etc.)
  const breakPointMarkers = ['&', 'LLC', 'P.C.', 'LLP', 'Inc.', 'Ltd.', 'PC']
  let bestBreakPoint = -1
  
  for (let i = 0; i < words.length - 1; i++) {
    const word = words[i].replace(/[.,]/g, '').toUpperCase() // Remove punctuation and uppercase for comparison
    if (breakPointMarkers.some(marker => word === marker.toUpperCase())) {
      bestBreakPoint = i + 1
      break
    }
  }
  
  // If no natural break point found, calculate optimal split based on character count
  if (bestBreakPoint === -1) {
    // Calculate character lengths to balance the lines
    const totalChars = decodedName.length
    const targetCharsPerLine = totalChars / 2
    
    let currentChars = 0
    bestBreakPoint = Math.floor(words.length / 2) // Start with floor for better balance
    
    // Find the point where we're closest to half the characters
    for (let i = 0; i < words.length - 1; i++) {
      currentChars += words[i].length + 1 // +1 for space
      if (currentChars >= targetCharsPerLine) {
        bestBreakPoint = i + 1
        break
      }
    }
    
    // Ensure we don't put everything on one line or leave too little on second line
    if (bestBreakPoint >= words.length - 1) {
      bestBreakPoint = Math.floor(words.length / 2)
    }
    if (bestBreakPoint < 1) {
      bestBreakPoint = 1
    }
    // Ensure second line has at least 2 words if possible
    if (words.length >= 4 && bestBreakPoint === words.length - 1) {
      bestBreakPoint = Math.max(1, words.length - 2)
    }
  }
  
  // Split the words
  const firstLine = words.slice(0, bestBreakPoint).join(' ')
  const secondLine = words.slice(bestBreakPoint).join(' ')
  
  return (
    <h3 className="firm-name-title firm-name-two-lines">
      <span className="firm-name-line firm-name-line-1">{firstLine}</span>
      <br />
      <span className="firm-name-line firm-name-line-2">{secondLine}</span>
    </h3>
  )
}

