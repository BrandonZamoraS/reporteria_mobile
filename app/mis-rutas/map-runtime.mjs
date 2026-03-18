/**
 * @typedef {object} GoogleMapsReadyInput
 * @property {boolean} hasApiKey
 * @property {boolean} hasScriptError
 * @property {boolean} isScriptLoaded
 * @property {boolean} hasGoogleMapsObject
 */

/**
 * The map can initialize either right after the script callback or when the
 * Google SDK is already present on a remount.
 *
 * @param {GoogleMapsReadyInput} input
 * @returns {boolean}
 */
export function isGoogleMapsReady(input) {
  return (
    input.hasApiKey &&
    !input.hasScriptError &&
    (input.isScriptLoaded || input.hasGoogleMapsObject)
  );
}

/**
 * @param {{ lat: number; lng: number }} coords
 * @returns {string}
 */
export function buildWazeUrl(coords) {
  return `https://www.waze.com/ul?ll=${encodeURIComponent(`${coords.lat},${coords.lng}`)}&navigate=yes`;
}
