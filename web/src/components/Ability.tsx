import {
  Button,
  Card,
  Drawer,
  Row,
  Typography,
  message,
  Form,
  Input,
  Modal,
  Select,
} from "antd";
import { CSSProperties, useState, useEffect, useRef } from "react";
import { CustomTable } from "./CustomTable";
import {
  START_RUN_A_MODEL,
  START_PREDICT,
  GET_A_UNLABEL_ISSUE_ID,
  COLLECT_FIRST_ISSUES,
  STORE_MODEL_INFO,
  START_BATCH_PREDICT,
  CHECK_ISSUE_STATE,
  GET_ALL_MODEL_IDS,
  START_ISSUE_PREDICT,
} from "../api/api";
import { issuePredictProps } from "../common/tables";
const { Text } = Typography;

const gridStyle: CSSProperties = {
  width: "20%",
  margin: 10,
  borderRadius: 10,
};

enum START_NEW_MODEL_STATUS_CODE {
  SUCCESS = 0,
  FAIL = 1,
}

enum ABILITY {
  COLLECT = "COLLECT",
  STORE = "STORE",
  TRAIN = "TRAIN",
  PREDICT = "PREDICT",
  CHECK_ISSUE_STATE = "CHECK_ISSUE_STATE",
}

const cardList = [
  {
    key: ABILITY.COLLECT,
    title: "收集Issues",
    desc: "拉取github最新的issues",
    btn: "开始收集",
  },
  {
    key: ABILITY.TRAIN,
    title: "训练模型",
    desc: "你可以更新模型",
    btn: "开始训练",
  },
  {
    key: ABILITY.STORE,
    title: "收集参数",
    desc: "收集分类训练需要的参数信息",
    btn: "开始收集",
  },
  {
    key: ABILITY.PREDICT,
    title: "分类",
    desc: "对收集到的open issue进行批量分类",
    btn: "开始分类",
  },
  {
    key: ABILITY.CHECK_ISSUE_STATE,
    title: "更新issue状态",
    desc: "检查前端展示的issue状态并更新",
    btn: "更新状态",
  },
];

export const Ability = () => {
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [curKey, setCurKey] = useState(ABILITY.TRAIN);
  const [predictForm] = Form.useForm();
  const [predictLoding, setPredictLoading] = useState(false);
  const predictModelIdRef = useRef<any>("");
  const [refresh,setRefresh] = useState(true)

  useEffect(() => {
    setRefresh(curKey === ABILITY.PREDICT && drawerVisible)
  }, [curKey, drawerVisible]);

  const handleCardClick = (key: any) => {
    setCurKey(key);
    // 需要弹窗
    // if ([ABILITY.PREDICT].includes(key)) {
    //   setDrawerVisible(true);
    //   return;
    // }
    // TODO: 模型的选择需要拓展，目前展示不拓展
    if (key === ABILITY.COLLECT) {
      COLLECT_FIRST_ISSUES().then(() => {
        message.info("正在收集");
      });
    } else if (key === ABILITY.STORE) {
      STORE_MODEL_INFO().then(() => {
        message.info("正在收集");
      });
    } else if (key === ABILITY.TRAIN) {
      START_RUN_A_MODEL()
        .then((data: any) => {
          if (data?.code === START_NEW_MODEL_STATUS_CODE.SUCCESS) {
            message.success(`success,model id is ${data?.data?.modelId}`);
          } else if (data?.code === START_NEW_MODEL_STATUS_CODE.FAIL) {
            message.error(data?.message || "服务端错误");
          }
        })
        .catch((e) => {
          message.error(e?.message || "服务端错误");
        });
    } else if (key === ABILITY.PREDICT) {
      // START_BATCH_PREDICT().then(() => {
      //   message.info("正在批量分类")
      // })
      GET_ALL_MODEL_IDS().then((data: any) => {
        Modal.info({
          title: "选择分类模型",
          direction: "ltr",
          maskClosable: true,
          content: (
            <div style={{position:'relative'}}>
              <Button
              style={{position:'absolute',right:0,}}
                type="link"
                onClick={() => {
                  setDrawerVisible(true);
                }}
              >
                查看分类进度
              </Button>
              <Select
                style={{ width: 200 }}
                onChange={(val) => {
                  predictModelIdRef.current = val;
                }}
                options={data.map((da: any) => ({
                  label: da,
                  value: da,
                }))}
              ></Select>
            </div>
          ),
          onOk: () => {
            if (!predictModelIdRef.current) {
              message.info("需要选择一个模型用于分类");
              return;
            }
            // 触发模型分类命令
            START_ISSUE_PREDICT({ modelId: predictModelIdRef.current }).then(
              () => {
                message.success("开始分类");
              }
            );
          },
        });
      });
    } else if (key === ABILITY.CHECK_ISSUE_STATE) {
      CHECK_ISSUE_STATE().then(() => {
        message.info("正在更新...");
      });
    }
  };

  // const handlePredictClick = () => {
  //   setPredictLoading(true);
  //   const predictFormValue = { ...predictForm.getFieldsValue() };
  //   // TODO: 选择预测模型，暂时手填，后续优化
  //   const issueId = predictFormValue?.issueId;
  //   const modelId = predictFormValue?.modelId;
  //   if (!issueId || !modelId) {
  //     message.warning("参数未完整");
  //     setPredictLoading(false);
  //     return;
  //   }
  //   START_PREDICT({ issueId, modelId })
  //     .then((data: any) => {
  //       if (data?.bid) {
  //         message.success(
  //           `预测成功：${data?.isGoodForFreshman ? "" : "不"}适合新手`
  //         );
  //         return;
  //       } else {
  //         message.error("预测失败");
  //       }
  //     })
  //     .catch((e) => {
  //       message.error(`预测失败: ${e.message}`);
  //     })
  //     .finally(() => {
  //       setPredictLoading(false);
  //     });
  // };

  return (
    <>
      <Card bordered={false} style={{ height: "100%" }}>
        {cardList.map((card) => {
          return (
            <Card.Grid key={card.key} title={card.title} style={gridStyle}>
              <Row style={{ marginTop: 5 }}>
                <Text style={{ fontSize: 20 }} strong>
                  {card.title}
                </Text>
              </Row>
              <Row style={{ marginTop: 5 }}>
                <Text type="secondary">{card.desc}</Text>
              </Row>
              <Row
                style={{
                  display: "flex",
                  justifyContent: "center",
                  marginTop: 10,
                }}
              >
                <Button
                  style={{ width: "80%" }}
                  type="default"
                  onClick={() => handleCardClick(card.key)}
                >
                  {card.btn}
                </Button>
              </Row>
            </Card.Grid>
          );
        })}
      </Card>
      <Drawer
        zIndex={1002}
        title={""}
        placement="right"
        width={1500}
        onClose={() => setDrawerVisible(false)}
        visible={drawerVisible}
        closeIcon={null}
      >
        {curKey === ABILITY.PREDICT ? (
          <>
            <CustomTable {...issuePredictProps()} refresh={refresh} />
          </>
        ) : (
          <></>
        )}
      </Drawer>
    </>
  );
};
