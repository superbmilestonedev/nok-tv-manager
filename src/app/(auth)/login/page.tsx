"use client";

import { Suspense, useState, useEffect, useCallback, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { brand } from "@/lib/brand";
import { PinInput } from "@/components/pin-input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") || "/";

  const [usernames, setUsernames] = useState<string[]>([]);
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/auth/users")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setUsernames(data);
      })
      .catch(() => {});
  }, []);

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      setError("");

      if (!username) {
        setError("Select your username.");
        return;
      }
      if (pin.length < 4) {
        setError("Enter your full PIN.");
        return;
      }

      setLoading(true);

      try {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, pin }),
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "That didn't work. Try again.");
          setPin("");
          return;
        }

        router.push(from);
        router.refresh();
      } catch {
        setError("Can't connect right now. Check your internet and try again.");
      } finally {
        setLoading(false);
      }
    },
    [username, pin, from, router]
  );

  const handlePinChange = useCallback((newPin: string) => {
    setPin(newPin);
    setError("");
  }, []);

  return (
    <Card className="w-full max-w-sm border-border/50 bg-card/80 backdrop-blur">
      <CardHeader className="text-center space-y-2 pb-2">
        <div className="text-5xl mb-2">{brand.defaultEmoji}</div>
        <h1 className="text-2xl font-bold tracking-tight">{brand.name} {brand.tagline}</h1>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label>Username</Label>
            <Select
              value={username}
              onValueChange={(val) => {
                setUsername(val);
                setError("");
              }}
              disabled={loading}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select your username" />
              </SelectTrigger>
              <SelectContent>
                {usernames.map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>PIN</Label>
            <PinInput
              value={pin}
              onChange={handlePinChange}
              disabled={loading}
            />
          </div>

          {error && (
            <p className="text-sm text-destructive text-center font-medium">
              {error}
            </p>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={loading || !username || pin.length < 4}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
