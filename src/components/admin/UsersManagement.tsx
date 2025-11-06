import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, UserPlus, UserMinus } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type UserWithRoles = {
  id: string;
  email: string;
  created_at: string;
  roles: string[];
};

export const UsersManagement = () => {
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [bulkRole, setBulkRole] = useState<string>("");
  const { toast } = useToast();

  const fetchUsers = async () => {
    try {
      // Fetch all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, email, created_at")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch all user roles
      const { data: userRoles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) throw rolesError;

      // Combine data
      const usersWithRoles: UserWithRoles[] = (profiles || []).map((profile) => ({
        id: profile.id,
        email: profile.email || "No email",
        created_at: profile.created_at,
        roles: (userRoles || [])
          .filter((ur) => ur.user_id === profile.id)
          .map((ur) => ur.role),
      }));

      setUsers(usersWithRoles);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addRole = async (userId: string, role: string) => {
    try {
      const { error } = await supabase
        .from("user_roles")
        .insert([{ user_id: userId, role: role as 'admin' | 'moderator' | 'user' }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Role ${role} added successfully`,
      });

      fetchUsers();
    } catch (error) {
      console.error("Error adding role:", error);
      toast({
        title: "Error",
        description: "Failed to add role",
        variant: "destructive",
      });
    }
  };

  const removeRole = async (userId: string, role: string) => {
    try {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .match({ user_id: userId, role: role });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Role ${role} removed successfully`,
      });

      fetchUsers();
    } catch (error) {
      console.error("Error removing role:", error);
      toast({
        title: "Error",
        description: "Failed to remove role",
        variant: "destructive",
      });
    }
  };

  const toggleUserSelection = (userId: string) => {
    const newSelection = new Set(selectedUsers);
    if (newSelection.has(userId)) {
      newSelection.delete(userId);
    } else {
      newSelection.add(userId);
    }
    setSelectedUsers(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedUsers.size === users.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(users.map(u => u.id)));
    }
  };

  const handleBulkAddRole = async () => {
    if (!bulkRole || selectedUsers.size === 0) {
      toast({
        title: "Error",
        description: "Please select users and a role",
        variant: "destructive",
      });
      return;
    }

    try {
      const insertPromises = Array.from(selectedUsers).map(userId =>
        supabase.from("user_roles").insert([{
          user_id: userId,
          role: bulkRole as 'admin' | 'moderator' | 'user'
        }])
      );

      await Promise.all(insertPromises);

      toast({
        title: "Success",
        description: `Added ${bulkRole} role to ${selectedUsers.size} user(s)`,
      });

      setSelectedUsers(new Set());
      setBulkRole("");
      fetchUsers();
    } catch (error) {
      console.error("Error in bulk add:", error);
      toast({
        title: "Error",
        description: "Some roles may not have been added",
        variant: "destructive",
      });
    }
  };

  const handleBulkRemoveRole = async () => {
    if (!bulkRole || selectedUsers.size === 0) {
      toast({
        title: "Error",
        description: "Please select users and a role",
        variant: "destructive",
      });
      return;
    }

    try {
      const deletePromises = Array.from(selectedUsers).map(userId =>
        supabase
          .from("user_roles")
          .delete()
          .match({ user_id: userId, role: bulkRole })
      );

      await Promise.all(deletePromises);

      toast({
        title: "Success",
        description: `Removed ${bulkRole} role from ${selectedUsers.size} user(s)`,
      });

      setSelectedUsers(new Set());
      setBulkRole("");
      fetchUsers();
    } catch (error) {
      console.error("Error in bulk remove:", error);
      toast({
        title: "Error",
        description: "Some roles may not have been removed",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {selectedUsers.size > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Bulk Actions</CardTitle>
            <CardDescription>
              {selectedUsers.size} user(s) selected
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-end gap-4">
              <div className="flex-1 min-w-[200px]">
                <label className="text-sm font-medium mb-2 block">
                  Select Role
                </label>
                <Select value={bulkRole} onValueChange={setBulkRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="moderator">Moderator</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleBulkAddRole}
                disabled={!bulkRole}
                className="gap-2"
              >
                <UserPlus className="h-4 w-4" />
                Add Role to Selected
              </Button>
              <Button
                onClick={handleBulkRemoveRole}
                disabled={!bulkRole}
                variant="destructive"
                className="gap-2"
              >
                <UserMinus className="h-4 w-4" />
                Remove Role from Selected
              </Button>
              <Button
                onClick={() => setSelectedUsers(new Set())}
                variant="outline"
              >
                Clear Selection
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={selectedUsers.size === users.length && users.length > 0}
                onCheckedChange={toggleSelectAll}
                aria-label="Select all users"
              />
            </TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Roles</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>
                <Checkbox
                  checked={selectedUsers.has(user.id)}
                  onCheckedChange={() => toggleUserSelection(user.id)}
                  aria-label={`Select ${user.email}`}
                />
              </TableCell>
              <TableCell className="font-medium">{user.email}</TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-2">
                  {user.roles.length > 0 ? (
                    user.roles.map((role) => (
                      <Badge key={role} variant="secondary">
                        {role}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">No roles</span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                {new Date(user.created_at).toLocaleDateString()}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Select onValueChange={(role) => addRole(user.id, role)}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Add role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="moderator">Moderator</SelectItem>
                      <SelectItem value="user">User</SelectItem>
                    </SelectContent>
                  </Select>
                  {user.roles.length > 0 && (
                    <Select onValueChange={(role) => removeRole(user.id, role)}>
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Remove" />
                      </SelectTrigger>
                      <SelectContent>
                        {user.roles.map((role) => (
                          <SelectItem key={role} value={role}>
                            {role}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
