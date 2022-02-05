import axios from "axios";
import { notification } from "antd";
import { BASE_SERVER_URL } from "../common/index";
axios.interceptors.response.use((res) => {
  try {
    if (res?.status === 200) {
      return res?.data;
    }
    return res?.data || {};
  } catch {
    notification.error({
      message: "请求出错",
    });
    return {};
  }
});

const baseURL = BASE_SERVER_URL;

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
export const _post = async (url: string, body: any = {}) => {
  return await axios({
    baseURL,
    timeout: 0,
    method: "POST",
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
  return await _get("/issue/getAUnlabelIssueId");
};

// issueModel
export const UPDATE_ISSUE_MODEL = async (issueModel: any) => {
  return await _put(`/issueModel/`, issueModel);
};

export const GET_ISSUE_MODEL_CONFIG = async (issueId: number) => {
  return await _get(`/issueModel/modelInfo/${issueId}`);
};

export const GET_ISSUE_MODELS_PAGINATE = async (params: any) => {
  return await _get(`/issueModel/getIssueModelsPaginate`, params);
};

export const GET_ISSUE_MODELS_BASIC_INFO = async () => {
  return await _get("/issueModel/getIssueModelsBasicInfo");
};

// model
export const GET_MODELS_PAGINATE = async (params: any) => {
  return await _get(`/model/getModelsPaginate`, params);
};

export const GET_MODELS_BASIC_INFO = async () => {
  return await _get("/model/getModelsBasicInfo");
};

export const START_RUN_A_MODEL = async () => {
  return await _post("/model/startRunAModel");
};

// other
export const GET_SOURCE_FROM_QINIU = async (type: string, sourceId: string) => {
  let suffix = "log";
  if (type === "score") {
    suffix = "config";
  }
  return await axios({
    url: `http://qiniu-gfh.mengxun.online/${type}/${sourceId}.${suffix}`,
    timeout: 0,
    headers: {
      "Content-Type": "application/json",
    },
    method: "GET",
  });
};
