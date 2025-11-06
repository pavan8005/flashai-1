import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ChatInput } from "./ChatInput";
import { MessageList } from "./MessageList";
import { ChatHeader } from "./ChatHeader";
import { ConversationSidebar } from "./ConversationSidebar";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  created_at: string;
}

interface Conversation {
  id: string;
  title: string;
  model: string;
  provider: string;
  updated_at: string;
}

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (currentConversation) {
      loadMessages(currentConversation.id);
      subscribeToMessages(currentConversation.id);
    }
  }, [currentConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadConversations = async () => {
    const { data, error } = await supabase
      .from("conversations")
      .select("*")
      .order("updated_at", { ascending: false });

    if (error) {
      toast({
        title: "Error loading conversations",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setConversations(data || []);
    if (data && data.length > 0 && !currentConversation) {
      setCurrentConversation(data[0]);
    }
  };

  const loadMessages = async (conversationId: string) => {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (error) {
      toast({
        title: "Error loading messages",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setMessages((data || []) as Message[]);
  };

  const subscribeToMessages = (conversationId: string) => {
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const createNewConversation = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("conversations")
      .insert({
        user_id: user.id,
        title: "New Conversation",
      })
      .select()
      .single();

    if (error) {
      toast({
        title: "Error creating conversation",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setConversations([data, ...conversations]);
    setCurrentConversation(data);
    setMessages([]);
  };

  const deleteConversation = async (id: string) => {
    const { error } = await supabase
      .from("conversations")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        title: "Error deleting conversation",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    const updatedConversations = conversations.filter((c) => c.id !== id);
    setConversations(updatedConversations);
    
    if (currentConversation?.id === id) {
      setCurrentConversation(updatedConversations[0] || null);
      setMessages([]);
    }
  };

  const sendMessage = async (content: string) => {
    if (!currentConversation) {
      await createNewConversation();
      return;
    }

    setIsLoading(true);
    setIsStreaming(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Add user message to database
    const { error: messageError } = await supabase
      .from("messages")
      .insert({
        conversation_id: currentConversation.id,
        role: "user",
        content,
      });

    if (messageError) {
      toast({
        title: "Error sending message",
        description: messageError.message,
        variant: "destructive",
      });
      setIsLoading(false);
      setIsStreaming(false);
      return;
    }

    // Call edge function for AI response
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-stream`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            conversation_id: currentConversation.id,
            model: currentConversation.model,
          }),
        }
      );

      if (!response.ok || !response.body) {
        throw new Error("Failed to start stream");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = "";
      let textBuffer = "";
      let streamDone = false;

      // Add temporary assistant message
      const tempMessageId = `temp-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        {
          id: tempMessageId,
          role: "assistant",
          content: "",
          created_at: new Date().toISOString(),
        },
      ]);

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") {
            streamDone = true;
            break;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            
            if (content) {
              assistantMessage += content;
              // Update the temporary message
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === tempMessageId
                    ? { ...m, content: assistantMessage }
                    : m
                )
              );
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Save final assistant message to database
      const { error: assistantError } = await supabase
        .from("messages")
        .insert({
          conversation_id: currentConversation.id,
          role: "assistant",
          content: assistantMessage,
        });

      if (assistantError) {
        console.error("Error saving assistant message:", assistantError);
      }

      // Remove temp message after real one is saved
      setMessages((prev) => prev.filter((m) => m.id !== tempMessageId));

      // Update conversation last_message_at
      await supabase
        .from("conversations")
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", currentConversation.id);
        
    } catch (error) {
      console.error("Error in chat stream:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to get response",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
    }
  };

  const clearConversation = async () => {
    if (!currentConversation) return;

    const { error } = await supabase
      .from("messages")
      .delete()
      .eq("conversation_id", currentConversation.id);

    if (error) {
      toast({
        title: "Error clearing conversation",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setMessages([]);
  };

  if (!currentConversation && conversations.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-background via-background to-primary/10">
        <div className="text-center space-y-6 p-8">
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center shadow-glow animate-pulse">
              <Loader2 className="w-10 h-10 text-primary-foreground animate-spin" />
            </div>
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
            Welcome to Flash.ai
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Start a new conversation to begin chatting with AI. Use voice or text!
          </p>
          <button
            onClick={createNewConversation}
            className="px-8 py-4 bg-gradient-to-r from-primary to-primary-glow text-primary-foreground rounded-xl hover:shadow-glow transition-all font-medium"
          >
            Start Your First Chat
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-background via-background to-primary/5">
      <ConversationSidebar
        conversations={conversations}
        currentConversation={currentConversation}
        onSelectConversation={(conv) => setCurrentConversation(conv)}
        onNewConversation={createNewConversation}
        onDeleteConversation={deleteConversation}
      />
      
      <div className="flex-1 flex flex-col">
        {currentConversation && (
          <>
            <ChatHeader
              conversation={currentConversation}
              onClear={clearConversation}
            />
            
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-background/50">
              <MessageList messages={messages} isStreaming={isStreaming} />
              <div ref={messagesEndRef} />
            </div>
            
            <ChatInput onSend={sendMessage} isLoading={isLoading} />
          </>
        )}
      </div>
    </div>
  );
}