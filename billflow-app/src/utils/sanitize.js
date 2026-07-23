// CQ-07 Fix: Standardize search input sanitization to prevent SQL injection or bad PostgREST behavior
function sanitizeSearch(query) {
  if (typeof query !== 'string') return '';
  
  // 1. Trim whitespace
  // 2. Remove characters that break PostgREST ilike queries (%, _, \, etc.)
  // 3. Limit length to prevent DoS via massive regex matching
  return query
    .trim()
    .replace(/[%_\\]/g, '') // Escape PostgREST wildcards
    .replace(/['"]/g, '')   // Remove quotes
    .substring(0, 100);
}

module.exports = { sanitizeSearch: sanitizeSearch };
