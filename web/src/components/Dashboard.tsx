import ReactECharts, { EChartsOption } from "echarts-for-react";
import { useState, useEffect } from "react";
import { GET_EVERY_DATE_ISSUE_NUM } from "../api/api";

export const Dashboard = (props: any) => {
  const [everyDateOption, setEveryDateOption] = useState<EChartsOption>({});
  useEffect(() => {
    GET_EVERY_DATE_ISSUE_NUM().then((data: any) => {
      const everyDateList = ["count", "open", "closed"];
      setEveryDateOption({
        title: {
          text: "GFI ISSUE 趋势图",
          textAlign: "center",
          left:"50%"
        },
        animationDuration: 2500,
        grid: {},
        yAxis: {
          name: "GFI 创建数目",
          type: "value",
        },
        xAxis: {
          name: "日期 / 月",
          type: "category",
          nameLocation: "end",
          data: data.map((item: any) => item?.date),
        },

        tooltip: {
          trigger: "axis",
        },

        series: everyDateList.map((edl: any) => ({
          type: "line",
          smooth: true,
          name: edl === "count" ? "total" : edl,
          showSymbol: false,
          data: data.map((item: any) => item?.[edl] || 0),
        })),
      });
    });
  }, []);
  return (
    <div>
      <ReactECharts
        style={{ height: 600, padding: 5 }}
        option={everyDateOption}
      />
    </div>
  );
};
