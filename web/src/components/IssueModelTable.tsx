import { Table, Tag, Form, Select } from "antd";
import { useState, useEffect } from "react";
import { GET_ISSUE_MODELS_PAGINATE } from "../api/api";
import dayjs from "dayjs";

export const IssueModelTable = (props: any) => {
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
    GET_ISSUE_MODELS_PAGINATE({
      page: _page,
      pageNum: _pageNum,
      where: _where,
    }).then((data: any) => {
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
      title: "标签",
      dataIndex: "isGoodForFreshman",
      key: "isGoodForFreshman",
      fixed:true,
      render: (text: any) =>
        text === true ? (
          <Tag color="#1297da">good</Tag>
        ) : (
          <Tag color="#d81f06">bad</Tag>
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
      render: (text: any) => dayjs(text).format("YYYY-MM-DD HH:mm:ss"),
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
        dataIndex: "createAt",
        key: "createAt",
        render: (text: any) => dayjs(text).format("YYYY-MM-DD HH:mm:ss"),
      },
      {
        title: "标签更新时间",
        dataIndex: "updateAt",
        key: "updateAt",
        render: (text: any) => dayjs(text).format("YYYY-MM-DD HH:mm:ss"),
      },
  ];

  const formOptions = [
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
          isLinkedPr: "all",
          isGoodForFreshman: "all"
        }}
      >
        {formOptions.map((formOption) => {
          return (
            <div
              key={`${formOption.name}-div`}
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <Tag color="blue" style={{ marginLeft: 10 }}>
                {formOption.desc}
              </Tag>
              <Form.Item name={formOption.name}>
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
          height: "100%",
        }}
        scroll={{ x:2000, y: 520 }}
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
