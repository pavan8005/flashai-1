import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, MessageSquare, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Conversation {
  id: string;
  title: string;
  model: string;
  provider: string;
  updated_at: string;
}

interface ConversationSidebarProps {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  onSelectConversation: (conversation: Conversation) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
}

export function ConversationSidebar({
  conversations,
  currentConversation,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
}: ConversationSidebarProps) {
  return (
    <div className="w-80 border-r border-border/50 bg-card/30 backdrop-blur-sm flex flex-col">
      <div className="p-4 border-b border-border/50">
        <Button
          onClick={onNewConversation}
          className="w-full bg-gradient-to-r from-primary to-primary-glow hover:shadow-glow transition-all"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Conversation
        </Button>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {conversations.map((conversation) => (
            <div
              key={conversation.id}
              className={cn(
                "group flex items-center gap-2 p-3 rounded-lg cursor-pointer hover:bg-primary/10 transition-all",
                currentConversation?.id === conversation.id && "bg-primary/20 border border-primary/50 shadow-sm"
              )}
              onClick={() => onSelectConversation(conversation)}
            >
              <MessageSquare className="h-4 w-4 flex-shrink-0 text-primary" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{conversation.title}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(conversation.updated_at).toLocaleDateString()}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/20"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteConversation(conversation.id);
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}