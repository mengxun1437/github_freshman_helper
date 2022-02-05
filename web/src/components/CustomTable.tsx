import { Table, Tag, Form, Select, Typography, Button, Image } from "antd";
import { useState, useEffect } from "react";

export const CustomTable = (props: any) => {
  const {
    getDataFunc,
    tableColumns,
    formOptions = [],
    formInitValues = {},
  } = props;
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
    getDataFunc({
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

  return (
    <div>
      <Form
        form={form}
        layout="inline"
        name="form_in_modal"
        initialValues={formInitValues}
      >
        {formOptions.map((formOption: any) => {
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
          padding: "0 10px",
        }}
        scroll={{ x: 2000, y: 520 }}
        columns={tableColumns}
        dataSource={data}
        rowKey={(record) => record?.issueId || record?.modelId}
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
