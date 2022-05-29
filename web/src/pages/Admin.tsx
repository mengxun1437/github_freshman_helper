import {
  MenuUnfoldOutlined,
  BranchesOutlined,
  FolderAddOutlined,
  RocketOutlined,
  StarOutlined,
} from "@ant-design/icons";
import { Layout, Menu, Spin, notification, Button } from 'antd';
import React, { useEffect, useLayoutEffect, useState } from "react";
import {
  GET_ISSUES_BASIC_INFO,
  GET_ISSUE_MODELS_BASIC_INFO,
  GET_MODELS_BASIC_INFO,
} from "../api/api";
import { DataViewPageHeader } from "../components/DataViewPageHeader";
import "./Admin.css";
import { CustomTable } from "../components/CustomTable";
import { Ability } from "../components/Ability";
import { ADMIN_TOKEN } from "../api/api";
import {
  issueTableProps,
  issueModelTableProps,
  modelTableProps,
} from "../common/tables";
import { useNavigate } from "react-router-dom";
const { Header, Content, Sider } = Layout;

enum CONTENT_KEY {
  ISSUE = "ISSUE",
  ISSUE_MODEL = "ISSUE_MODEL",
  MODEL = "MODEL",
  ABILITY = "ABILITY",
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
  {
    key: CONTENT_KEY.ABILITY,
    icon: <StarOutlined />,
    title: "功能",
  },
];

export const Admin = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [contentKey, setContentKey] = useState(CONTENT_KEY.ISSUE);
  const [issuesBasicInfo, setIssuesBasicInfo] = useState<any>({});
  const [issueModelsBasicInfo, setIssueModelsBasicInfo] = useState<any>({});
  const [modelsBasicInfo, setModelsBasicInfo] = useState<any>({});
  const [issueLoading, setIssueLoading] = useState(true);
  const [issueModelLoading, setIssueModelLoading] = useState(true);
  const [modelLoading, setModelLoading] = useState(true);
  const navigate = useNavigate();

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

  const modelsViewHeaderData = [
    {
      title: "Models",
      value: modelsBasicInfo?.totalModelsNum,
    },
    {
      title: "Model Types",
      value: modelsBasicInfo?.modelTypeNum,
    },
    {
      title: "Model Programs",
      value: modelsBasicInfo?.modelProgramNum,
    },
    {
      title: "Model Frameworks",
      value: modelsBasicInfo?.modelFrameworkNum,
    },
    {
      title: "Training Models",
      value: modelsBasicInfo?.modelTrainingNum,
    },
  ];

  const pageLoadingContent = (
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
  );

  useEffect(() => {
    ADMIN_TOKEN().then((_data: any) => {
      if(!_data?.data){
        notification.warning({
          message: "Login In",
          description: "You should login in with admin account"
        });
        navigate("/login")
        return
      }
      GET_ISSUES_BASIC_INFO().then((data) => {
        setIssuesBasicInfo(data || {});
        setIssueLoading(false);
      });
      GET_ISSUE_MODELS_BASIC_INFO().then((data) => {
        setIssueModelsBasicInfo(data || {});
        setIssueModelLoading(false);
      });
      GET_MODELS_BASIC_INFO().then((data: any) => {
        setModelsBasicInfo(data || {});
        setModelLoading(false);
      });
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
              pageLoadingContent
            ) : (
              <>
                <DataViewPageHeader data={issueViewHeaderData} />
                <CustomTable key={CONTENT_KEY.ISSUE} {...issueTableProps()} />
              </>
            )
          ) : contentKey === CONTENT_KEY.ISSUE_MODEL ? (
            issueModelLoading ? (
              pageLoadingContent
            ) : (
              <>
                <DataViewPageHeader data={issueModelViewHeaderData} />
                <CustomTable
                  key={CONTENT_KEY.ISSUE_MODEL}
                  {...issueModelTableProps()}
                />
              </>
            )
          ) : contentKey === CONTENT_KEY.MODEL ? (
            modelLoading ? (
              pageLoadingContent
            ) : (
              <>
                <DataViewPageHeader data={modelsViewHeaderData} />
                <CustomTable refresh {...modelTableProps()} />
              </>
            )
          ) : contentKey === CONTENT_KEY.ABILITY ? (
            <Ability />
          ) : (
            <></>
          )}
        </Content>
      </Layout>
    </Layout>
  );
};

