import axios from "axios";
import { notification } from "antd";
import { BASE_QINIU_URL, BASE_SERVER_URL } from "../common/index";

axios.interceptors.response.use((res) => {
  try {
    if (res?.status === 200) {
      // admin error
      if (res?.data?.code === 40301) {
        notification.error({ message: "Please use admin account to login" });
        return {};
      }
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

// token
export const USER_TOKEN = async () => {
  const userid = window.localStorage.getItem("userId") || "";
  const token = window.localStorage.getItem("token") || "";
  return await axios({
    baseURL,
    timeout: 0,
    method: "POST",
    url: "/token/",
    headers: {
      userid,
      token,
    },
  });
};

export const ADMIN_TOKEN = async () => {
  const userid = window.localStorage.getItem("userId") || "";
  const token = window.localStorage.getItem("token") || "";
  return await axios({
    baseURL,
    timeout: 0,
    method: "POST",
    url: "/token/admin",
    headers: {
      userid,
      token,
    },
  });
};

//user
export const ADD_NEW_USER = async (data: any) => {
  return await _post("/user/", data);
};

export const USER_LOGIN = async (data: any) => {
  return await _post("/user/login", data);
};

export const GET_USER_INFO = async (params: any = {}) => {
  const userid = window.localStorage.getItem("userId") || "";
  const token = window.localStorage.getItem("token") || "";
  return await axios({
    baseURL,
    timeout: 0,
    headers: {
      userid,
      token,
    },
    method: "GET",
    url: "/user/",
    params,
  });
};

export const UPDATE_USER_FAVOR = async (data: any) => {
  const userid = window.localStorage.getItem("userId") || "";
  const token = window.localStorage.getItem("token") || "";
  return await axios({
    baseURL,
    timeout: 0,
    headers: {
      userid,
      token,
    },
    method: "POST",
    url: "/user/favor",
    data,
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

export const COLLECT_FIRST_ISSUES = async () => {
  return await _post("/issue/collectFirstIssues");
};

export const GET_EVERY_DATE_ISSUE_NUM = async () => {
  return await _get("/issue/getEveryDateIssueNum");
};

export const CHECK_ISSUE_STATE = async ()=>{
  return await _post('/issue/checkIssueState')
}

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

export const STORE_MODEL_INFO = async() => {
  return await _post('/issueModel/storeOpenModelInfo')
}

export const START_BATCH_PREDICT = async() => {
  return await _post('/issueModel/startBatchPredict')
}

// model
export const GET_ALL_MODEL_IDS = async () => {
  return await _get('/model/allModelIds')
}

export const GET_MODELS_PAGINATE = async (params: any) => {
  return await _get(`/model/getModelsPaginate`, params);
};

export const GET_MODELS_BASIC_INFO = async () => {
  return await _get("/model/getModelsBasicInfo");
};

export const START_RUN_A_MODEL = async (body:any) => {
  return await _post("/model/startRunAModel",body);
};

export const START_PREDICT = async (body: any) => {
  return await _post("/model/startPredict", body);
};

// issue-predict
export const START_ISSUE_PREDICT = async(body:any) => {
  return await _post('/issuePredict/predict',body)
}

export const GET_ISSUE_PREDICTS_BY_PAGINATE = async(params:any) => {
  return await _get('/issuePredict/getIssuePredictsPaginate',params)
}

export const GET_ISSUE_PREDICT_APPLY = async(body:any) => {
  return await _post('/issuePredict/applyResult',body)
}

// other
export const GET_SOURCE_FROM_QINIU = async (type: string, sourceId: string) => {
  let suffix = "log";
  let contentType = "text/plain";
  if (type === "score") {
    suffix = "config";
    contentType = "application/json";
  }
  return await axios({
    url: `${BASE_QINIU_URL}/${type}/${sourceId}.${suffix}?timestamp=${new Date().getTime()}`,
    timeout: 0,
    headers: {
      "Content-Type": contentType,
    },
    method: "GET",
  });
};
