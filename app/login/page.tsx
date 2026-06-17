"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import {
  getSavedCredentials,
  saveLoginCredentials,
} from "@/lib/auth-storage";
import { Loader2, User as UserIcon, Lock, Eye, EyeOff } from "lucide-react";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean(),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { login, user, isInitialized } = useAuth();
  const [errorMsg, setErrorMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [credentialsReady, setCredentialsReady] = useState(false);

  useEffect(() => {
    if (isInitialized && user?.role === "admin") {
      router.replace("/dashboard");
    }
  }, [isInitialized, user, router]);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
      rememberMe: true,
    },
  });

  useEffect(() => {
    const saved = getSavedCredentials();
    reset({
      username: saved?.username ?? "",
      password: saved?.password ?? "",
      rememberMe: saved?.rememberMe ?? true,
    });
    setCredentialsReady(true);
  }, [reset]);

  const rememberMe = watch("rememberMe");

  const loginMutation = useMutation({
    mutationFn: ({ username, password }: LoginForm) =>
      api.login({ username, password }),
    onSuccess: (data, variables) => {
      if (data.user.role !== "admin") {
        setErrorMsg("Access denied. Admin privileges required.");
        return;
      }

      saveLoginCredentials(
        variables.username,
        variables.password,
        variables.rememberMe,
      );
      login(data.token, data.user, variables.rememberMe);
      router.replace("/dashboard");
    },
    onError: (err: Error) => {
      setErrorMsg(err.message || "Failed to login. Check your credentials.");
    },
  });

  const onSubmit = (data: LoginForm) => {
    setErrorMsg("");
    loginMutation.mutate(data);
  };

  if (!credentialsReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-[55%] relative">
        <Image
          src="/login_bg.png"
          alt="Workshop Background"
          fill
          className="object-cover"
          priority
        />
      </div>

      <div className="w-full lg:w-[45%] flex items-center justify-center bg-white px-8 py-12">
        <div className="w-full max-w-[420px]">
          <div className="mb-12">
            <Image
              src="/badar_logo_black.svg"
              alt="Badar Tyres Logo"
              width={220}
              height={70}
              className="w-auto h-16"
              priority
            />
          </div>

          <div className="mb-8">
            <h1 className="text-[1.35rem] font-bold text-gray-900 mb-2">Welcome Back</h1>
            <p className="text-gray-500 text-[15px]">
              Sign in to your workshop admin account.
            </p>
          </div>

          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-md text-sm mb-6 text-center">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" autoComplete="on">
            <div>
              <label
                className="block text-xs font-medium uppercase tracking-wider text-gray-700 mb-1.5"
                htmlFor="username"
              >
                User Name
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400" strokeWidth={2} />
                <input
                  id="username"
                  type="text"
                  autoComplete="username"
                  className="w-full border border-gray-300 rounded-lg py-3 pl-11 pr-4 text-[15px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-theme-accent focus:ring-1 focus:ring-theme-accent transition-colors"
                  placeholder="Enter your username"
                  {...register("username")}
                />
              </div>
              {errors.username && (
                <p className="text-theme-accent text-xs mt-1.5">{errors.username.message}</p>
              )}
            </div>

            <div>
              <label
                className="block text-xs font-medium uppercase tracking-wider text-gray-700 mb-1.5"
                htmlFor="password"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400" strokeWidth={2} />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  className="w-full border border-gray-300 rounded-lg py-3 pl-11 pr-11 text-[15px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-theme-accent focus:ring-1 focus:ring-theme-accent transition-colors"
                  placeholder="••••••••"
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" strokeWidth={1.5} />
                  ) : (
                    <Eye className="w-5 h-5" strokeWidth={1.5} />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-theme-accent text-xs mt-1.5">{errors.password.message}</p>
              )}
            </div>

            <div className="flex items-center justify-between pt-1 pb-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 w-4 h-4 text-theme-accent focus:ring-theme-accent"
                  {...register("rememberMe")}
                />
                <span className="text-[14px] text-gray-500">Remember me</span>
              </label>
              {!rememberMe && (
                <span className="text-[12px] text-gray-400">Session only on this device</span>
              )}
            </div>

            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full bg-theme-accent hover:bg-theme-accent-dark text-white font-semibold rounded-lg px-4 py-3.5 uppercase tracking-wide transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-[15px]"
            >
              {loginMutation.isPending && <Loader2 className="w-5 h-5 animate-spin" />}
              Login
            </button>
          </form>

          <div className="mt-16 pt-8 border-t border-gray-100 text-center">
            <p className="text-[11px] tracking-[0.15em] text-gray-400 uppercase font-medium">
              Internal Use Only <span className="mx-2">•</span> PWA Build 2.5.0
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
