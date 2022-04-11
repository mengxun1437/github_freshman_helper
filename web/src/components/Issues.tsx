import { message, Table } from "antd";
import { useState, useEffect, useCallback } from "react";
import { GET_ISSUES_PAGINATE } from "../api/api";
import { Typography } from "antd";
const { Text } = Typography;

const tableColumns = [
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
];

export const Issues = () => {
  const [data, setData] = useState<any>([]);
  const [page, setPage] = useState<number>(1);
  const [metaInfo, setMetaInfo] = useState<any>({});
  const [dataLoading, setDataLoading] = useState(true);
  useEffect(() => {
    GET_ISSUES_PAGINATE({
      page,
      pageNum: 10,
      where: {
        isGoodTag: true,
        issueState: "open",
      },
    })
      .then((data: any) => {
        setData(data.items);
        setMetaInfo(data.meta);
      })
      .catch(() => {
        message.warning("Get Issues Failed");
      })
      .finally(() => {
        setDataLoading(false);
      });
  }, [page]);

  return (
    <div>
      <Table
        style={{
          padding: "0 10px",
        }}
        scroll={{ x: 2000, y: 520 }}
        columns={tableColumns}
        dataSource={data}
        rowKey={(record) => record?.issueId}
        loading={dataLoading}
        pagination={{
          position: ["bottomRight"],
          defaultCurrent: page,
          pageSize: 10,
          pageSizeOptions: [10],
          total: metaInfo?.totalItems,
          onChange: (_page, _pageNum) => {
            setPage(_page);
          },
        }}
      />
    </div>
  );
};
