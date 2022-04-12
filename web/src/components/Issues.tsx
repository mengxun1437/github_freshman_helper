import { Button, message, Table } from "antd";
import { useState, useEffect, useCallback } from "react";
import {
  GET_ISSUES_PAGINATE,
  UPDATE_USER_FAVOR,
  GET_USER_INFO,
} from "../api/api";
import { Typography } from "antd";
import { useNavigate } from "react-router-dom";
const { Text } = Typography;

export const Issues = (props: any) => {
  const [data, setData] = useState<any>([]);
  const [page, setPage] = useState<number>(1);
  const [metaInfo, setMetaInfo] = useState<any>({});
  const [dataLoading, setDataLoading] = useState(true);
  const [userFavors, setUserFavors] = useState<any>([]);
  const navigate = useNavigate();

  const tableColumns = [
    {
      title: "issueId",
      dataIndex: "issueId",
      key: "issueId",
    },
    {
      title: "issue标题",
      dataIndex: "issueTitle",
      key: "issueTitle",
      render: (text: any) => (
        <Text style={{ width: 200 }} ellipsis={{ tooltip: text }}>
          {text}
        </Text>
      ),
    },
    {
      title: "issue详情",
      dataIndex: "issueHtmlUrl",
      key: "issueHtmlUrl",
      render: (text: any, record: any) => (
        <Button
          type="link"
          onClick={() => window.open(record?.issueHtmlUrl, "_blank")}
        >
          查看
        </Button>
      ),
    },
    {
      title: "对应的仓库",
      dataIndex: "issueRepo",
      key: "issueRepo",
      render: (text: any) => (
        <Text style={{ width: 200 }} ellipsis={{ tooltip: text }}>
          <Button
            type="link"
            onClick={() => window.open(`https://github.com/${text}`, "_blank")}
          >
            {text}
          </Button>
        </Text>
      ),
    },
    {
      title: "创建时间",
      dataIndex: "issueCreated",
      key: "issueCreated",
      render: (text: any) => <div>{text}</div>,
    },
    {
      title: "收藏",
      dataIndex: "isFavor",
      key: "isFavor",
      render: (text: boolean | undefined, record: any) => {
        return (
          <div
            onClick={() =>
              changeFavorState(record.issueId, text ? "delete" : "add")
            }
          >
            {text ? "1" : "0"}
          </div>
        );
      },
    },
  ];

  useEffect(() => {
    updateUserFavors();
  }, []);

  const changeFavorState = (issueId: any, action: string) => {
    UPDATE_USER_FAVOR({ issueId, action }).then((da: any) => {
      if (da.code === 40300) {
        navigate("/login");
        return;
      }
      updateUserFavors();
    });
  };

  const updateUserFavors = () => {
    GET_USER_INFO().then((res: any) => {
      if (res.code === 0) {
        setUserFavors(res.data.favor || []);
      }
    });
  };

  useEffect(() => {
    setData(
      data.map((item: any) => ({
        ...item,
        isFavor: userFavors.includes(item?.issueId),
      }))
    );
  }, [userFavors]);

  useEffect(() => {
    setDataLoading(true);
    GET_ISSUES_PAGINATE({
      page,
      pageNum: 10,
      where: {
        isGoodTag: true,
        issueState: "open",
      },
    })
      .then((data: any) => {
        setData(
          data.items.map((item: any) => ({
            ...item,
            isFavor: userFavors.includes(item?.issueId),
          }))
        );
        setMetaInfo(data.meta);
      })
      .catch(() => {
        message.warning("Get Issues Failed");
      })
      .finally(() => {
        setDataLoading(false);
      });
  }, [page]);

  return (
    <div>
      <Table
        style={{
          padding: "0 10px",
        }}
        columns={tableColumns}
        dataSource={data}
        rowKey={(record) => record?.issueId}
        loading={dataLoading}
        pagination={{
          position: ["bottomRight"],
          defaultCurrent: page,
          pageSize: 10,
          pageSizeOptions: [10],
          total: metaInfo?.totalItems,
          onChange: (_page, _pageNum) => {
            setPage(_page);
          },
        }}
      />
    </div>
  );
};
