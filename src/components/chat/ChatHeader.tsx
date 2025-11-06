import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Settings, Trash2, Sparkles, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Conversation {
  id: string;
  title: string;
  model: string;
  provider: string;
}

interface ChatHeaderProps {
  conversation: Conversation;
  onClear: () => void;
}

export function ChatHeader({ conversation, onClear }: ChatHeaderProps) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdminRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.rpc('has_role', {
          _user_id: user.id,
          _role: 'admin'
        });
        setIsAdmin(data || false);
      }
    };
    checkAdminRole();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed out",
      description: "You've been signed out successfully.",
    });
  };

  return (
    <div className="border-b border-border/50 bg-card/50 backdrop-blur-sm">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center shadow-glow">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-lg font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              Flash.ai
            </h2>
            <p className="text-xs text-muted-foreground">
              {conversation.model} • Voice enabled
            </p>
          </div>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="hover:bg-primary/10 transition-colors">
              <Settings className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-card/95 backdrop-blur-sm">
            <DropdownMenuLabel>Conversation</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onClear} className="hover:bg-primary/10">
              <Trash2 className="mr-2 h-4 w-4" />
              Clear Messages
            </DropdownMenuItem>
            {isAdmin && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/admin')} className="hover:bg-primary/10">
                  <Shield className="mr-2 h-4 w-4" />
                  Admin Dashboard
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="hover:bg-destructive/10">
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}