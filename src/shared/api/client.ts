export const apiClient = async <T>(url: string, options?: RequestInit): Promise<T> => {
  const response = await fetch(url, options);

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`API Error: ${response.status} ${text}`);
  }

  return response.json() as Promise<T>;
};