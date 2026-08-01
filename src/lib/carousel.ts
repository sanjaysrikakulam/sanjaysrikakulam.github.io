const maxScroll = (scrollWidth: number, clientWidth: number) =>
  Math.max(0, scrollWidth - clientWidth);

export function pageCount(scrollWidth: number, clientWidth: number): number {
  if (clientWidth <= 0) return 1;
  return Math.max(1, Math.ceil(maxScroll(scrollWidth, clientWidth) / clientWidth) + 1);
}

export function pageAt(scrollLeft: number, scrollWidth: number, clientWidth: number): number {
  const last = pageCount(scrollWidth, clientWidth) - 1;
  const max = maxScroll(scrollWidth, clientWidth);
  if (max > 0 && scrollLeft >= max - 2) return last;
  return Math.min(Math.max(0, Math.round(scrollLeft / clientWidth)), last);
}

export function scrollTargetFor(page: number, scrollWidth: number, clientWidth: number): number {
  const last = pageCount(scrollWidth, clientWidth) - 1;
  const clamped = Math.min(Math.max(page, 0), last);
  return Math.min(clamped * clientWidth, maxScroll(scrollWidth, clientWidth));
}
