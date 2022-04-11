import {
  InboxOutlined,
  LineChartOutlined,
  PieChartOutlined,
} from "@ant-design/icons";
import { Tabs } from "antd";
import { Issues } from "./Issues";
import { Trend } from "./Trend";

const { TabPane } = Tabs;

export const IndexTabs = (props: any) => {
  return (
    <Tabs defaultActiveKey="ISSUES" centered tabBarGutter={100}>
      {/* 趋势图 */}
      <TabPane
        tab={
          <span>
            <LineChartOutlined />
            TREND
          </span>
        }
        key="TREND"
      >
        <Trend style={{ marginTop: 50 }} />
      </TabPane>
      <TabPane
        tab={
          <span>
            <PieChartOutlined />
            STATISTICS
          </span>
        }
        key="STATISTICS"
      >
        STATISTICS
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
