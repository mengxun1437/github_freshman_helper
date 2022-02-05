import {
  Button,
  Card,
  Drawer,
  Row,
  Space,
  Typography,
  notification,
  message,
} from "antd";
import { CSSProperties, useState } from "react";
import { Link } from "react-router-dom";
import { START_RUN_A_MODEL } from "../api/api";
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
  TRAIN = "TRAIN",
  PREDICT = "PREDICT",
}

const cardList = [
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

  const handleCardClick = (key: any) => {
    console.log(key);
    setCurKey(key);
    // 需要弹窗
    if ([ABILITY.PREDICT].includes(key)) {
      setDrawerVisible(true);
      return;
    }
    // TODO: 模型的选择需要拓展，目前展示不拓展
    if (key === ABILITY.TRAIN) {
      START_RUN_A_MODEL()
        .then((data: any) => {
          if (data?.code === START_NEW_MODEL_STATUS_CODE.SUCCESS) {
            notification.success({
              message: (
                <div>
                  <Row>{data?.message}</Row>
                  <Link to={`/log/${data?.data?.modelId}`}></Link>
                </div>
              ),
            });
          } else if (data?.code === START_NEW_MODEL_STATUS_CODE.FAIL) {
            notification.error({
              message: data?.message,
            });
          }
        })
        .catch((e) => {
          notification.error({
            message: `some error happend: ${e.message}`,
          });
        });
    }
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
        extra={
          <Space>
            <Button onClick={() => {}}>Cancel</Button>
            <Button type="primary" onClick={() => {}}>
              OK
            </Button>
          </Space>
        }
      >
        <p>Some contents...</p>
        <p>Some contents...</p>
        <p>Some contents...</p>
      </Drawer>
    </>
  );
};
