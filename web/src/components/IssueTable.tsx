import { Table, Typography, Button } from "antd";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { GET_ISSUES_PAGINATE } from "../api/api";
const { Text } = Typography;
export const IssueTable = (props: any) => {
  const [data, setData] = useState<any>([]);
  const [page, setPage] = useState(1);
  const [pageNum, setPageNum] = useState(20);

  useEffect(() => {
    GET_ISSUES_PAGINATE({ page, pageNum }).then((data: any) => {
      const { items = [] } = data;
      setData(items);
    });
  }, []);

  const columns = [
    {
      title: "issueId",
      dataIndex: "issueId",
      key: "issueId",
      fixed: true
    },
    {
      title: "标题",
      dataIndex: "issueTitle",
      key: "issueTitle",
      render: (text: any) => <Text style={{width:200}} ellipsis={{ tooltip: text }}>{text}</Text>,
    },
    {
      title: "议题状态",
      dataIndex: "issueState",
      key: "issueState",
      render: (text: any) => <div>{text}</div>,
    },
    {
      title: "关联的pr信息",
      dataIndex: "issueLinkedPrInfo",
      key: "issueLinkedPrInfo",
      render: (text: any) => <Text style={{width:150}} ellipsis={{ tooltip: text }}>{text}</Text>,
    },
    {
      title: "issue详情",
      dataIndex: "issueHtmlUrl",
      key: "issueHtmlUrl",
      render: (text: any,record:any) => <Button type="link"><Link target="_blank" to={`/issue/${record?.issueId}`}>查看</Link></Button>,
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
    {
      title: "对应的仓库",
      dataIndex: "issueRepo",
      key: "issueRepo",
      render: (text: any) => <div>{text}</div>,
    },
  ];

  return <Table columns={columns} dataSource={data} />;
};
