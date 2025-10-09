import axios, { AxiosError } from 'axios';

export const http = axios.create({
  timeout: 10000,
  headers: {
    'User-Agent': 'TouchFish/extension',
  },
});

http.interceptors.response.use(r => r, (error: AxiosError) => {
  if (error.code === 'ECONNABORTED') {
    return Promise.reject(new Error('请求超时'));
  }
  if (error.response) {
    return Promise.reject(new Error(`请求失败: ${error.response.status}`));
  }
  return Promise.reject(error);
});

export default http;
