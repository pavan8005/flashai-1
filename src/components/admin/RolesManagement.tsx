import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Shield, Users, UserCog } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type RoleStats = {
  role: string;
  count: number;
  icon: React.ReactNode;
  description: string;
};

export const RolesManagement = () => {
  const [roleStats, setRoleStats] = useState<RoleStats[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchRoleStats = async () => {
      try {
        const { data, error } = await supabase
          .from("user_roles")
          .select("role");

        if (error) throw error;

        const roleCounts: Record<string, number> = {};
        (data || []).forEach((item) => {
          roleCounts[item.role] = (roleCounts[item.role] || 0) + 1;
        });

        const stats: RoleStats[] = [
          {
            role: "admin",
            count: roleCounts.admin || 0,
            icon: <Shield className="h-8 w-8 text-primary" />,
            description: "Full system access and user management",
          },
          {
            role: "moderator",
            count: roleCounts.moderator || 0,
            icon: <UserCog className="h-8 w-8 text-primary" />,
            description: "Content moderation and user support",
          },
          {
            role: "user",
            count: roleCounts.user || 0,
            icon: <Users className="h-8 w-8 text-primary" />,
            description: "Standard user access",
          },
        ];

        setRoleStats(stats);
      } catch (error) {
        console.error("Error fetching role stats:", error);
        toast({
          title: "Error",
          description: "Failed to load role statistics",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchRoleStats();
  }, [toast]);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {roleStats.map((stat) => (
        <Card key={stat.role}>
          <CardHeader>
            <div className="flex items-center justify-between">
              {stat.icon}
              <div className="text-right">
                <CardTitle className="text-3xl font-bold">{stat.count}</CardTitle>
              </div>
            </div>
            <CardTitle className="capitalize">{stat.role}s</CardTitle>
            <CardDescription>{stat.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {stat.count === 1
                ? `1 user with ${stat.role} role`
                : `${stat.count} users with ${stat.role} role`}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
