import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";
import { VoiceButton } from "./VoiceButton";

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
}

export function ChatInput({ onSend, isLoading }: ChatInputProps) {
  const [input, setInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSend(input.trim());
      setInput("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleTranscription = (text: string) => {
    setInput(text);
  };

  return (
    <form onSubmit={handleSubmit} className="border-t bg-card p-4 backdrop-blur-sm">
      <div className="flex gap-2 max-w-4xl mx-auto">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message or use voice... (Shift + Enter for new line)"
          className="min-h-[60px] max-h-[200px] resize-none bg-background/50 border-border/50 focus:border-primary/50 transition-colors"
          disabled={isLoading}
        />
        <VoiceButton
          onTranscription={handleTranscription}
          disabled={isLoading}
        />
        <Button
          type="submit"
          size="icon"
          className="h-[60px] w-[60px] flex-shrink-0 bg-gradient-to-r from-primary to-primary-glow hover:shadow-glow transition-all"
          disabled={isLoading || !input.trim()}
        >
          <Send className="h-5 w-5" />
        </Button>
      </div>
    </form>
  );
}