import { useToast } from "@chakra-ui/react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useEffect, useState } from "react";

export type Message = {
  message: string;
  details: string;
  ts: Date;
};

const useWebsocket = (): { lastHeartbeat: number; messages: Message[] } => {
  const { publicKey } = useWallet();
  const [lastHeartbeat, setLastHeartbeat] = useState(Date.now());
  const [messages, setMessages] = useState<Message[]>([]);
  const toast = useToast();

  const notifyAction = (message: Message) => {
    toast({
      title: message.message,
      description: message.details,
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
          const m = msg as Message;
          m.ts = new Date();
          notifyAction(m);
          setMessages([...messages, m]);
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
    messages,
  };
};

export default useWebsocket;
