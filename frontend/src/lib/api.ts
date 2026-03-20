import { Submission, SubmitRequest } from '@/types';

const API_BASE = '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${res.status}`);
  }

  return res.json();
}

export async function submitCode(data: SubmitRequest): Promise<{ id: string; status: string; created_at: string }> {
  return request('/submissions', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getSubmission(id: string): Promise<Submission> {
  return request(`/submissions/${id}`);
}

export async function getHealth(): Promise<Record<string, string | number>> {
  return request('/health');
}
