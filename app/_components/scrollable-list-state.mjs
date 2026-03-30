const SCROLLABLE_LIST_BASE_CLASS_NAME = [
  "min-h-0",
  "flex-1",
  "overflow-y-auto",
  "overscroll-contain",
  "pb-24",
  "[-webkit-overflow-scrolling:touch]",
].join(" ");

export function getScrollableListClassName(options = {}) {
  const { topPadding = false } = options;

  return topPadding
    ? `${SCROLLABLE_LIST_BASE_CLASS_NAME} pt-1`
    : SCROLLABLE_LIST_BASE_CLASS_NAME;
}

export function getScrollableListObserverOptions(root) {
  return {
    root,
    rootMargin: "0px 0px 160px 0px",
    threshold: 0,
  };
}
