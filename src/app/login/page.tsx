"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Giriş başarısız");
                return;
            }

            // Redirect based on role
            if (data.user.role === "HR" || data.user.role === "SUPER_ADMIN") {
                router.push("/hr/dashboard");
            } else {
                router.push("/employee/dashboard");
            }
        } catch {
            setError("Sunucu hatası. Lütfen tekrar deneyin.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
            {/* Background gradient */}
            <div className="absolute inset-0 gradient-primary opacity-90" />
            <div className="absolute inset-0" style={{
                backgroundImage: `radial-gradient(circle at 20% 50%, oklch(0.55 0.22 265 / 30%) 0%, transparent 50%),
                          radial-gradient(circle at 80% 20%, oklch(0.6 0.2 280 / 20%) 0%, transparent 50%),
                          radial-gradient(circle at 50% 80%, oklch(0.5 0.18 250 / 15%) 0%, transparent 50%)`
            }} />

            {/* Floating shapes */}
            <div className="absolute top-20 left-10 w-72 h-72 rounded-full opacity-10 animate-pulse-soft" style={{ background: 'oklch(0.7 0.2 280)' }} />
            <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full opacity-10 animate-pulse-soft" style={{ background: 'oklch(0.6 0.22 265)', animationDelay: '1s' }} />

            <Card className="w-full max-w-md mx-4 glass border-white/20 shadow-2xl relative z-10 animate-fade-in">
                <CardHeader className="text-center space-y-3 pb-2">
                    {/* Logo */}
                    <div className="mx-auto w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center shadow-lg mb-2">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
                            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                    </div>
                    <CardTitle className="text-2xl font-bold text-foreground">HRMS</CardTitle>
                    <CardDescription className="text-muted-foreground">
                        İnsan Kaynakları Yönetim Sistemi
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-sm font-medium">
                                E-posta Adresi
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="ornek@sirket.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="h-11 bg-white/50 border-white/30 focus:border-primary/50 transition-all"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-sm font-medium">
                                Şifre
                            </Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="h-11 bg-white/50 border-white/30 focus:border-primary/50 transition-all"
                            />
                        </div>

                        {error && (
                            <div className="text-sm text-destructive bg-destructive/10 px-4 py-3 rounded-lg border border-destructive/20 animate-fade-in">
                                {error}
                            </div>
                        )}

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full h-11 gradient-primary text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Giriş yapılıyor...
                                </span>
                            ) : (
                                "Giriş Yap"
                            )}
                        </Button>

                        <div className="text-center">
                            <a href="/forgot-password" className="text-sm text-primary hover:text-primary/80 transition-colors">
                                Şifremi Unuttum
                            </a>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
