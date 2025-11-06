import { cn } from "@/lib/utils";
import { Bot, User, Sparkles } from "lucide-react";
import { SpeakButton } from "./VoiceButton";

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  created_at: string;
}

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        "flex gap-3 group animate-in fade-in slide-in-from-bottom-4 duration-500",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {!isUser && (
        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center shadow-glow">
          <Sparkles className="w-5 h-5 text-primary-foreground" />
        </div>
      )}
      
      <div className="flex flex-col gap-1">
        <div
          className={cn(
            "max-w-[70%] rounded-2xl px-4 py-3 shadow-lg backdrop-blur-sm transition-all",
            isUser
              ? "bg-gradient-to-r from-primary to-primary-glow text-primary-foreground shadow-primary/20"
              : "bg-card/80 text-card-foreground border border-border/50 shadow-elegant"
          )}
        >
          <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{message.content}</p>
        </div>
        {!isUser && (
          <div className="flex items-center gap-1 px-2">
            <SpeakButton text={message.content} />
          </div>
        )}
      </div>
      
      {isUser && (
        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-accent/20 backdrop-blur-sm flex items-center justify-center border border-accent/50">
          <User className="w-5 h-5 text-accent-foreground" />
        </div>
      )}
    </div>
  );
}