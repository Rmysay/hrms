"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Sparkles, AlertTriangle, TrendingUp, Shield, Brain,
    Zap, Users, ChevronDown, ChevronUp, RefreshCw,
    BarChart3, Target, HeartPulse
} from "lucide-react";
import { toast } from "sonner";

interface Insight {
    id: string;
    category: string;
    severity: string;
    title: string;
    description: string;
    recommendation: string;
    affectedEmployees: { id: string; name: string }[];
    metric?: string;
}

interface Summary {
    totalInsights: number;
    highSeverity: number;
    mediumSeverity: number;
    lowSeverity: number;
    categories: Record<string, number>;
}

const categoryConfig: Record<string, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
    performance: { label: "Performans", icon: <TrendingUp className="w-4 h-4" />, color: "text-blue-600", bg: "bg-blue-50 border-blue-200" },
    risk: { label: "Risk", icon: <AlertTriangle className="w-4 h-4" />, color: "text-red-600", bg: "bg-red-50 border-red-200" },
    development: { label: "Gelişim", icon: <Brain className="w-4 h-4" />, color: "text-purple-600", bg: "bg-purple-50 border-purple-200" },
    engagement: { label: "Bağlılık", icon: <HeartPulse className="w-4 h-4" />, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200" },
    workload: { label: "İş Yükü", icon: <Zap className="w-4 h-4" />, color: "text-amber-600", bg: "bg-amber-50 border-amber-200" },
};

const severityConfig: Record<string, { label: string; color: string; dotColor: string }> = {
    high: { label: "Yüksek", color: "bg-red-100 text-red-700 border-red-200", dotColor: "bg-red-500" },
    medium: { label: "Orta", color: "bg-amber-100 text-amber-700 border-amber-200", dotColor: "bg-amber-500" },
    low: { label: "Düşük", color: "bg-blue-100 text-blue-700 border-blue-200", dotColor: "bg-blue-500" },
};

export default function AIInsightsPage() {
    const [insights, setInsights] = useState<Insight[]>([]);
    const [summary, setSummary] = useState<Summary | null>(null);
    const [loading, setLoading] = useState(true);
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
    const [filterCategory, setFilterCategory] = useState<string | null>(null);

    const fetchInsights = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/ai-insights");
            const data = await res.json();
            if (res.ok) {
                setInsights(data.insights || []);
                setSummary(data.summary || null);
            } else {
                toast.error(data.error || "Hata oluştu");
            }
        } catch { toast.error("Sunucu hatası"); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchInsights(); }, []);

    const toggleExpand = (id: string) => {
        setExpandedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    const filteredInsights = filterCategory
        ? insights.filter((i) => i.category === filterCategory)
        : insights;

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-md">
                        <Sparkles className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">AI Tavsiyeleri</h1>
                        <p className="text-muted-foreground text-sm mt-0.5">Veriye dayalı akıllı öngörüler ve tavsiyeler</p>
                    </div>
                </div>
                <Button onClick={fetchInsights} variant="outline" size="sm" className="gap-1.5" disabled={loading}>
                    <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Yenile
                </Button>
            </div>

            {loading ? (
                <div className="space-y-4">
                    <div className="grid grid-cols-4 gap-3">
                        {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-muted animate-pulse rounded-xl" />)}
                    </div>
                    {[...Array(3)].map((_, i) => <div key={i} className="h-32 bg-muted animate-pulse rounded-xl" />)}
                </div>
            ) : (
                <>
                    {/* Summary cards */}
                    {summary && (
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                            <Card className="border-0 shadow-sm">
                                <CardContent className="pt-4 pb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 text-white">
                                            <BarChart3 className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground font-medium">Toplam Öngörü</p>
                                            <p className="text-2xl font-bold">{summary.totalInsights}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-0 shadow-sm">
                                <CardContent className="pt-4 pb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-red-100"><AlertTriangle className="w-4 h-4 text-red-600" /></div>
                                        <div>
                                            <p className="text-xs text-muted-foreground font-medium">Yüksek Öncelik</p>
                                            <p className="text-2xl font-bold text-red-600">{summary.highSeverity}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-0 shadow-sm">
                                <CardContent className="pt-4 pb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-amber-100"><Target className="w-4 h-4 text-amber-600" /></div>
                                        <div>
                                            <p className="text-xs text-muted-foreground font-medium">Orta Öncelik</p>
                                            <p className="text-2xl font-bold text-amber-600">{summary.mediumSeverity}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-0 shadow-sm">
                                <CardContent className="pt-4 pb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-blue-100"><Shield className="w-4 h-4 text-blue-600" /></div>
                                        <div>
                                            <p className="text-xs text-muted-foreground font-medium">Düşük Öncelik</p>
                                            <p className="text-2xl font-bold text-blue-600">{summary.lowSeverity}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Category filter */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <Button
                            variant={filterCategory === null ? "default" : "outline"}
                            size="sm"
                            onClick={() => setFilterCategory(null)}
                            className="text-xs h-8"
                        >
                            Tümü
                        </Button>
                        {Object.entries(categoryConfig).map(([key, config]) => {
                            const count = summary?.categories[key] || 0;
                            if (count === 0) return null;
                            return (
                                <Button
                                    key={key}
                                    variant={filterCategory === key ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setFilterCategory(filterCategory === key ? null : key)}
                                    className="text-xs h-8 gap-1"
                                >
                                    {config.icon} {config.label}
                                    <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0">{count}</Badge>
                                </Button>
                            );
                        })}
                    </div>

                    {/* Insights */}
                    {filteredInsights.length === 0 ? (
                        <Card className="border-0 shadow-sm">
                            <CardContent className="flex flex-col items-center justify-center py-16">
                                <div className="p-4 rounded-full bg-emerald-50 mb-4">
                                    <Shield className="w-10 h-10 text-emerald-500" />
                                </div>
                                <p className="text-lg font-semibold">Harika! Her şey yolunda 🎉</p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {filterCategory ? "Bu kategoride öneri bulunmuyor." : "Şu anda aksiyon gerektiren bir durum tespit edilmedi."}
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-3">
                            {filteredInsights.map((insight, i) => {
                                const cat = categoryConfig[insight.category];
                                const sev = severityConfig[insight.severity];
                                const isExpanded = expandedIds.has(insight.id);

                                return (
                                    <Card
                                        key={insight.id}
                                        className={`border shadow-sm transition-all hover:shadow-md animate-fade-in ${cat?.bg || ""}`}
                                        style={{ animationDelay: `${i * 60}ms` }}
                                    >
                                        <CardContent className="pt-4 pb-4">
                                            <div className="flex items-start gap-3">
                                                {/* Severity dot */}
                                                <div className="mt-1.5">
                                                    <div className={`w-3 h-3 rounded-full ${sev.dotColor} shadow-sm`}>
                                                        {insight.severity === "high" && (
                                                            <span className="block animate-ping w-3 h-3 rounded-full bg-red-400 opacity-75" />
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    {/* Title line */}
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div>
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <h3 className="font-semibold text-sm">{insight.title}</h3>
                                                                <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${sev.color}`}>
                                                                    {sev.label}
                                                                </Badge>
                                                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 gap-0.5">
                                                                    {cat?.icon}
                                                                    <span className="ml-0.5">{cat?.label}</span>
                                                                </Badge>
                                                                {insight.metric && (
                                                                    <span className="text-[10px] font-medium text-muted-foreground bg-white/60 px-1.5 py-0.5 rounded">
                                                                        {insight.metric}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{insight.description}</p>
                                                        </div>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-7 w-7 shrink-0"
                                                            onClick={() => toggleExpand(insight.id)}
                                                        >
                                                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                        </Button>
                                                    </div>

                                                    {/* Expanded content */}
                                                    {isExpanded && (
                                                        <div className="mt-3 space-y-3 animate-fade-in">
                                                            {/* Recommendation */}
                                                            <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 border border-white/50 shadow-sm">
                                                                <div className="flex items-center gap-1.5 mb-1.5">
                                                                    <Sparkles className="w-3.5 h-3.5 text-violet-500" />
                                                                    <p className="text-xs font-semibold text-violet-700">AI Tavsiyesi</p>
                                                                </div>
                                                                <p className="text-xs leading-relaxed">{insight.recommendation}</p>
                                                            </div>

                                                            {/* Affected employees */}
                                                            {insight.affectedEmployees.length > 0 && (
                                                                <div>
                                                                    <div className="flex items-center gap-1.5 mb-1.5">
                                                                        <Users className="w-3.5 h-3.5 text-muted-foreground" />
                                                                        <p className="text-xs font-medium text-muted-foreground">
                                                                            İlgili Çalışanlar ({insight.affectedEmployees.length})
                                                                        </p>
                                                                    </div>
                                                                    <div className="flex flex-wrap gap-1">
                                                                        {insight.affectedEmployees.map((e) => (
                                                                            <span
                                                                                key={e.id}
                                                                                className="text-[10px] bg-white/80 border border-white/50 rounded-md px-2 py-1 font-medium shadow-sm"
                                                                            >
                                                                                {e.name}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
