import { Button } from "antd";
import ICON from "../statics/images/logo512.png";
import { GithubOutlined } from "@ant-design/icons";

export const Panel = (props:any) => {
  return (
    <div
      style={{
        padding: 40,
        width: "100%",
        display: "flex",
        flexDirection: "row",
        ...props?.style
      }}
    >
      <div style={{ width: "40%" }}>
        <img
          style={{ width: 215, height: 215, float: "right", marginRight: 60 }}
          src={ICON}
        />
      </div>
      <div style={{ width: "60%", display: "flex", flexDirection: "column" }}>
        <h1
          style={{
            fontWeight: 500,
            padding:'20px 0',
            color: "#273849",
            height: "50%",
            fontSize: 36,
            fontFamily: `"Source Sans Pro", "Helvetica Neue", Arial, sans-serif`,
          }}
        >
          <span>GitHub</span>
          <br></br>
          <span>Freshman Helper</span>
        </h1>
        <div style={{ display: "flex", flexDirection: "row",marginTop:25 }}>
          <Button
            style={{
              backgroundColor: "#46b980",
              border: "none"
            }}
            type="primary"
            shape="round"
            size="large"
          >
            What We Do?
          </Button>
          <Button
            style={{
              backgroundColor: "#46b980",
              marginLeft: 20,
              border: "none",
            }}
            type="primary"
            shape="round"
            size="large"
          >
            How We Do?
          </Button>
          <Button
            onClick={() =>
              window.open(
                "https://github.com/mengxun1437/github_freshman_helper",
                "_blank"
              )
            }
            style={{
              backgroundColor: "#f6f6f6",
              color: "#706459",
              marginLeft: 20,
              border: "none",
            }}
            icon={<GithubOutlined />}
            type="primary"
            shape="round"
            size="large"
          >
            GitHub Source
          </Button>
        </div>
      </div>
    </div>
  );
};
