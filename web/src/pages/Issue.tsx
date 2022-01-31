import { useParams, Link } from "react-router-dom";
import Iframe from "react-iframe";
import { useEffect, useState } from "react";
import { GET_ISSUES_PAGINATE } from "../api/api";
import { PageHeader, Tag, Button, Statistic, Descriptions, Row } from 'antd';

export const Issue = () => {
  const { issueId } = useParams();
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageNum, setPageNum] = useState(20);
  const [tableData, setTableData] = useState<any>([]);
  const [collectInfo,setCollectInfo] = useState<any>({})

  useEffect(() => {
    if (issueId) {
    } else {
      GET_ISSUES_PAGINATE({ page, pageNum }).then((data: any) => {
        const { items = [] } = data;
        setTableData(items);
      });
    }
  }, [issueId]);
  if (issueId) {
    return (
      <div>
        <Iframe
          url="http://www.youtube.com/embed/xDMP3i36naA"
          width="100%"
          height={`${window.innerHeight}px`}
          id={issueId}
        />
      </div>
    );
  }
  return <div>
        <>
    <PageHeader
      title="数据总览"
    >
      <Row>
        <Statistic title="issue总数" value={collectInfo?.totalItems} />
        <Statistic
          title="Price"
          prefix="$"
          value={568.08}
          style={{
            margin: '0 32px',
          }}
        />
        <Statistic title="Balance" prefix="$" value={3345.08} />
      </Row>
    </PageHeader>
  </>,
  </div>;
};
