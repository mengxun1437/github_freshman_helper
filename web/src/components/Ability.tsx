import {
  Button,
  Card,
  Drawer,
  Row,
  Typography,
  message,
  Form,
  Input,
} from "antd";
import { CSSProperties, useState } from "react";
import { START_RUN_A_MODEL, START_PREDICT, GET_A_UNLABEL_ISSUE_ID } from '../api/api';
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
  COLLECT = 'COLLECT',
  LABEL = 'LABEL',
  TRAIN = "TRAIN",
  PREDICT = "PREDICT",
}

const cardList = [
  {
    key: ABILITY.COLLECT,
    title: "收集Issues",
    desc: "拉取github最新的issues",
    btn: "开始收集",
  },
  {
    key: ABILITY.LABEL,
    title: "打标签",
    desc: "判断是否适合新手，并收集到训练集中",
    btn: "去打标签",
  },
  {
    key: ABILITY.TRAIN,
    title: "训练模型",
    desc: "你可以更新模型",
    btn: "开始训练",
  },
  {
    key: ABILITY.PREDICT,
    title: "预测",
    desc: "你可以预测一个issue是否适合新手完成",
    btn: "开始预测",
  },
];

export const Ability = () => {
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [curKey, setCurKey] = useState(ABILITY.TRAIN);
  const [predictForm] = Form.useForm();
  const [predictLoding, setPredictLoading] = useState(false);

  const handleCardClick = (key: any) => {
    setCurKey(key);
    // 需要弹窗
    if ([ABILITY.PREDICT].includes(key)) {
      setDrawerVisible(true);
      return;
    }
    // TODO: 模型的选择需要拓展，目前展示不拓展
    if(key === ABILITY.COLLECT){
      // COLLECT_FIRST_ISSUES()
      message.info("此功能暂不开放")
    }else if(key === ABILITY.LABEL){
      GET_A_UNLABEL_ISSUE_ID().then((data:any)=>{
        window.open(`${window.location.origin}/label/${data}`,'_blank')
      }).catch(()=>{
        message.error('获取issueId失败')
      })
    }else if (key === ABILITY.TRAIN) {
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
    }
  };

  const handlePredictClick = () => {
    setPredictLoading(true);
    const predictFormValue = { ...predictForm.getFieldsValue() };
    // TODO: 选择预测模型，暂时手填，后续优化
    const issueId = predictFormValue?.issueId;
    const modelId = predictFormValue?.modelId;
    if (!issueId || !modelId) {
      message.warning("参数未完整");
      setPredictLoading(false);
      return;
    }
    START_PREDICT({ issueId, modelId })
      .then((data: any) => {
        if (data?.bid) {
          message.success(
            `预测成功：${data?.isGoodForFreshman ? "" : "不"}适合新手`
          );
          return;
        } else {
          message.error("预测失败");
        }
      })
      .catch((e) => {
        message.error(`预测失败: ${e.message}`);
      })
      .finally(() => {
        setPredictLoading(false);
      });
  };

  return (
    <>
      <Card bordered={false}>
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
        title={""}
        placement="right"
        size="large"
        onClose={() => setDrawerVisible(false)}
        visible={drawerVisible}
        closeIcon={null}
      >
        {curKey === ABILITY.PREDICT ? (
          <>
            <h4>预测时间可能有点久，大约10秒，请耐心等待</h4>
            <Form
              form={predictForm}
              layout="horizontal"
              name="form_in_modal"
              initialValues={{}}
            >
              <Form.Item name="issueId" label="issueId">
                <Input />
              </Form.Item>
              <Form.Item name="modelId" label="modelId">
                <Input />
              </Form.Item>
              <Button loading={predictLoding} onClick={handlePredictClick}>
                {predictLoding ? "预测中" : "立即预测"}
              </Button>
            </Form>
          </>
        ) : (
          <></>
        )}
      </Drawer>
    </>
  );
};
