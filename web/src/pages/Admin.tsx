import {
  MenuUnfoldOutlined,
  BranchesOutlined,
  FolderAddOutlined,
  RocketOutlined,
} from "@ant-design/icons";
import { Layout, Menu, Spin } from "antd";
import React, { useEffect, useState } from "react";
import { GET_ISSUES_BASIC_INFO, GET_ISSUE_MODELS_BASIC_INFO } from "../api/api";
import { DataViewPageHeader } from "../components/DataViewPageHeader";
import { IssueTable } from "../components/IssueTable";
import "./Admin.css";
import { IssueModelTable } from "../components/IssueModelTable";
const { Header, Content, Sider } = Layout;

enum CONTENT_KEY {
  ISSUE = "ISSUE",
  ISSUE_MODEL = "ISSUE_MODEL",
  MODEL = "MODEL",
}

const siderList = [
  {
    key: CONTENT_KEY.ISSUE,
    icon: <BranchesOutlined />,
    title: "议题",
  },
  {
    key: CONTENT_KEY.ISSUE_MODEL,
    icon: <FolderAddOutlined />,
    title: "数据集",
  },
  {
    key: CONTENT_KEY.MODEL,
    icon: <RocketOutlined />,
    title: "模型",
  },
];

export const Admin = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [contentKey, setContentKey] = useState(CONTENT_KEY.ISSUE);
  const [issuesBasicInfo, setIssuesBasicInfo] = useState<any>({});
  const [issueModelsBasicInfo, setIssueModelsBasicInfo] = useState<any>({});
  const [issueLoading, setIssueLoading] = useState(true);
  const [issueModelLoading, setIssueModelLoading] = useState(true);

  const issueViewHeaderData = [
    {
      title: "Issues",
      value: issuesBasicInfo?.totalIssuesNum,
    },
    {
      title: "Open Issues",
      value: issuesBasicInfo?.openIssuesNum,
    },
    {
      title: "Closed Issues",
      value: issuesBasicInfo?.closeIssuesNum,
    },
    {
      title: "Linked Pr Issues",
      value: issuesBasicInfo?.linkedPrIssuesNum,
    },
    {
      title: "Repos",
      value: issuesBasicInfo?.reposNum,
    },
  ];

  const issueModelViewHeaderData = [
    {
      title: "Issue Models",
      value: issueModelsBasicInfo?.totalIssueModelsNum,
    },
    {
      title: "Good Tags",
      value: issueModelsBasicInfo?.goodTagsNum,
    },
    {
      title: "Bad Tags",
      value: issueModelsBasicInfo?.badTagsNum,
    },
  ];

  useEffect(() => {
    GET_ISSUES_BASIC_INFO().then((data) => {
      setIssuesBasicInfo(data || {});
      setIssueLoading(false);
    });
    GET_ISSUE_MODELS_BASIC_INFO().then((data) => {
        setIssueModelsBasicInfo(data || {});
        setIssueModelLoading(false);
      });
  }, []);

  return (
    <Layout style={{ height: window.innerHeight }}>
      <Sider trigger={null} collapsible collapsed={collapsed}>
        <div className="logo" />
        <Menu
          theme="dark"
          mode="inline"
          defaultSelectedKeys={[CONTENT_KEY.ISSUE]}
        >
          {siderList.map((sider) => {
            return (
              <Menu.Item
                key={sider.key}
                icon={sider.icon}
                onClick={() => setContentKey(sider.key)}
              >
                {sider.title}
              </Menu.Item>
            );
          })}
        </Menu>
      </Sider>
      <Layout className="site-layout">
        <Header className="site-layout-background" style={{ padding: 0 }}>
          {React.createElement(MenuUnfoldOutlined, {
            className: "trigger",
            onClick: () => {
              setCollapsed(!collapsed);
            },
          })}
        </Header>
        <Content
          className="site-layout-background"
          style={{
            margin: "24px 16px",
            padding: 24,
            minHeight: 280,
          }}
        >
          {contentKey === CONTENT_KEY.ISSUE ? (
            issueLoading ? (
              <div
                style={{
                  height: "100%",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Spin />
              </div>
            ) : (
              <>
                <DataViewPageHeader data={issueViewHeaderData} />
                <IssueTable />
              </>
            )
          ) : contentKey === CONTENT_KEY.ISSUE_MODEL ? (
            issueModelLoading ? (
              <div
                style={{
                  height: "100%",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Spin />
              </div>
            ) : (
              <>
                <DataViewPageHeader data={issueModelViewHeaderData} />
                <IssueModelTable />
              </>
            )
          ) : contentKey === CONTENT_KEY.MODEL ? (
            "3"
          ) : (
            "4"
          )}
        </Content>
      </Layout>
    </Layout>
  );
};
