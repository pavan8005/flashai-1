import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Loader2, Users, Shield, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UsersManagement } from "@/components/admin/UsersManagement";
import { RolesManagement } from "@/components/admin/RolesManagement";
import { useToast } from "@/hooks/use-toast";

const Admin = () => {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          navigate("/");
          return;
        }

        // Check if user has admin role using RPC call
        const { data, error } = await supabase.rpc('has_role', {
          _user_id: user.id,
          _role: 'admin'
        });

        if (error) {
          console.error("Error checking admin role:", error);
          toast({
            title: "Access Denied",
            description: "Unable to verify admin privileges",
            variant: "destructive",
          });
          navigate("/");
          return;
        }

        if (!data) {
          toast({
            title: "Access Denied",
            description: "You don't have permission to access this page",
            variant: "destructive",
          });
          navigate("/");
          return;
        }

        setIsAdmin(true);
      } catch (error) {
        console.error("Error in admin check:", error);
        navigate("/");
      } finally {
        setLoading(false);
      }
    };

    checkAdminAccess();
  }, [navigate, toast]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/")}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-2">
                <Shield className="h-6 w-6 text-primary" />
                <h1 className="text-2xl font-bold">Admin Dashboard</h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>System Management</CardTitle>
            <CardDescription>
              Manage users, roles, and system settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="users" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="users">
                  <Users className="mr-2 h-4 w-4" />
                  Users
                </TabsTrigger>
                <TabsTrigger value="roles">
                  <Shield className="mr-2 h-4 w-4" />
                  Roles
                </TabsTrigger>
              </TabsList>
              <TabsContent value="users" className="mt-6">
                <UsersManagement />
              </TabsContent>
              <TabsContent value="roles" className="mt-6">
                <RolesManagement />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Admin;
