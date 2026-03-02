"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
    Settings, User, Building2, KeyRound, Save, Loader2
} from "lucide-react";
import { toast } from "sonner";

interface UserSettings {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    role: string;
    tenant: { id: string; name: string; slug: string; logoUrl: string | null };
}

export default function SettingsPage() {
    const [user, setUser] = useState<UserSettings | null>(null);
    const [loading, setLoading] = useState(true);

    // Profile
    const [profileName, setProfileName] = useState("");
    const [profilePhone, setProfilePhone] = useState("");
    const [savingProfile, setSavingProfile] = useState(false);

    // Password
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [savingPassword, setSavingPassword] = useState(false);

    // Tenant
    const [tenantName, setTenantName] = useState("");
    const [savingTenant, setSavingTenant] = useState(false);

    const fetchSettings = useCallback(async () => {
        try {
            const res = await fetch("/api/settings");
            const data = await res.json();
            if (res.ok && data.user) {
                setUser(data.user);
                setProfileName(data.user.name);
                setProfilePhone(data.user.phone || "");
                setTenantName(data.user.tenant.name);
            }
        } catch {
            toast.error("Ayarlar yüklenemedi");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchSettings(); }, [fetchSettings]);

    const handleProfileSave = async () => {
        setSavingProfile(true);
        try {
            const res = await fetch("/api/settings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "update-profile", name: profileName, phone: profilePhone }),
            });
            const data = await res.json();
            if (res.ok) toast.success(data.message);
            else toast.error(data.error);
        } catch { toast.error("Hata oluştu"); }
        finally { setSavingProfile(false); }
    };

    const handlePasswordChange = async () => {
        if (newPassword !== confirmPassword) {
            toast.error("Şifreler eşleşmiyor");
            return;
        }
        if (newPassword.length < 6) {
            toast.error("Yeni şifre en az 6 karakter olmalı");
            return;
        }
        setSavingPassword(true);
        try {
            const res = await fetch("/api/settings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "change-password", currentPassword, newPassword }),
            });
            const data = await res.json();
            if (res.ok) {
                toast.success(data.message);
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
            } else {
                toast.error(data.error);
            }
        } catch { toast.error("Hata oluştu"); }
        finally { setSavingPassword(false); }
    };

    const handleTenantSave = async () => {
        setSavingTenant(true);
        try {
            const res = await fetch("/api/settings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "update-tenant", tenantName }),
            });
            const data = await res.json();
            if (res.ok) toast.success(data.message);
            else toast.error(data.error);
        } catch { toast.error("Hata oluştu"); }
        finally { setSavingTenant(false); }
    };

    if (loading) {
        return (
            <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-48 bg-muted animate-pulse rounded-xl" />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in max-w-2xl">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-slate-600 to-slate-800 text-white shadow-md">
                    <Settings className="w-6 h-6" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold">Ayarlar</h1>
                    <p className="text-muted-foreground text-sm mt-0.5">Profil ve sistem ayarlarını yönet</p>
                </div>
            </div>

            {/* Profile Settings */}
            <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                        <User className="w-4 h-4 text-blue-600" /> Profil Bilgileri
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Ad Soyad</Label>
                            <Input value={profileName} onChange={(e) => setProfileName(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>E-posta</Label>
                            <Input value={user?.email || ""} disabled className="bg-muted" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Telefon</Label>
                            <Input value={profilePhone} onChange={(e) => setProfilePhone(e.target.value)} placeholder="05xx xxx xx xx" />
                        </div>
                        <div className="space-y-2">
                            <Label>Rol</Label>
                            <Input value={user?.role === "HR" ? "İK Yöneticisi" : user?.role === "SUPER_ADMIN" ? "Süper Admin" : "Çalışan"} disabled className="bg-muted" />
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <Button onClick={handleProfileSave} disabled={savingProfile} size="sm" className="gap-1.5">
                            {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Kaydet
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Password */}
            <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                        <KeyRound className="w-4 h-4 text-emerald-600" /> Şifre Değiştir
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Mevcut Şifre</Label>
                        <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Yeni Şifre</Label>
                            <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="En az 6 karakter" />
                        </div>
                        <div className="space-y-2">
                            <Label>Yeni Şifre (Tekrar)</Label>
                            <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <Button onClick={handlePasswordChange} disabled={savingPassword} size="sm" variant="outline" className="gap-1.5">
                            {savingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                            Şifreyi Güncelle
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Tenant Settings (HR only) */}
            {user && user.role !== "EMPLOYEE" && (
                <Card className="border-0 shadow-sm">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-violet-600" /> Şirket Bilgileri
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Şirket Adı</Label>
                                <Input value={tenantName} onChange={(e) => setTenantName(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Slug</Label>
                                <Input value={user.tenant.slug} disabled className="bg-muted" />
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <Button onClick={handleTenantSave} disabled={savingTenant} size="sm" className="gap-1.5">
                                {savingTenant ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Kaydet
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            <Separator />
            <p className="text-xs text-muted-foreground text-center">HRMS v1.0 — İnsan Kaynakları Yönetim Sistemi</p>
        </div>
    );
}
