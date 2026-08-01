const maxScroll = (scrollWidth: number, clientWidth: number) =>
  Math.max(0, scrollWidth - clientWidth);

export function pageCount(scrollWidth: number, clientWidth: number): number {
  if (clientWidth <= 0) return 1;
  return Math.max(1, Math.ceil(maxScroll(scrollWidth, clientWidth) / clientWidth) + 1);
}

// The dots divide the scrollable distance into equal steps: page 0 sits at
// scroll 0 and the last page sits at exactly maxScroll, with the rest spread
// evenly between. Targeting page*clientWidth instead leaves the final step
// shorter than the others, so the snapped resting position lands short of
// maxScroll and pageAt rounds it back to the previous page, which is what made
// the last dot impossible to reach and left it permanently inactive.
function pageStep(scrollWidth: number, clientWidth: number): number {
  const last = pageCount(scrollWidth, clientWidth) - 1;
  return last > 0 ? maxScroll(scrollWidth, clientWidth) / last : 0;
}

export function pageAt(scrollLeft: number, scrollWidth: number, clientWidth: number): number {
  // A rail that has not been laid out yet reports zero width. Dividing by it
  // yields NaN, which reaches the page counter and the button disabled state.
  if (clientWidth <= 0) return 0;
  const last = pageCount(scrollWidth, clientWidth) - 1;
  const step = pageStep(scrollWidth, clientWidth);
  if (last <= 0 || step <= 0) return 0;
  return Math.min(Math.max(0, Math.round(scrollLeft / step)), last);
}

export function scrollTargetFor(page: number, scrollWidth: number, clientWidth: number): number {
  const last = pageCount(scrollWidth, clientWidth) - 1;
  const clamped = Math.min(Math.max(page, 0), last);
  return clamped * pageStep(scrollWidth, clientWidth);
}
