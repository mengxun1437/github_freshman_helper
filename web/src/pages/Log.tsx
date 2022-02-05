import { useState, useEffect } from "react";
import { useParams } from "react-router";

export const Log = () => {
  const { logId } = useParams();
  const [logUrl,setLogUrl] = useState('')

  useEffect(()=>{
      // 每10秒刷新
    setInterval(()=>{
        setLogUrl(`http://api.mengxun.online/proxy/gfh-qiniu/log/${logId}.log?timestamp=${new Date().getTime()}`)
    },8000)
  },[])

  useEffect(()=>{
    window.scrollTo(0,(document.getElementById('log-iframe') as any)?.contentWindow?.document?.getElementsByTagName('pre')?.[0]?.scrollHeight)  
  },[logUrl])


  return (
    <div style={{ height: window.innerHeight, backgroundColor: "gray",color:"white" }}>
      <iframe
          id='log-iframe'
          width="100%"
          height={`${window.innerHeight}px`}
          src={logUrl || `http://api.mengxun.online/proxy/gfh-qiniu/log/${logId}.log?timestamp=${new Date().getTime()}` }
        />
    </div>
  );
};
