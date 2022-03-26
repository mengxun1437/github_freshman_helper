import { Avatar, Button, Card, message, Spin } from "antd";
import { useEffect, useRef, useState } from "react";
import {
  GET_ISSUE_MODEL_CONFIG,
  UPDATE_ISSUE_MODEL,
  GET_A_UNLABEL_ISSUE_ID,
} from "../api/api";
import GOOD from "../statics/images/good.svg";
import GOOD_CLICK from "../statics/images/good_click.svg";
import BAD from "../statics/images/bad.svg";
import BAD_CLICK from "../statics/images/bad_click.svg";

export const IssueModelLabel = (props: any) => {
  const { issueInfo = {} } = props;
  const [modelInfo, setModelInfo] = useState<any>(undefined);
  const [isGoodForFreshman, setIsGoodForFreshman] = useState<
    boolean | undefined
  >(undefined);
  const [loading, setLoading] = useState<boolean>(true);
  const { issue, issueModel } = issueInfo;
  const nextIssueIdRequestingRef = useRef<boolean>(false);
  useEffect(() => {
    if (!issueModel) {
      GET_ISSUE_MODEL_CONFIG(issue?.issueId).then((data: any) => {
        setModelInfo(data);
      });
    } else {
      setModelInfo(issueModel);
      setIsGoodForFreshman(issueModel?.isGoodForFreshman);
    }
  }, []);

  useEffect(() => {
    if (modelInfo) {
      setLoading(false);
    }
  }, [modelInfo]);

  const handleClick = (isGood: boolean | undefined) => {
    if (isGood === isGoodForFreshman) return;
    setLoading(true)
    UPDATE_ISSUE_MODEL({
      ...modelInfo,
      issueId: issue?.issueId,
      isGoodForFreshman: isGood === undefined ? true : isGood,
    })
      .then(() => {
        message.success("收集成功");
        setIsGoodForFreshman(isGood);
      })
      .catch((e) => {
        message.error("收集失败", e.message);;
      }).finally(() => {
          setLoading(false)
      })
  };

  return (
    <Card
      style={{
        position: "fixed",
        top: 200,
        right: 50,
        width: 200,
      }}
      title="是否适合新手解决?"
      bordered
    >
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        {loading ? (
          <Spin />
        ) : (
          <>
            <div onClick={() => handleClick(true)}>
              <Avatar
                src={isGoodForFreshman ? GOOD_CLICK : GOOD}
                shape="square"
              />
            </div>
            <div style={{ marginLeft: 10 }} onClick={() => handleClick(false)}>
              <Avatar
                src={isGoodForFreshman === false ? BAD_CLICK : BAD}
                shape="square"
              />
            </div>
          </>
        )}

        <Button
          style={{ marginLeft: 20 }}
          onClick={() => {
            if (nextIssueIdRequestingRef.current) return;
            nextIssueIdRequestingRef.current = true;
            GET_A_UNLABEL_ISSUE_ID()
              .then((data: any) => {
                window.location.href = `${window.location.origin}/label/${data}`;
              })
              .catch((e) => {
                message.error(e.message);
              }).finally(() => {
                nextIssueIdRequestingRef.current = false;
              })
          }}
        >
          下一个
        </Button>
      </div>
    </Card>
  );
};
