import { Button, Col, Form, Input, message, Row } from "antd";
import { useRef } from "react";
import { ADD_NEW_USER, USER_LOGIN } from "../api/api";
import { useNavigate } from "react-router-dom";
import { MD5 } from "crypto-js";

export const Login = () => {
  const navigate = useNavigate();

  const valid = async () =>
    new Promise((res, rej) => {
      const nickName = formRef.current.getFieldValue("username");
      const password = formRef.current.getFieldValue("password");
      if (!nickName) {
        rej("用户名不可为空");
      } else if (!password) {
        rej("密码不可为空");
      } else {
        res({
          nickName,
          password: MD5(password).toString(),
        });
      }
    });
  const handleLogin = () => {
    valid().then(
      (res) => {
        USER_LOGIN(res).then((data: any) => {
          if (data.code === 0) {
            message.success("登录成功");
            window.localStorage.setItem("userId", data.data?.userId);
            window.localStorage.setItem("token", data.data?.token);
            navigate("/");
            return;
          } else {
            message.error(data?.message);
          }
        });
      },
      (err) => {
        message.warn(err);
        return;
      }
    );
  };

  const handleRegist = () => {
    valid().then(
      (res) => {
        ADD_NEW_USER(res).then((data: any) => {
          if (data.code === 0) {
            message.success("注册成功");
            window.localStorage.setItem("userId", data.data?.userId);
            window.localStorage.setItem("token", data.data?.token);
            navigate("/");
            return;
          } else {
            message.error(data?.message);
          }
        });
      },
      (err) => {
        message.warn(err);
        return;
      }
    );
  };

  const formRef = useRef<any>();

  return (
    <div
      style={{
        width: "100%",
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Form
        style={{ width: 400, height: 200 }}
        ref={(_formRef) => (formRef.current = _formRef)}
        name="basic"
        labelCol={{ span: 8 }}
        wrapperCol={{ span: 16 }}
        initialValues={{ remember: true }}
        autoComplete="off"
      >
        <Form.Item
          label="UserName"
          name="username"
          rules={[{ required: true, message: "Please input your username!" }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="Password"
          name="password"
          rules={[{ required: true, message: "Please input your password!" }]}
        >
          <Input.Password />
        </Form.Item>

        <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
          <Row gutter={12} style={{display:'flex',justifyContent:'center'}}>
            <Col>
              <Button type="primary" onClick={handleLogin}>
                登录
              </Button>
            </Col>
            <Col>
              <Button type="primary" onClick={handleRegist}>
                注册
              </Button>
            </Col>
          </Row>
        </Form.Item>
      </Form>
    </div>
  );
};
