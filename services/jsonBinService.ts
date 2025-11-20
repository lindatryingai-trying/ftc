
import { JsonBinConfig, SyncData } from "../types";

const BASE_URL = "https://api.jsonbin.io/v3/b";

export const fetchBinData = async (config: JsonBinConfig): Promise<SyncData | null> => {
  try {
    // Add timestamp to url to prevent caching
    const response = await fetch(`${BASE_URL}/${config.binId}/latest?t=${Date.now()}`, {
      headers: {
        'X-Master-Key': config.apiKey
      },
      cache: 'no-store'
    });
    
    if (!response.ok) {
      if (response.status === 401) throw new Error("API Key 无效 (Unauthorized)");
      if (response.status === 404) throw new Error("Bin ID 未找到");
      throw new Error(`连接失败: ${response.statusText}`);
    }

    const data = await response.json();
    // JSONBin v3 returns { record: { ... }, metadata: { ... } }
    return data.record as SyncData;
  } catch (error) {
    console.error("JSONBin Fetch Error:", error);
    throw error;
  }
};

export const updateBinData = async (config: JsonBinConfig, data: SyncData): Promise<any> => {
  try {
    const response = await fetch(`${BASE_URL}/${config.binId}`, {
      method: 'PUT',
      headers: {
        'X-Master-Key': config.apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`同步失败: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("JSONBin Update Error:", error);
    throw error;
  }
};
