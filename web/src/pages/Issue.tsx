import { useParams } from "react-router-dom";
import Iframe from "react-iframe";
import { useEffect, useState } from "react";
import { GET_ISSUES_BASIC_INFO, GET_ISSUE_INFO_BY_ISSUE_ID } from "../api/api";
import { DataViewPageHeader } from "../components/DataViewPageHeader";
import { IssueTable } from "../components/IssueTable";
import { BASE_SERVER_URL } from "../common/index";
import { IssueModelLabel } from "../components/IssueModelLabel";
import { Spin } from "antd";

export const Issue = () => {
  const { issueId } = useParams();
  const [loading, setLoading] = useState(true);
  const [issuesBasicInfo, setIssuesBasicInfo] = useState<any>({});
  const [issueInfo, setIssueInfo] = useState<any>({});

  useEffect(() => {
    if (issueId) {
      GET_ISSUE_INFO_BY_ISSUE_ID(Number(issueId)).then((data: any) => {
        if (!data?.issue) {
          window.location.href = `${window.location.origin}/issue`;
          return
        }
        setIssueInfo(data);
        setLoading(false)
      });
    } else {
      GET_ISSUES_BASIC_INFO().then((data) => {
        setIssuesBasicInfo(data || {});
        setLoading(false)
      });
    }
  }, [issueId]);
  
  if (loading) {
    return (
      <div
        style={{
          width: "100%",
          height: window.innerHeight,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Spin />
      </div>
    );
  }else{
    if (issueId) {
      const { issue, issueModel } = issueInfo;
      if (!issue?.issueHtmlUrl) return <></>;
      const iframeUrl = `${BASE_SERVER_URL}/util/getGitHubPage?target=${encodeURIComponent(
        issue?.issueHtmlUrl
      )}/`;
      return (
        <div>
          <Iframe
            url={iframeUrl}
            width="100%"
            height={`${window.innerHeight}px`}
            id={issueId}
          />
          <IssueModelLabel issueInfo={issueInfo} />
        </div>
      );
    }
    return (
      <div>
        <>
          <DataViewPageHeader {...issuesBasicInfo} />
          <IssueTable />
        </>
      </div>
    );
  }
};
