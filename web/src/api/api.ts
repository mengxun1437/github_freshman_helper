import axios from "axios";
import { notification } from "antd";
axios.interceptors.response.use((res) => {
  try {
    if (res?.status === 200) {
      return res?.data;
    }
    notification.error({
      message: "请求出错",
    });
    return {};
  } catch {
    notification.error({
      message: "请求出错",
    });
    return {};
  }
});
export const _get = async (url: string, params: any) => {
  return await axios({
    baseURL: "http://localhost:10310",
    timeout: 0,
    method: "GET",
    url,
    params,
  });
};

export const GET_ISSUES_PAGINATE = async (params: any) => {
  return await _get(`/issue/getIssuesPaginate`, params);
};
