import axios from "axios";
import { notification } from "antd";
import { PROD_ENV } from "../common/index";
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
const baseURL = PROD_ENV
  ? "http://api.mengxun.online/gfh"
  : "http://localhost:10310";

export const _get = async (url: string, params: any = {}) => {
  return await axios({
    baseURL,
    timeout: 0,
    method: "GET",
    url,
    params,
  });
};
export const _put = async (url: string, body: any = {}) => {
  return await axios({
    baseURL,
    timeout: 0,
    method: "PUT",
    url,
    data: body,
  });
};

// issue
export const GET_ISSUES_PAGINATE = async (params: any) => {
  return await _get(`/issue/getIssuesPaginate`, params);
};

export const GET_ISSUES_BASIC_INFO = async () => {
  return await _get("/issue/getIssuesBasicInfo");
};

export const GET_ISSUE_INFO_BY_ISSUE_ID = async (issueId: number) => {
  return await _get(`/issue/issueInfo/${issueId}`);
};

export const GET_A_UNLABEL_ISSUE_ID = async () => {
  return await _get('/issue/getAUnlabelIssueId')
}


// issueModel
export const UPDATE_ISSUE_MODEL = async (issueModel: any) => {
  return await _put(`/issueModel/`, issueModel);
};

export const GET_ISSUE_MODEL_CONFIG = async (issueId: number) => {
  return await _get(`/issueModel/${issueId}`);
};
