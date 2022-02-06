import { useState, useEffect } from 'react';
import { useParams } from "react-router";
import { BASE_QINIU_URL } from "../common";

const getNewLogUrl = (logId: any) => `${BASE_QINIU_URL}/log/${logId}.log?timestamp=${new Date().getTime()}`

export const Log = () => {
  const { logId } = useParams();
  const [logUrl, setLogUrl] = useState("");

  useEffect(() => {
    if(!logId) return
    setLogUrl(getNewLogUrl(logId))
  }, [logId]);

  return (
    <div
      style={{
        height: window.innerHeight,
        backgroundColor: "grey",
      }}
    >
      <iframe
        id="log-iframe"
        width="100%"
        height={`${window.innerHeight}px`}
        src={logUrl}
      />
    </div>
  );
};
