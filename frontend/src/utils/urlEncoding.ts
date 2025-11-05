// URL encoding utilities for Last.fm-compatible URLs
// Following Last.fm's encoding rules:
// - Spaces → "+"
// - Literal "+" → "%252B" (double encoded)
// - "&" → "%26"
// - Other special chars → standard encodeURIComponent

/**
 * Encodes a name into a Last.fm-compatible URL slug
 * Examples:
 * - "Katy Perry" → "Katy+Perry"
 * - "Florence + the Machine" → "Florence+%252B+the+Machine"
 * - "Marina & the Diamonds" → "Marina+%26+the+Diamonds"
 * - "Triple S" with track "#" → "%23"
 */
export function encodeLastFmSlug(name: string): string {
  if (!name) return '';
  
  // Step 1: Replace literal + with a placeholder to preserve them
  const placeholder = '\u0000PLUS\u0000';
  let result = name.replace(/\+/g, placeholder);
  
  // Step 2: Apply standard URI encoding (this will encode &, #, etc.)
  result = encodeURIComponent(result);
  
  // Step 3: Replace %20 (encoded spaces) with +
  result = result.replace(/%20/g, '+');
  
  // Step 4: Replace placeholder with double-encoded + (%252B)
  // The placeholder was encoded to %E2%80%8BPLUS%E2%80%8B or similar
  // We need to encode the original + sign properly
  // After encodeURIComponent, placeholder becomes encoded
  // We need a different approach
  
  // Alternative approach: Handle + before encoding
  result = name;
  
  // Replace literal + with a temporary marker
  const parts = result.split('+');
  
  // Encode each part separately
  const encodedParts = parts.map(part => {
    // Encode the part
    let encoded = encodeURIComponent(part);
    // Replace %20 with +
    encoded = encoded.replace(/%20/g, '+');
    return encoded;
  });
  
  // Join with double-encoded +
  result = encodedParts.join('%252B');
  
  return result;
}

/**
 * Decodes a Last.fm-compatible URL slug back to the original name
 * Examples:
 * - "Katy+Perry" → "Katy Perry"
 * - "Florence+%252B+the+Machine" → "Florence + the Machine"
 * - "Marina+%26+the+Diamonds" → "Marina & the Diamonds"
 */
export function decodeLastFmSlug(slug: string): string {
  if (!slug) return '';
  
  // Step 1: Replace %252B with a temporary placeholder
  const placeholder = '\u0000PLUS\u0000';
  let result = slug.replace(/%252B/gi, placeholder);
  
  // Step 2: Replace + with spaces
  result = result.replace(/\+/g, ' ');
  
  // Step 3: Decode URI components (handles %26, %23, etc.)
  try {
    result = decodeURIComponent(result);
  } catch (e) {
    // If decoding fails, return the original slug
    console.warn('Failed to decode slug:', slug, e);
    return slug;
  }
  
  // Step 4: Replace placeholder with literal +
  result = result.replace(new RegExp(placeholder, 'g'), '+');
  
  return result;
}
