import { API_URL as BaseApiUrl } from "../../../libs/constants";
const API_URL = BaseApiUrl as string;

export const search = async (query: string, signal?: AbortSignal) => {
  const requestBody = { query };

  const response = await fetch(`${API_URL}/search`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
    signal,
  });

  return response.json();
};
