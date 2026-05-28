/**
 * Computes a new end time by adding the specified minutes to the given end time.
 * @param {Date} endTime - The current end time
 * @param {number} minutes - The number of minutes to extend (5, 15, or 30)
 * @returns {Date} A new Date equal to endTime plus the duration in milliseconds
 */
export function computeExtendedTime(endTime, minutes) {
  const ms = minutes * 60 * 1000;
  return new Date(endTime.getTime() + ms);
}
