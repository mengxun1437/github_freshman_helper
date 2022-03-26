import { useParams } from "react-router";
import { useEffect, useState } from "react";
import { GET_ISSUE_INFO_BY_ISSUE_ID } from "../api/api";
import Iframe from "react-iframe";
import { BASE_PROXY_URL } from "../common";
import { IssueModelLabel } from "../components/IssueModelLabel";
import { Spin } from "antd";

export const IssueLabel = () => {
  const { issueId } = useParams();
  const [loading, setLoading] = useState(true);
  const [issueInfo, setIssueInfo] = useState<any>({});

  useEffect(() => {
    if (issueId) {
      GET_ISSUE_INFO_BY_ISSUE_ID(Number(issueId)).then((data: any) => {
        if (!data?.issue) {
          window.location.href = `${window.location.origin}/issue`;
          return;
        }
        setIssueInfo(data);
        setLoading(false);
      });
    }
  }, []);

  if (loading || !issueId) {
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
  } else {
    const { issue } = issueInfo;
    if (!issue?.issueHtmlUrl) return <></>;
    const iframeUrl = `${BASE_PROXY_URL}/githubIssue/${issue?.issueHtmlUrl?.slice(
      19
    )}`;
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
};
