import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/card";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import { Separator } from "@repo/ui/separator";
import { ScrollArea } from "@repo/ui/scroll-area";

export const Route = createFileRoute("/monitoring")({
  component: MonitoringPage,
});

interface WebSocketMessage {
  type: "order" | "user" | "product" | "system" | "error";
  timestamp: string;
  data: Record<string, unknown>;
}

interface ConnectionStats {
  connected: boolean;
  reconnectAttempts: number;
  lastConnected: string | null;
  messagesReceived: number;
}

function MonitoringPage() {
  const [messages, setMessages] = useState<WebSocketMessage[]>([]);
  const [stats, setStats] = useState<ConnectionStats>({
    connected: false,
    reconnectAttempts: 0,
    lastConnected: null,
    messagesReceived: 0,
  });
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const connect = useCallback(() => {
    const wsUrl = import.meta.env.VITE_WS_URL || "ws://localhost:8080/ws";

    try {
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        setStats((prev) => ({
          ...prev,
          connected: true,
          reconnectAttempts: 0,
          lastConnected: new Date().toISOString(),
        }));
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as WebSocketMessage;
          setMessages((prev) => [message, ...prev].slice(0, 100));
          setStats((prev) => ({
            ...prev,
            messagesReceived: prev.messagesReceived + 1,
          }));
        } catch {
          console.error("Failed to parse WebSocket message");
        }
      };

      ws.onclose = () => {
        setStats((prev) => ({ ...prev, connected: false }));
        reconnectTimeoutRef.current = setTimeout(() => {
          setStats((prev) => ({
            ...prev,
            reconnectAttempts: prev.reconnectAttempts + 1,
          }));
          connect();
        }, Math.min(1000 * Math.pow(2, stats.reconnectAttempts), 30000));
      };

      ws.onerror = () => {
        setStats((prev) => ({ ...prev, connected: false }));
      };

      wsRef.current = ws;
    } catch {
      console.error("Failed to connect to WebSocket");
    }
  }, [stats.reconnectAttempts]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  const typeColors: Record<WebSocketMessage["type"], string> = {
    order: "bg-blue-500",
    user: "bg-green-500",
    product: "bg-purple-500",
    system: "bg-yellow-500",
    error: "bg-red-500",
  };

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Real-time Monitoring
            </h1>
            <p className="text-muted-foreground">
              Live WebSocket event stream
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant={stats.connected ? "default" : "destructive"}>
              {stats.connected ? "Connected" : "Disconnected"}
            </Badge>
            <Button
              variant="outline"
              onClick={() => {
                if (wsRef.current) {
                  wsRef.current.close();
                }
                connect();
              }}
            >
              Reconnect
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div
                  className={`h-3 w-3 rounded-full ${
                    stats.connected ? "bg-green-500" : "bg-red-500"
                  }`}
                />
                <span className="font-medium">
                  {stats.connected ? "Online" : "Offline"}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Messages Received</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.messagesReceived}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Reconnect Attempts</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.reconnectAttempts}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Last Connected</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-medium">
                {stats.lastConnected
                  ? new Date(stats.lastConnected).toLocaleTimeString()
                  : "Never"}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Event Stream</CardTitle>
                <CardDescription>
                  Last 100 events ({messages.length} shown)
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMessages([])}
              >
                Clear
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px]">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <p>No events received yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {messages.map((message, index) => (
                    <div
                      key={`${message.timestamp}-${index}`}
                      className="p-3 rounded-lg border bg-muted/50"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div
                            className={`h-2 w-2 rounded-full ${typeColors[message.type]}`}
                          />
                          <span className="font-medium capitalize">
                            {message.type}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <pre className="text-xs bg-background p-2 rounded overflow-x-auto">
                        {JSON.stringify(message.data, null, 2)}
                      </pre>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        <Separator className="my-8" />

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Event Types</CardTitle>
              <CardDescription>Filter by event category</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {(["order", "user", "product", "system", "error"] as const).map(
                  (type) => {
                    const count = messages.filter(
                      (m) => m.type === type
                    ).length;
                    return (
                      <Badge
                        key={type}
                        variant="outline"
                        className="cursor-pointer hover:bg-muted"
                      >
                        <div
                          className={`h-2 w-2 rounded-full mr-2 ${typeColors[type]}`}
                        />
                        {type} ({count})
                      </Badge>
                    );
                  }
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Connection Info</CardTitle>
              <CardDescription>WebSocket connection details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">URL</span>
                <code className="text-xs">
                  {import.meta.env.VITE_WS_URL || "ws://localhost:8080/ws"}
                </code>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Protocol</span>
                <span>WebSocket</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Buffer Size</span>
                <span>100 messages</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
