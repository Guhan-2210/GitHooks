/**
 * Utility function to create consistent error responses
 * @param {string} message - Error message
 * @param {number} status - HTTP status code
 * @returns {Response} Error response object
 */
export function errorResponse(message, status = 500) {
  return new Response(
    JSON.stringify({
      success: false,
      error: message,
    }),
    {
      status,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}
