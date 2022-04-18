import { PageHeader, Row, Statistic } from "antd";
import { CSSProperties } from "react";

export interface DataViewPageHeader {
  data: {
    title: string;
    value: number | string;
  }[];
}

export const DataViewPageHeader = ({ data, style = {},title = '数据总览' }: any) => {
  return (
    <div style={style}>
      <PageHeader title={title}>
        <Row>
          {data.map((d: any, i: number) => (
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
    </div>
  );
};
