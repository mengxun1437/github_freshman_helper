import ReactECharts, { EChartsOption } from "echarts-for-react";
import { useState, useEffect, useMemo } from "react";
import { GET_EVERY_DATE_ISSUE_NUM, GET_ISSUES_BASIC_INFO } from "../api/api";
import { DataViewPageHeader } from "./DataViewPageHeader";

export const Analysis = (props: any) => {
  const [everyDateOption, setEveryDateOption] = useState<EChartsOption>({});
  const [issueStateOption, setIssueStateOption] = useState<EChartsOption>({});
  const [issuesBasicInfo, setIssuesBasicInfo] = useState<any>({});
  useEffect(() => {
    GET_EVERY_DATE_ISSUE_NUM().then((data: any) => {
      const everyDateList = ["count", "open", "closed"];
      setEveryDateOption({
        title: {
          text: "GFI ISSUE TREND",
          subtext:
            "show the trend of the num of good first issues created every month",
          left: "center",
        },
        animationDuration: 2500,
        grid: {},
        yAxis: {
          name: "GFI Created Num",
          type: "value",
          splitLine: {
            show: false,
          },
        },
        xAxis: {
          name: "Date(every month)",
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
    GET_ISSUES_BASIC_INFO().then((data: any) => {
      setIssuesBasicInfo(data);
    });
  }, []);

  useEffect(() => {
    const { openIssuesNum, closeIssuesNum } = issuesBasicInfo;
    if (!openIssuesNum || !closeIssuesNum) return;
    setIssueStateOption({
      title: {
        text: "GFI ISSUES STATE",
        subtext: "show open/closed good first issues num",
        left: "center",
      },
      tooltip: {
        trigger: "item",
        formatter: "{a} <br/>{b}: {c} ({d}%)",
      },
      legend: {
        orient: "vertical",
        left: "right",
      },
      series: [
        {
          name: "Num",
          type: "pie",
          radius: "50%",
          label: {
            normal: {
              show: true,
              position: "inside",
              formatter: "{d}%",

              textStyle: {
                align: "center",
                baseline: "middle",
                fontFamily: "微软雅黑",
                fontSize: 15,
                fontWeight: "bolder",
              },
            },
          },
          data: [
            { value: issuesBasicInfo?.closeIssuesNum || 0, name: "Closed" },
            { value: issuesBasicInfo?.openIssuesNum || 0, name: "Open" },
          ],
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: "rgba(0, 0, 0, 0.5)",
            },
          },
        },
      ],
    });
  }, [issuesBasicInfo]);

  const issueViewHeaderData = useMemo(
    () => [
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
    ],
    [issuesBasicInfo]
  );
  return (
    <>
      <DataViewPageHeader
        title="Data View"
        style={{ paddingLeft: 100 }}
        data={issueViewHeaderData}
      />
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          padding: "0px 100px",
          ...props?.style,
        }}
      >
        <ReactECharts
          key="everyDateOption"
          style={{ height: 500, padding: 5, width: "60%" }}
          option={everyDateOption}
        />
        <ReactECharts
          key="issueStateOption"
          style={{ height: 500, padding: 5, width: "40%" }}
          option={issueStateOption}
        />
      </div>
    </>
  );
};
