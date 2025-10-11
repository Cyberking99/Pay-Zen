"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DollarSign, LinkIcon, Shield, Wallet } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useIsRegistered } from "@/hooks/use-blockchain";
import { getAccessToken, useLogin } from "@privy-io/react-auth";

export function AuthView() {
  const { login, accountLogin, user, primaryWallet, authenticated } = useAuth();
  const [isConnecting, setIsConnecting] = useState(false);
  const router = useRouter();
  const { isRegistered, loading: regLoading } = useIsRegistered();

  const { login: privyLogin } = useLogin({
    onError: (error) => {
      console.error("Login error:", error);
    },
    onComplete: async () => {
      console.log("Login complete");
      /*const privyToken = await getAccessToken()
        console.log("privyToken", privyToken)
        await accountLogin({
          walletAddress: primaryWallet?.address || "",
          privyToken: privyToken || "",
        })*/
    },
  });

  const handleConnect = async () => {
    try {
      setIsConnecting(true);

      // wait for login to complete
      privyLogin();

      // if (!authenticated) {
      //   console.log("Login failed")
      // }

      // check if user is registered

      // console.log("User is Registered", isRegistered)
      // if (authenticated) {
      //   const privyToken = await getAccessToken()
      //   console.log("privyToken", privyToken)
      //   await accountLogin({
      //     walletAddress: primaryWallet?.address || "",
      //     privyToken: privyToken || "",
      //   })
      // }
    } catch (error) {
      console.error("Login failed:", error);
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto glass-effect border-teal-500/20">
      <CardHeader className="text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center">
          <Wallet className="h-8 w-8 text-white" />
        </div>
        <div>
          <CardTitle className="text-2xl font-bold text-white">
            Welcome to PayZen
          </CardTitle>
          <CardDescription className="text-slate-400">
            Secure stablecoin payments powered by blockchain technology
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
            <Shield className="h-5 w-5 text-teal-400" />
            <div>
              <p className="text-sm font-medium text-white">
                Secure Authentication
              </p>
              <p className="text-xs text-slate-400">
                Protected by Privy wallet integration
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
            <DollarSign className="h-5 w-5 text-emerald-400" />
            <div>
              <p className="text-sm font-medium text-white">
                Stablecoin Payments
              </p>
              <p className="text-xs text-slate-400">
                Send and receive USDC with ease
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
            <LinkIcon className="h-5 w-5 text-amber-400" />
            <div>
              <p className="text-sm font-medium text-white">Payment Links</p>
              <p className="text-xs text-slate-400">
                Generate custom payment links
              </p>
            </div>
          </div>
        </div>

        <Button
          onClick={handleConnect}
          disabled={isConnecting}
          className="w-full gradient-primary text-white font-medium"
        >
          {isConnecting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Connecting...
            </>
          ) : (
            <>
              <Wallet className="mr-2 h-4 w-4" />
              Connect with Privy
            </>
          )}
        </Button>

        <p className="text-xs text-center text-slate-500">
          By connecting, you agree to our Terms of Service and Privacy Policy
        </p>
      </CardContent>
    </Card>
  );
}
