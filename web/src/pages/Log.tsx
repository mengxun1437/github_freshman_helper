import { Spin, Table } from "antd";
import { useState, useEffect } from "react";
import { useParams } from "react-router";
import { GET_LOG_FROM_QINIU } from "../api/api";

enum LogType {
  SCORE = "score",
  GRAPH = "graph",
}
const scoreColumns = [
  "max_depth",
  "min_samples_split",
  "min_samples_leaf",
  "random_state",
  "min_weight_fraction_leaf",
  "min_impurity_decrease",
  "score",
];
const getRowKey = (record: any) => {
  let rowKey = "";
  scoreColumns.forEach((row) => (rowKey += record[row]));
  return rowKey;
};

export const Log = () => {
  const { type, sourceId } = useParams();
  const [pageLoading, setPageLoading] = useState(true);
  const [data, setData] = useState<any>([]);

  useEffect(() => {
    if (!type || !sourceId) return;
    GET_LOG_FROM_QINIU(type, sourceId).then((data: any) => {
      setData(data);
      setPageLoading(false);
    });
  }, []);

  const tableScoreColumns = scoreColumns.map((column) => ({
    title: column,
    dataIndex: column,
    key: column,
  }));

  return (
    <div>
      {pageLoading ? (
        <div
          style={{
            height: window.innerHeight,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Spin />
        </div>
      ) : (
        <Table
          rowKey={(record: any) => getRowKey(record)}
          style={{
            marginTop: 8,
            padding: "0 10px",
          }}
          columns={tableScoreColumns}
          dataSource={data}
          loading={pageLoading}
        />
      )}
    </div>
  );
};
