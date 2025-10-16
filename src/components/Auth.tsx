import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Dices } from "lucide-react";
import { z } from "zod";

const authSchema = z.object({
  email: z
    .string()
    .trim()
    .email({ message: "Please enter a valid email address" })
    .max(255, { message: "Email must be less than 255 characters" }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters" })
    .max(100, { message: "Password must be less than 100 characters" }),
});

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (loading) return; // Prevent double submission
    
    setLoading(true);

    try {
      if (import.meta.env.DEV) {
        console.log("Auth attempt:", { isLogin });
      }
      
      // Validate input
      const validation = authSchema.safeParse({ email, password });
      if (!validation.success) {
        const firstError = validation.error.issues[0];
        if (import.meta.env.DEV) {
          console.error("Validation error:", firstError);
        }
        setLoading(false);
        toast({
          title: "Validation error",
          description: firstError.message,
          variant: "destructive",
        });
        return;
      }

      if (import.meta.env.DEV) {
        console.log("Validation passed, attempting", isLogin ? "sign in" : "sign up");
      }

      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email: validation.data.email,
          password: validation.data.password,
        });
        
        if (error) {
          if (import.meta.env.DEV) {
            console.error("Sign in error:", error);
          }
          // Provide more helpful error messages
          if (error.message.includes("Invalid login credentials")) {
            throw new Error("Invalid email or password. Please check your credentials or sign up if you don't have an account.");
          }
          throw error;
        }
        
        if (import.meta.env.DEV) {
          console.log("Sign in successful");
        }
        toast({
          title: "Welcome back!",
          description: "Successfully signed in.",
        });
      } else {
        const { error } = await supabase.auth.signUp({
          email: validation.data.email,
          password: validation.data.password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
          },
        });
        
        if (error) {
          if (import.meta.env.DEV) {
            console.error("Sign up error:", error);
          }
          // Handle specific signup errors
          if (error.message.includes("User already registered")) {
            throw new Error("An account with this email already exists. Please sign in instead.");
          }
          throw error;
        }
        
        if (import.meta.env.DEV) {
          console.log("Sign up successful");
        }
        toast({
          title: "Account created!",
          description: "You can now sign in with your credentials.",
        });
        setIsLogin(true); // Switch to login mode
        setPassword(""); // Clear password
      }
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.error("Auth error caught:", error);
      }
      toast({
        title: isLogin ? "Sign in failed" : "Sign up failed",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      if (import.meta.env.DEV) {
        console.log("Auth flow complete");
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-elegant">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Dices className="w-12 h-12 text-primary" />
          </div>
          <CardTitle className="text-3xl">D&D Campaign Manager</CardTitle>
          <CardDescription>
            {isLogin ? "Sign in to your account" : "Create a new account"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
              <p className="text-xs text-muted-foreground">
                Minimum 6 characters
              </p>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Loading..." : isLogin ? "Sign In" : "Sign Up"}
            </Button>
          </form>
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              {isLogin
                ? "Don't have an account? Sign up"
                : "Already have an account? Sign in"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
