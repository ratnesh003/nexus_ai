import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../services/mockDb";
import { Button, Input, Card, Icons } from "./ui";

interface AuthPageProps {
  mode: "login" | "register";
}

const AuthPage: React.FC<AuthPageProps> = ({ mode }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate API call delay
    setTimeout(() => {
      const user = db.login(email, name);
      if (user) {
        navigate("/projects");
      }
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md p-8 space-y-6 shadow-xl">
        <div className="text-center space-y-2">
          <div className="h-12 w-12 rounded bg-accent flex items-center justify-center text-white font-bold text-xl mx-auto">
            D
          </div>
          <h1 className="text-2xl font-bold">
            {mode === "login" ? "Welcome back" : "Create an account"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {mode === "login"
              ? "Enter your email to sign in to your account"
              : "Enter your email below to create your account"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "register" && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Full Name</label>
              <Input
                required
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          )}
          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <Input
              required
              type="email"
              placeholder="m@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <Button className="w-full" type="submit" disabled={isLoading}>
            {isLoading && <Icons.Spinner />}
            <span className="ml-2">
              {mode === "login" ? "Sign In" : "Create Account"}
            </span>
          </Button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-muted-foreground">
              Or continue with
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Button
            variant="secondary"
            onClick={() => alert("GitHub Auth requires backend configuration.")}
          >
            GitHub
          </Button>
          <Button
            variant="secondary"
            onClick={() => alert("Google Auth requires backend configuration.")}
          >
            Google
          </Button>
        </div>

        <div className="text-center text-sm">
          {mode === "login" ? (
            <span className="text-slate-500">
              Don't have an account?{" "}
              <a href="#/register" className="text-accent hover:underline">
                Sign up
              </a>
            </span>
          ) : (
            <span className="text-slate-500">
              Already have an account?{" "}
              <a href="#/login" className="text-accent hover:underline">
                Sign in
              </a>
            </span>
          )}
        </div>
      </Card>
    </div>
  );
};

export default AuthPage;
