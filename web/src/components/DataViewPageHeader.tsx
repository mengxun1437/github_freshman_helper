import { PageHeader, Row, Statistic } from "antd";

export const DataViewPageHeader = (props: any) => {
  const {
    totalIssuesNum,
    openIssuesNum,
    closeIssuesNum,
    linkedPrIssuesNum,
    reposNum,
  } = props;
  return (
    <PageHeader title="数据总览">
      <Row>
        <Statistic title="Issues" value={totalIssuesNum} />
        <Statistic
          title="Open Issues"
          value={openIssuesNum}
          style={{
            margin: "0 32px",
          }}
        />
        <Statistic
          title="Closed Issues"
          value={closeIssuesNum}
          style={{
            margin: "0 32px",
          }}
        />
        <Statistic
          title="有PR的Issues数"
          value={linkedPrIssuesNum}
          style={{
            margin: "0 32px",
          }}
        />
        <Statistic
          title="仓库总数"
          value={reposNum}
          style={{
            margin: "0 32px",
          }}
        />
      </Row>
    </PageHeader>
  );
};
