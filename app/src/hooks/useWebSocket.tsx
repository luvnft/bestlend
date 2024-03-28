import { useToast } from "@chakra-ui/react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useEffect, useState } from "react";

const useWebsocket = (): { lastHeartbeat: number } => {
  const { publicKey } = useWallet();
  const [lastHeartbeat, setLastHeartbeat] = useState(Date.now());
  const toast = useToast();

  const notifyAction = (title: string, description: string) => {
    toast({
      title,
      description,
      status: "success",
      duration: 10_000,
      isClosable: true,
    });
  };

  function connect() {
    if (!publicKey) return;
    const ws = new WebSocket("ws://localhost:3000/subscribe");
    console.log("connecting to websocket");

    ws.onopen = (event) => {
      ws.send(JSON.stringify({ publicKey: publicKey.toBase58() }));
    };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);

      switch (msg.type) {
        case "heartbeat":
          setLastHeartbeat(Date.now());
          break;
        case "action":
          notifyAction(msg.message, msg.details);
          break;
      }
    };

    ws.onclose = (event) => {
      console.error("ws close: ", event);
      setTimeout(connect, 10_000);
    };
  }

  useEffect(() => {
    connect();
  }, [publicKey]);

  return {
    lastHeartbeat,
  };
};

export default useWebsocket;
