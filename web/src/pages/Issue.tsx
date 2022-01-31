import { useParams } from "react-router-dom";
import Iframe from "react-iframe";
import { useEffect, useState } from "react";
import {
  GET_ISSUES_BASIC_INFO,
  GET_ISSUE_INFO_BY_ISSUE_ID,
} from "../api/api";
import { DataViewPageHeader } from "../components/DataViewPageHeader";
import { IssueTable } from "../components/IssueTable";
import { PROD_ENV } from "../common";

export const Issue = () => {
  const { issueId } = useParams();
  const [loading, setLoading] = useState(true);
  const [issuesBasicInfo, setIssuesBasicInfo] = useState<any>({});
  const [issueInfo, setIssueInfo] = useState<any>({});
  const [issueHtmlContent, setIssueHtmlContent] = useState<string>("");

  useEffect(() => {
    if (issueId) {
      GET_ISSUE_INFO_BY_ISSUE_ID(Number(issueId)).then((data: any) => {
        setIssueInfo(data);
      });
    } else {
      GET_ISSUES_BASIC_INFO().then((data) => {
        setIssuesBasicInfo(data || {});
      });
    }
  }, [issueId]);
  if (issueId) {
    const { issue, issueModel } = issueInfo;
    if (!issue?.issueHtmlUrl) return <></>;
    const iframeUrl = `${
      PROD_ENV ? "api.mengxun.online/gfh" : "localhost:10310"
    }/util/getGitHubPage?target=${issue?.issueHtmlUrl}/`;
    return (
      <div>
        {/* <Iframe
          url={iframeUrl}
          width="100%"
          height={`${window.innerHeight}px`}
          id={issueId}
        /> */}
        <iframe src='www.baidu.com'></iframe>
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
};
