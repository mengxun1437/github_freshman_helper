import { BranchesOutlined, CheckCircleOutlined } from "@ant-design/icons";
import {
  Typography,
  Button,
  Tag,
  Image,
  Modal,
  message,
  List,
  Row,
  Col,
  Spin,
  Progress,
} from "antd";
import { Link } from "react-router-dom";
import {
  GET_ISSUES_PAGINATE,
  GET_ISSUE_MODELS_PAGINATE,
  GET_MODELS_PAGINATE,
  GET_ISSUE_PREDICTS_BY_PAGINATE,
  START_ISSUE_PREDICT,
  GET_ISSUE_PREDICT_APPLY,
} from "../api/api";
import dayjs from "dayjs";
import { GET_SOURCE_FROM_QINIU } from "../api/api";
const { Text } = Typography;

interface CustomTagMap {
  [key: string]: {
    color: string;
    desc: string;
  };
}

const ModelType: CustomTagMap = {
  supervised: {
    color: "rgb(255 85 1)",
    desc: "监督式",
  },
};
const ModelProgram: CustomTagMap = {
  decision_tree: {
    color: "rgb(135 208 104)",
    desc: "决策树",
  },
  random_forest: {
    color: "#8250df",
    desc: "随机森林",
  },
  svm: {
    color: "blue",
    desc: "SVM支持向量机",
  },
  lr: {
    color: "gray",
    desc: "逻辑回归",
  },
};

const IssueStateType: CustomTagMap = {
  open: {
    color: "#2da44e",
    desc: "open",
  },
  closed: {
    color: "#8250df",
    desc: "closed",
  },
};

const IssueLabelType: CustomTagMap = {
  true: {
    color: "#1297da",
    desc: "good",
  },
  false: {
    color: "#d81f06",
    desc: "bad",
  },
};

export const issueTableProps = () => ({
  getDataFunc: GET_ISSUES_PAGINATE,
  tableColumns: [
    {
      title: "issueId",
      dataIndex: "issueId",
      key: "issueId",
      fixed: true,
    },
    {
      title: "issue标题",
      dataIndex: "issueTitle",
      key: "issueTitle",
      render: (text: any) => (
        <Text style={{ width: 200 }} ellipsis={{ tooltip: text }}>
          {text}
        </Text>
      ),
    },
    {
      title: "issue状态",
      dataIndex: "issueState",
      key: "issueState",
      render: (text: any) => (
        <Tag color={IssueStateType[text]?.color}>
          {IssueStateType[text]?.desc}
        </Tag>
      ),
    },
    {
      title: "关联的pr信息",
      dataIndex: "issueLinkedPrInfo",
      key: "issueLinkedPrInfo",
      render: (text: any) => {
        const issueLinkedPrInfo = JSON.parse(text);
        return Object.keys(issueLinkedPrInfo).length ? (
          <BranchesOutlined
            style={{ color: "blue" }}
            onClick={() => window.open(issueLinkedPrInfo?.html_url, "_blank")}
          />
        ) : (
          "-"
        );
      },
    },
    {
      title: "issue详情",
      dataIndex: "issueHtmlUrl",
      key: "issueHtmlUrl",
      render: (text: any, record: any) => (
        <Button type="link">
          <Link target="_blank" to={`/label/${record?.issueId}`}>
            查看
          </Link>
        </Button>
      ),
    },
    {
      title: "对应的仓库",
      dataIndex: "issueRepo",
      key: "issueRepo",
      render: (text: any) => (
        <Text style={{ width: 200 }} ellipsis={{ tooltip: text }}>
          <Button
            type="link"
            onClick={() => window.open(`https://github.com/${text}`, "_blank")}
          >
            {text}
          </Button>
        </Text>
      ),
    },
    {
      title: "模型标签",
      dataIndex: "isGoodTag",
      key: "isGoodTag",
      render: (text: any) =>
        text === null ? (
          "-"
        ) : (
          <Tag color={IssueLabelType[text]?.color}>
            {IssueLabelType[text]?.desc}
          </Tag>
        ),
    },
    {
      title: "创建时间",
      dataIndex: "issueCreated",
      key: "issueCreated",
      render: (text: any) => <div>{text}</div>,
    },
    {
      title: "更新时间",
      dataIndex: "issueUpdated",
      key: "issueUpdated",
      render: (text: any) => <div>{text}</div>,
    },
  ],
  formOptions: [
    {
      name: "issueState",
      desc: "issue状态",
      selectOptions: [
        { label: "所有状态", value: "all" },
        { label: "open", value: "open" },
        { label: "closed", value: "closed" },
      ],
    },
    {
      name: "issueLinkedPr",
      desc: "pr信息",
      selectOptions: [
        { label: "所有状态", value: "all" },
        { label: "有pr", value: true },
        { label: "没有pr", value: false },
      ],
    },
    {
      name: "isGoodTag",
      desc: "标签",
      selectOptions: [
        { label: "所有状态", value: "all" },
        { label: "无标签", value: null },
        { label: "good", value: true },
        { label: "bad", value: false },
      ],
    },
  ],
  formInitValues: {
    issueState: "all",
    issueLinkedPr: "all",
    isGoodTag: "all",
  },
});

export const issueModelTableProps = () => ({
  getDataFunc: GET_ISSUE_MODELS_PAGINATE,
  tableColumns: [
    {
      title: "issueId",
      dataIndex: "issueId",
      key: "issueId",
      fixed: true,
    },
    {
      title: "标签",
      dataIndex: "isGoodForFreshman",
      key: "isGoodForFreshman",
      fixed: true,
      render: (text: any) => (
        <Tag color={IssueLabelType[text]?.color}>
          {IssueLabelType[text]?.desc}
        </Tag>
      ),
    },
    {
      title: "issue标题长度",
      dataIndex: "titleLength",
      key: "titleLength",
    },
    {
      title: "issue内容长度",
      dataIndex: "bodyLength",
      key: "bodyLength",
    },
    {
      title: "评论数",
      dataIndex: "commentsNum",
      key: "commentsNum",
    },
    {
      title: "评论总长度",
      dataIndex: "commentsTotalLength",
      key: "commentsTotalLength",
    },
    {
      title: "参与人数",
      dataIndex: "participantsNum",
      key: "participantsNum",
    },
    {
      title: "受让人数",
      dataIndex: "assigneesNum",
      key: "assigneesNum",
    },
    {
      title: "是否链接PR",
      dataIndex: "isLinkedPr",
      key: "isLinkedPr",
      render: (text: any) => (text ? "是" : "否"),
    },
    {
      title: "发起人平台注册时间",
      dataIndex: "creatorCreated",
      key: "creatorCreated",
      render: (text: any) => dayjs(Number(text)).format("YYYY-MM-DD HH:mm:ss"),
    },
    {
      title: "发起人平台跟随人数",
      dataIndex: "creatorFollowers",
      key: "creatorFollowers",
    },
    {
      title: "仓库star数",
      dataIndex: "starNum",
      key: "starNum",
    },
    {
      title: "仓库open issues数目",
      dataIndex: "openIssuesNum",
      key: "openIssuesNum",
    },
    {
      title: "仓库是否在组织下",
      dataIndex: "hasOrganization",
      key: "hasOrganization",
      render: (text: any) => (text ? "是" : "否"),
    },
    {
      title: "标签生成时间",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (text: any) => dayjs(Number(text)).format("YYYY-MM-DD HH:mm:ss"),
    },
    {
      title: "标签更新时间",
      dataIndex: "updateAt",
      key: "updateAt",
      render: (text: any) => dayjs(Number(text)).format("YYYY-MM-DD HH:mm:ss"),
    },
  ],
  formOptions: [
    {
      name: "isLinkedPr",
      desc: "pr信息",
      selectOptions: [
        { label: "所有状态", value: "all" },
        { label: "有pr", value: true },
        { label: "没有pr", value: false },
      ],
    },
    {
      name: "isGoodForFreshman",
      desc: "标签",
      selectOptions: [
        { label: "所有状态", value: "all" },
        { label: "good", value: true },
        { label: "bad", value: false },
      ],
    },
  ],
  formInitValues: {
    isLinkedPr: "all",
    isGoodForFreshman: "all",
  },
});

export const modelTableProps = () => ({
  getDataFunc: GET_MODELS_PAGINATE,
  tableColumns: [
    {
      title: "模型id",
      dataIndex: "modelId",
      key: "modelId",
      fixed: true,
      render: (text: any) => (
        <Text style={{ width: 200 }} ellipsis={{ tooltip: text }}>
          {text}
        </Text>
      ),
    },
    {
      title: "模型类别",
      dataIndex: "modelType",
      key: "modelType",
      render: (text: any) => (
        <Tag color={ModelType[text]?.color}>{ModelType[text]?.desc}</Tag>
      ),
    },
    {
      title: "模型使用算法",
      dataIndex: "modelProgram",
      key: "modelProgram",
      render: (text: any) => (
        <Tag color={ModelProgram[text]?.color}>{ModelProgram[text]?.desc}</Tag>
      ),
    },
    {
      title: "模型使用的框架",
      dataIndex: "modelFramework",
      key: "modelFramework",
    },
    {
      title: "日志链接",
      dataIndex: "modelTrainingLogUrl",
      key: "modelTrainingLogUrl",
      render: (text: any, record: any) => (
        <Button type="link">
          <Link target="_blank" to={`/log/${record?.modelId}`}>
            查看日志
          </Link>
        </Button>
      ),
    },
    {
      title: "模型信息",
      dataIndex: "modelConfigUrl",
      key: "modelConfigUrl",
      render: (text: any, record: any) => (
        <Button
          type="link"
          onClick={() => {
            GET_SOURCE_FROM_QINIU("score", record?.modelId)
              .then((data: any) => {
                const modalDataKeys = Object.keys(data);
                const modalContent = (
                  <List
                    style={{ width: "90%" }}
                    dataSource={modalDataKeys}
                    renderItem={(modalDataKey) => (
                      <List.Item key={modalDataKey}>
                        <Row style={{ width: "100%" }}>
                          <Col span={12}>{modalDataKey}</Col>
                          <Col span={12}>
                            {JSON.stringify(data[modalDataKey])}
                          </Col>
                        </Row>
                      </List.Item>
                    )}
                  />
                );
                Modal.info({
                  title: record?.modelId,
                  content: modalContent,
                  width: 700,
                });
              })
              .catch(() => {
                message.error("未找到当前模型信息");
              });
          }}
        >
          查看
        </Button>
      ),
    },
    {
      title: "模型图片",
      dataIndex: "modelPngUrl",
      key: "modelPngUrl",
      render: (text: any) => <Image alt="..." width={24} src={text} />,
    },
    {
      title: "模型PKL文件",
      dataIndex: "modelPklUrl",
      key: "modelPklUrl",
      render: (text: any, record: any) => (
        <Button
          type="link"
          onClick={() => {
            window.open(text, "_blank");
          }}
        >
          下载
        </Button>
      ),
    },
    {
      title: "是否在训练中",
      dataIndex: "modelTraining",
      key: "modelTraining",
      render: (text: any) =>
        text ? <Spin /> : <CheckCircleOutlined style={{ color: "#2da44e" }} />,
    },
    {
      title: "生成时间",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (text: any) => dayjs(Number(text)).format("YYYY-MM-DD HH:mm:ss"),
    },
  ],
  formOptions: [],
  formInitValues: {},
});

export const issuePredictProps = () => {
  return {
    getDataFunc: GET_ISSUE_PREDICTS_BY_PAGINATE,
    tableColumns: [
      {
        title: "模型id",
        dataIndex: "modelId",
        key: "modelId",
        fixed: true,
        width: 200,
        render: (text: any) => (
          <Text style={{ width: 200 }} ellipsis={{ tooltip: text }}>
            {text}
          </Text>
        ),
      },
      {
        title: "状态",
        dataIndex: "status",
        key: "status",
        width: 200,
      },
      {
        title: "总分类数",
        dataIndex: "predictNum",
        key: "predictNum",
        width: 100,
      },
      {
        title: "分类进度",
        dataIndex: "process",
        key: "process",
        width: 100,
        render: (text: any) => {
          return <Progress width={30} type="circle" percent={Number(text)} />;
        },
      },
      {
        title: "正样本数",
        dataIndex: "goodNum",
        key: "goodNum",
        width: 100,
      },
      {
        title: "负样本数",
        dataIndex: "badNum",
        key: "badNum",
        width: 100,
      },
      {
        title: "分类失败数",
        dataIndex: "errorNum",
        key: "errorNum",
        width: 100,
      },
      {
        title: "操作",
        dataIndex: "opt",
        key: "opt",
        width: 150,
        fixed: "right",
        render: (_text: any, record: any) => {
          return (
            <>
              <Button
                onClick={() =>
                  START_ISSUE_PREDICT({ modelId: record.modelId }).then(() => {
                    message.info("开始重新分类");
                  })
                }
              >
                重新分类
              </Button>
              <Button
                style={{ marginLeft: 10 }}
                onClick={() => {
                  if (record.process !== 100) {
                    message.info("应用前进度必须为100%");
                    return;
                  }
                  GET_ISSUE_PREDICT_APPLY({
                    modelId: record.modelId,
                  }).then(() => {
                    message.info("应用成功~");
                  });
                }}
              >
                结果应用
              </Button>
            </>
          );
        },
      },
    ],
    formOptions: [],
    formInitValues: {},
  };
};
