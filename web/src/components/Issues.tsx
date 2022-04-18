import { Button, message, Switch, Table } from "antd";
import { useState, useEffect, useCallback, useRef } from "react";
import {
  GET_ISSUES_PAGINATE,
  UPDATE_USER_FAVOR,
  GET_USER_INFO,
} from "../api/api";
import { Typography } from "antd";
import { useNavigate } from "react-router-dom";
import STAR_EMPTY from "../statics/images/star-empty.png";
import STAR_FILLED from "../statics/images/star-filled.png";
const { Text } = Typography;

export const Issues = (props: any) => {
  const [data, setData] = useState<any>([]);
  const [page, setPage] = useState<number>(1);
  const [metaInfo, setMetaInfo] = useState<any>({});
  const [dataLoading, setDataLoading] = useState(true);
  const [userFavors, setUserFavors] = useState<any>([]);
  const [showMine, setShowMine] = useState(false);
  const pageDataRef = useRef<any>({
    hasData: false,
    data: [],
    userFavors: [],
    showMine: false,
  });
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
            <img
              src={text ? STAR_FILLED : STAR_EMPTY}
              style={{ width: 24, height: 24 }}
            />
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

  const updateIssueList = (page = 1) => {
    const where: any = {
      isGoodTag: true,
      issueState: "open",
    };
    if (pageDataRef.current.showMine) {
      where.issueIds = pageDataRef.current.userFavors;
    }
    setDataLoading(true);
    GET_ISSUES_PAGINATE({
      page,
      pageNum: 10,
      where,
    })
      .then((data: any) => {
        pageDataRef.current.data = data.items;
        setData(
          data.items.map((item: any) => ({
            ...item,
            isFavor: pageDataRef.current.userFavors.includes(item?.issueId),
          }))
        );
        setMetaInfo(data.meta);
      })
      .catch(() => {
        message.warning("Get Issues Failed");
      })
      .finally(() => {
        pageDataRef.current.hasData = true;
        setDataLoading(false);
      });
  };

  useEffect(() => {
    pageDataRef.current.userFavors = userFavors;
    if (pageDataRef.current.hasData) {
      setData(
        pageDataRef.current.data.map((item: any) => ({
          ...item,
          isFavor: userFavors.includes(item?.issueId),
        }))
      );
      return;
    }
    updateIssueList();
  }, [userFavors]);

  useEffect(() => {
    updateIssueList(page);
  }, [page]);

  useEffect(() => {
    pageDataRef.current.showMine = showMine;
    setPage(1);
    updateIssueList();
  }, [showMine]);

  return (
    <div>
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          float: "right",
          marginRight: 20,
        }}
      >
        <span style={{ fontWeight: 500, marginRight: 10 }}>只看我收藏的</span>
        <Switch
          defaultChecked={false}
          onChange={(e) => {
            setShowMine(e);
          }}
        />
      </div>
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
          current: page,
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
