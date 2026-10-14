import type { FanzaWorkInput } from './import-fanza';

function validUrl(value: string | null): boolean {
  if (value === null) return true;

  try {
    const url = new URL(value);
    return (
      (url.protocol === 'https:' || url.protocol === 'http:') &&
      Boolean(url.hostname)
    );
  } catch {
    return false;
  }
}

function validDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const date = new Date(`${value}T00:00:00Z`);

  return (
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value
  );
}

export function validateFanzaWork(work: FanzaWorkInput): void {
  if (
    !work.id.trim() ||
    work.id.startsWith('demo-') ||
    !/^[a-zA-Z0-9_-]+$/.test(work.id)
  ) {
    throw new Error(`Invalid FANZA ID: ${work.id}`);
  }

  if (!work.title.trim()) {
    throw new Error(`Missing title: ${work.id}`);
  }

  if (!Number.isSafeInteger(work.price) || work.price < 0) {
    throw new Error(`Invalid price: ${work.id}`);
  }

  if (
    !Number.isFinite(work.rating) ||
    work.rating < 0 ||
    work.rating > 5
  ) {
    throw new Error(`Invalid rating: ${work.id}`);
  }

  if (
    !Number.isSafeInteger(work.reviewCount) ||
    work.reviewCount < 0
  ) {
    throw new Error(`Invalid review count: ${work.id}`);
  }

  if (!validDate(work.releasedAt)) {
    throw new Error(`Invalid release date: ${work.id}`);
  }

  if (!validUrl(work.affiliateUrl)) {
    throw new Error(`Invalid affiliate URL: ${work.id}`);
  }

  if (!validUrl(work.coverUrl)) {
    throw new Error(`Invalid cover URL: ${work.id}`);
  }
}
