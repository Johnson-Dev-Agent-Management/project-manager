import { request } from '../projects/api';

export type InboxItem = { id: number; title: string; notes: string | null; capturedAt: string };
export type Destination = { id: number; name: string };
export function inboxRequest<T>(url: string, fallback: string, options?: RequestInit) {
  return request<T>(
    url,
    fallback,
    options,
    'This inbox item is no longer available. It may have been moved or discarded. Refresh Inbox or check Projects.',
  );
}
