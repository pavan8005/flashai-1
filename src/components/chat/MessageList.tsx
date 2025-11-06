import { MessageBubble } from "./MessageBubble";
import { Loader2 } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  created_at: string;
}

interface MessageListProps {
  messages: Message[];
  isStreaming: boolean;
}

export function MessageList({ messages, isStreaming }: MessageListProps) {
  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <div className="text-center space-y-2">
          <p className="text-lg">Start a conversation</p>
          <p className="text-sm">Send a message to begin chatting with AI</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}
      {isStreaming && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">AI is thinking...</span>
        </div>
      )}
    </>
  );
}