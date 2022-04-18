import {
  InboxOutlined,
  LineChartOutlined
} from "@ant-design/icons";
import { Tabs } from "antd";
import { Issues } from "./Issues";
import { Analysis } from './Analysis';

const { TabPane } = Tabs;

export const IndexTabs = (props: any) => {
  return (
    <Tabs defaultActiveKey="ISSUES" centered tabBarGutter={200}>
      {/* 趋势图 */}
      <TabPane
        tab={
          <span>
            <LineChartOutlined />
            Analysis
          </span>
        }
        key="Analysis"
      >
        <Analysis style={{ marginTop: 50 }} />
      </TabPane>
      <TabPane
        tab={
          <span>
            <InboxOutlined />
            ISSUES
          </span>
        }
        key="ISSUES"
      >
        <Issues />
      </TabPane>
    </Tabs>
  );
};
