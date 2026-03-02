"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KeyRound, CheckCircle2, ArrowLeft } from "lucide-react";
import Link from "next/link";

function ResetPasswordForm() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get("token") || "";

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (password !== confirmPassword) {
            setError("Şifreler eşleşmiyor");
            return;
        }

        if (password.length < 6) {
            setError("Şifre en az 6 karakter olmalı");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, password }),
            });
            const data = await res.json();
            if (res.ok) {
                setSuccess(true);
                setTimeout(() => router.push("/login"), 3000);
            } else {
                setError(data.error || "Bir hata oluştu");
            }
        } catch {
            setError("Sunucu hatası");
        } finally {
            setLoading(false);
        }
    };

    if (!token) {
        return (
            <div className="text-center space-y-4 py-8">
                <p className="text-destructive font-medium">Geçersiz sıfırlama bağlantısı</p>
                <p className="text-sm text-muted-foreground">Lütfen şifre sıfırlama talebini tekrar gönderin.</p>
                <Link href="/forgot-password">
                    <Button variant="outline" className="gap-2">
                        <ArrowLeft className="w-4 h-4" /> Şifremi Unuttum
                    </Button>
                </Link>
            </div>
        );
    }

    return (
        <>
            {success ? (
                <div className="space-y-4">
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
                        <div>
                            <p className="text-sm font-medium text-emerald-800">Şifreniz başarıyla güncellendi!</p>
                            <p className="text-xs text-emerald-600 mt-1">Giriş sayfasına yönlendiriliyorsunuz...</p>
                        </div>
                    </div>
                    <Link href="/login">
                        <Button variant="outline" className="w-full gap-2">
                            <ArrowLeft className="w-4 h-4" /> Giriş Sayfasına Dön
                        </Button>
                    </Link>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                            <p className="text-sm text-destructive">{error}</p>
                        </div>
                    )}
                    <div className="space-y-2">
                        <Label htmlFor="password" className="text-sm font-medium">Yeni Şifre</Label>
                        <Input
                            id="password"
                            type="password"
                            placeholder="En az 6 karakter"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                            className="h-11"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword" className="text-sm font-medium">Şifre Tekrar</Label>
                        <Input
                            id="confirmPassword"
                            type="password"
                            placeholder="Şifrenizi tekrar girin"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            minLength={6}
                            className="h-11"
                        />
                    </div>
                    <Button type="submit" className="w-full h-11 font-medium" disabled={loading}>
                        {loading ? "Güncelleniyor..." : "Şifreyi Güncelle"}
                    </Button>
                    <Link href="/login" className="block text-center">
                        <span className="text-sm text-primary hover:text-primary/80 transition-colors flex items-center justify-center gap-1">
                            <ArrowLeft className="w-3 h-3" /> Giriş sayfasına dön
                        </span>
                    </Link>
                </form>
            )}
        </>
    );
}

export default function ResetPasswordPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4">
            <div className="w-full max-w-md">
                <Card className="border-0 shadow-xl">
                    <CardHeader className="text-center pb-2">
                        <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg mb-4">
                            <KeyRound className="w-7 h-7 text-white" />
                        </div>
                        <CardTitle className="text-xl font-bold">Şifre Sıfırlama</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">Yeni şifrenizi belirleyin</p>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <Suspense fallback={<div className="h-40 animate-pulse bg-muted rounded-lg" />}>
                            <ResetPasswordForm />
                        </Suspense>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
