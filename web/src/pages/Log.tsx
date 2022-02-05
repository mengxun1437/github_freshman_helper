import { Spin } from "antd";
import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router";
import { GET_SOURCE_FROM_QINIU } from "../api/api";
import hljs from "highlight.js";
import "highlight.js/styles/default.css";

export const Log = () => {
  const { logId } = useParams();
  const [pageLoading, setPageLoading] = useState(true);
  const [content, setContent] = useState<string>("");
  const codeRef = useRef<any>();

  useEffect(() => {
    if (!logId) return;
    GET_SOURCE_FROM_QINIU("log", logId)
      .then((data: any) => {
        setContent(data);
      })
      .catch(() => {
        setContent("can not found this log file~");
      })
      .finally(() => {
        setPageLoading(false);
        try {
          hljs.highlightBlock(codeRef.current);
        } catch (e) {
          console.log(e);
        }
      });
  }, [logId]);

  return (
    <div style={{height:window.innerHeight, backgroundColor:"black"}} >
      {pageLoading ? (
        <div
          style={{
            height: window.innerHeight,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Spin />
        </div>
      ) : (
        <pre>
          <code style={{height:window.innerHeight, backgroundColor:"black"}} ref={codeRef}>{content}</code>
        </pre>
      )}
    </div>
  );
};
