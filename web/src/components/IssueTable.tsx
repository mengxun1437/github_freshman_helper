import { Table, Typography, Button, Tag } from "antd";
import { BranchesOutlined } from "@ant-design/icons";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { GET_ISSUES_PAGINATE } from "../api/api";
const { Text } = Typography;
export const IssueTable = (props: any) => {
  const [data, setData] = useState<any>([]);
  const [page, setPage] = useState(1);
  const [pageNum, setPageNum] = useState(10);
  const [metaInfo, setMetaInfo] = useState<any>({});
  const [dataLoading, setDataLoading] = useState(false);

  const updatePaginate = (_page: any, _pageNum: any) => {
    setPage(_page);
    setPageNum(_pageNum);
    setDataLoading(true);
    GET_ISSUES_PAGINATE({ page: _page, pageNum: _pageNum }).then(
      (data: any) => {
        console.log(data);
        const { items = [], meta = {} } = data;
        setData(items);
        setMetaInfo(meta);
        setDataLoading(false);
      }
    );
  };

  useEffect(() => {
    updatePaginate(page, pageNum);
  }, []);

  const columns = [
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
      render: (text: any) =>
        text === "open" ? (
          <Tag color="#2da44e">Open</Tag>
        ) : (
          <Tag color="#8250df">Closed</Tag>
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
          <Link target="_blank" to={`/issue/${record?.issueId}`}>
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
        <Text  style={{ width: 200 }} ellipsis={{ tooltip: text }}>
          <Button type='link' onClick={()=> window.open(`https://github.com/${text}`, "_blank")}>{text}</Button>
        </Text>
      ),
    },
    {
        title: "模型标签",
        dataIndex: "isGoodTag",
        key: "isGoodTag",
        render: (text: any) =>
          text === null ? '-' :
          text === true ? (
            <Tag color="#1297da">good</Tag>
          ) : (
            <Tag color="#d81f06">bad</Tag>
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
  ];

  return (
    <Table
      style={{
        marginTop: 8,
        padding: "0 10px",
      }}
      rowKey={(record: any) => record?.issueId}
      columns={columns}
      dataSource={data}
      pagination={{
        position: ["topRight"],
        disabled: dataLoading,
        defaultCurrent: page,
        defaultPageSize: pageNum,
        total: metaInfo?.totalItems,
        onChange: (_page, _pageNum) => {
          updatePaginate(_page, _pageNum);
        },
      }}
    />
  );
};
