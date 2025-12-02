import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Shield, Database } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SRDDataSeeder } from "@/components/admin/SRDDataSeeder";

const AdminTools = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isDM, setIsDM] = useState(false);

  useEffect(() => {
    const checkAccess = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Check if user is a DM of any campaign
      const { data: campaigns } = await supabase
        .from("campaigns")
        .select("id")
        .eq("dm_user_id", user.id)
        .limit(1);

      setIsDM(campaigns && campaigns.length > 0);
      setLoading(false);
    };

    checkAccess();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Checking permissions...</p>
      </div>
    );
  }

  if (!isDM) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Access Denied
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              You need to be a DM to access admin tools.
            </p>
            <Button onClick={() => navigate("/")}>Go Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b p-4">
        <div className="container mx-auto flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-xl font-bold">Admin Tools</h1>
        </div>
      </header>

      <main className="container mx-auto p-6 space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <SRDDataSeeder />
          
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Database Status</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Use the SRD Data Seeder to populate missing D&D 5E reference data.
                This data is required for the character creation wizard to function properly.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default AdminTools;
