import { Table, Typography, Button, Tag, Form, Select } from "antd";
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
  const [form] = Form.useForm();

  const getHandledFormValue = () => {
    const formValue = { ...form.getFieldsValue() };
    Object.keys(formValue).forEach((key) => {
      if (formValue[key] === "all") {
        delete formValue[key];
      }
    });
    return formValue;
  };

  const updatePaginate = ({ _page = 1, _pageNum = 10, _where = {} }: any) => {
    setPage(_page);
    setPageNum(_pageNum);
    setDataLoading(true);
    GET_ISSUES_PAGINATE({
      page: _page,
      pageNum: _pageNum,
      where: _where,
    }).then((data: any) => {
      console.log(data);
      const { items = [], meta = {} } = data;
      setData(items);
      setMetaInfo(meta);
      setDataLoading(false);
    });
  };

  const handleRefreshTable = () => {
    updatePaginate({
      _page: page,
      _pageNum: pageNum,
      _where: getHandledFormValue(),
    });
  };

  useEffect(() => {
    updatePaginate({
      _page: page,
      _pageNum: pageNum,
      _where: getHandledFormValue(),
    });
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
        ) : text === true ? (
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

  const formOptions = [
    {
      name: "issueState",
      desc:'issue状态',
      selectOptions: [
        { label: "所有状态", value: "all" },
        { label: "open", value: "open" },
        { label: "closed", value: "closed" },
      ],
    },
    {
      name: "issueLinkedPr",
      desc:'pr信息',
      selectOptions: [
        { label: "所有状态", value: "all" },
        { label: "有pr", value: true },
        { label: "没有pr", value: false },
      ],
    },
    {
      name: "isGoodTag",
      desc:'标签',
      selectOptions: [
        { label: "所有状态", value: "all" },
        { label: "无标签", value: null },
        { label: "good", value: true },
        { label: "bad", value: false },
      ],
    },
  ];

  return (
    <div>
      <Form
        style={{ marginTop: 20 }}
        form={form}
        layout="inline"
        name="form_in_modal"
        initialValues={{
          issueState: "all",
          issueLinkedPr: "all",
          isGoodTag: "all",
        }}
      >
        {formOptions.map((formOption) => {
          return (
            <div style={{ display: "flex", flexDirection: "row" ,alignItems:'center'}}>
              <Tag  color='blue' style={{ marginLeft: 10 }}>{formOption.desc}</Tag>
              <Form.Item
                key={formOption.name}
                name={formOption.name}
              >
                <Select
                  onChange={handleRefreshTable}
                  style={{ width: 100 }}
                  options={formOption.selectOptions}
                />
              </Form.Item>
            </div>
          );
        })}
      </Form>
      <Table
        style={{
          marginTop: 8,
          padding: "0 10px",
        }}
        rowKey={(record: any) => record?.issueId}
        columns={columns}
        dataSource={data}
        loading={dataLoading}
        pagination={{
          position: ["bottomRight"],
          defaultCurrent: page,
          defaultPageSize: pageNum,
          total: metaInfo?.totalItems,
          onChange: (_page, _pageNum) => {
            updatePaginate({
              _page,
              _pageNum,
              _where: getHandledFormValue(),
            });
          },
        }}
      />
    </div>
  );
};
