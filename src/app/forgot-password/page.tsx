"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [devToken, setDevToken] = useState<string | null>(null);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });
            const data = await res.json();
            if (res.ok) {
                setSent(true);
                if (data.devToken) setDevToken(data.devToken);
            } else {
                setError(data.error || "Bir hata oluştu");
            }
        } catch {
            setError("Sunucu hatası");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4">
            <div className="w-full max-w-md">
                <Card className="border-0 shadow-xl">
                    <CardHeader className="text-center pb-2">
                        <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg mb-4">
                            <Mail className="w-7 h-7 text-white" />
                        </div>
                        <CardTitle className="text-xl font-bold">
                            {sent ? "E-posta Gönderildi" : "Şifremi Unuttum"}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                            {sent
                                ? "Şifre sıfırlama talimatları e-posta adresinize gönderildi."
                                : "Kayıtlı e-posta adresinizi girin, size şifre sıfırlama bağlantısı gönderelim."}
                        </p>
                    </CardHeader>
                    <CardContent className="pt-4">
                        {sent ? (
                            <div className="space-y-4">
                                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-start gap-3">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
                                    <p className="text-sm text-emerald-800">
                                        Eğer bu e-posta kayıtlıysa, şifre sıfırlama bağlantısı gönderildi.
                                    </p>
                                </div>

                                {devToken && (
                                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                                        <p className="text-xs font-semibold text-amber-700 mb-1">🔧 Geliştirme Modu</p>
                                        <p className="text-xs text-amber-600 mb-2">Aşağıdaki link ile şifrenizi sıfırlayabilirsiniz:</p>
                                        <Link
                                            href={`/reset-password?token=${devToken}`}
                                            className="text-xs text-blue-600 hover:text-blue-800 underline break-all"
                                        >
                                            /reset-password?token={devToken}
                                        </Link>
                                    </div>
                                )}

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
                                    <Label htmlFor="email" className="text-sm font-medium">E-posta Adresi</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="ornek@sirket.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="h-11"
                                    />
                                </div>
                                <Button type="submit" className="w-full h-11 font-medium" disabled={loading}>
                                    {loading ? "Gönderiliyor..." : "Sıfırlama Bağlantısı Gönder"}
                                </Button>
                                <Link href="/login" className="block text-center">
                                    <span className="text-sm text-primary hover:text-primary/80 transition-colors flex items-center justify-center gap-1">
                                        <ArrowLeft className="w-3 h-3" /> Giriş sayfasına dön
                                    </span>
                                </Link>
                            </form>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
