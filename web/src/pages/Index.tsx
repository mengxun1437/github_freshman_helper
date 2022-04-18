import { IndexTabs } from "../components/IndexTabs";
import { Panel } from "../components/Panel";
import { useEffect } from "react";
import { USER_TOKEN } from "../api/api";
import { notification, Button } from "antd";
import { useNavigate } from "react-router-dom";

export const Index = () => {
  const navigate = useNavigate();
  useEffect(() => {
    USER_TOKEN().then((data: any) => {
      if (!data?.data?.checked) {
        const key = `open${Date.now()}`;
        notification.warning({
          message: "Login In",
          description: "Please Login In, or you can not show your star issues",
          btn: (
            <Button
              type="primary"
              size="small"
              onClick={() => {
                notification.close(key);
                navigate("/login");
              }}
            >
              Go to Login In
            </Button>
          ),
          key,
        });
      }
    });
  }, []);
  return (
    <div
      style={{
        minHeight: "100vh",
      }}
    >
      <Panel style={{ marginTop: 20 }} />
      <IndexTabs />
    </div>
  );
};
