import { PageHeader, Row, Statistic } from "antd";

export interface DataViewPageHeader {
  data: {
    title: string;
    value: number | string;
  }[];
}

export const DataViewPageHeader = ({ data }: DataViewPageHeader) => {
  return (
    <PageHeader title="数据总览">
      <Row>
        {data.map((d, i) => (
          <Statistic
            style={{
              margin: i === 0 ? "0" : "0 10px",
            }}
            key={`${d}-${i}`}
            title={d.title}
            value={d.value}
          />
        ))}
      </Row>
    </PageHeader>
  );
};
