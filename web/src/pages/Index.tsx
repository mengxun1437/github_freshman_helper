import { IndexTabs } from "../components/IndexTabs";
import { Panel } from "../components/Panel";

export const Index = () => {
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
