"use client";

import { useState, useEffect } from "react";
import { getFunctions, httpsCallable, type Functions } from "firebase/functions";
import { getClientServices } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function TestTokenPage() {
  const { user, loading: authLoading } = useAuth();
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [functions, setFunctions] = useState<Functions | null>(null);

  useEffect(() => {
    // Ініціалізуємо сервіси тільки на клієнті
    if (typeof window !== "undefined") {
      const { functions: funcs } = getClientServices();
      setFunctions(funcs);
    }
  }, []);

  async function handleGetToken() {
    if (!functions) {
      setError("Firebase Functions service is not available.");
      return;
    }
    if (!user) {
      setError("You must be logged in to get a token.");
      return;
    }

    setLoading(true);
    setError(null);
    setToken("");

    try {
      const callable = httpsCallable(functions, "getVideoSDKToken");
      const res = await callable();
      const data = res.data as { token: string };
      setToken(data.token);
    } catch (err: any) {
      console.error("Error fetching token:", err);
      setError(err.message || "An unknown error occurred.");
    } finally {
      setLoading(false);
    }
  }
  
  if (authLoading) {
    return <div className="p-10">Loading user...</div>
  }

  return (
    <div className="p-10 space-y-6">
       <h1 className="text-2xl font-bold font-headline">VideoSDK Token Test</h1>
       {!user ? (
         <p className="text-red-600">Please log in to perform this test.</p>
       ) : (
        <Button onClick={handleGetToken} disabled={loading || !functions}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Get VideoSDK Token
        </Button>
       )}

      {error && (
         <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            <h3 className="font-bold">Error:</h3>
            <p>{error}</p>
        </div>
      )}

      {token && (
        <div>
            <h3 className="font-bold mb-2">Successfully fetched token:</h3>
            <pre
            style={{
                marginTop: 20,
                background: "#eee",
                padding: 20,
                borderRadius: 6,
                wordBreak: "break-all",
                whiteSpace: "pre-wrap"
            }}
            >
            {token}
            </pre>
        </div>
      )}
    </div>
  );
}
