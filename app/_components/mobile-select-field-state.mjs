/**
 * @typedef {{ value: string; label: string; disabled?: boolean }} MobileSelectOption
 */

/**
 * @param {number} optionCount
 * @param {number} [searchableThreshold]
 */
export function shouldUseSearchableMobileSelect(optionCount, searchableThreshold = 10) {
  return optionCount > searchableThreshold;
}

/**
 * Mobile browsers only guarantee virtual keyboard opening when focus stays inside
 * the same direct user gesture.
 *
 * @param {"pointerdown" | "click"} eventType
 */
export function shouldFocusSearchInputImmediately(eventType) {
  return eventType === "pointerdown";
}

/**
 * Always reopen long selectors showing the full list, not the selected label as a filter.
 *
 * @param {string} selectedLabel
 */
export function getMobileSelectQueryOnOpen(selectedLabel) {
  void selectedLabel;
  return "";
}

/**
 * @param {MobileSelectOption[]} options
 * @param {string} query
 */
export function filterMobileSelectOptions(options, query) {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  if (!normalizedQuery) return options;

  return options.filter((option) => option.label.toLocaleLowerCase().includes(normalizedQuery));
}
