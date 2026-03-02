"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Network, ChevronDown, ChevronRight, RefreshCw,
    Users, Building2, Briefcase, User
} from "lucide-react";
import { toast } from "sonner";

interface OrgNode {
    id: string;
    name: string;
    email: string;
    role: string;
    department: string | null;
    position: string | null;
    children: OrgNode[];
}

const roleColors: Record<string, string> = {
    SUPER_ADMIN: "bg-purple-100 text-purple-700 border-purple-200",
    HR: "bg-blue-100 text-blue-700 border-blue-200",
    EMPLOYEE: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

const roleLabels: Record<string, string> = {
    SUPER_ADMIN: "Süper Admin",
    HR: "İK Yöneticisi",
    EMPLOYEE: "Çalışan",
};

function OrgTreeNode({ node, level = 0 }: { node: OrgNode; level?: number }) {
    const [expanded, setExpanded] = useState(level < 2);
    const hasChildren = node.children.length > 0;

    return (
        <div className="relative">
            <div
                className={`flex items-start gap-3 ${level > 0 ? "ml-8" : ""}`}
                style={{ paddingLeft: level > 0 ? `${level * 8}px` : undefined }}
            >
                {/* Node card */}
                <Card className="border shadow-sm hover:shadow-md transition-all flex-1 max-w-md">
                    <CardContent className="p-3">
                        <div className="flex items-center gap-3">
                            {hasChildren ? (
                                <button
                                    onClick={() => setExpanded(!expanded)}
                                    className="p-1 rounded-md hover:bg-muted transition-colors shrink-0"
                                >
                                    {expanded ? (
                                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                    ) : (
                                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                    )}
                                </button>
                            ) : (
                                <div className="w-6" />
                            )}

                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-sm shrink-0">
                                {node.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                            </div>

                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <p className="font-semibold text-sm truncate">{node.name}</p>
                                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${roleColors[node.role] || ""}`}>
                                        {roleLabels[node.role] || node.role}
                                    </Badge>
                                </div>
                                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                    {node.position && (
                                        <span className="flex items-center gap-1">
                                            <Briefcase className="w-3 h-3" /> {node.position}
                                        </span>
                                    )}
                                    {node.department && (
                                        <span className="flex items-center gap-1">
                                            <Building2 className="w-3 h-3" /> {node.department}
                                        </span>
                                    )}
                                </div>
                                {hasChildren && (
                                    <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                                        <Users className="w-3 h-3" /> {node.children.length} alt çalışan
                                    </p>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {expanded && hasChildren && (
                <div className="mt-2 space-y-2 relative">
                    {node.children.map((child) => (
                        <OrgTreeNode key={child.id} node={child} level={level + 1} />
                    ))}
                </div>
            )}
        </div>
    );
}

export default function EmployeeOrgChartPage() {
    const [tree, setTree] = useState<OrgNode[]>([]);
    const [totalEmployees, setTotalEmployees] = useState(0);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/org-chart");
            const data = await res.json();
            if (res.ok) {
                setTree(data.tree || []);
                setTotalEmployees(data.totalEmployees || 0);
            } else {
                toast.error(data.error || "Hata oluştu");
            }
        } catch {
            toast.error("Sunucu hatası");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-md">
                        <Network className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">Organizasyon Şeması</h1>
                        <p className="text-muted-foreground text-sm mt-0.5">Şirket hiyerarşisi ve ekip yapısı</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="gap-1">
                        <User className="w-3 h-3" /> {totalEmployees} çalışan
                    </Badge>
                    <Button onClick={fetchData} variant="outline" size="sm" className="gap-1.5" disabled={loading}>
                        <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Yenile
                    </Button>
                </div>
            </div>

            {loading ? (
                <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-20 bg-muted animate-pulse rounded-xl" style={{ marginLeft: `${i * 32}px`, maxWidth: `${500 - i * 40}px` }} />
                    ))}
                </div>
            ) : tree.length === 0 ? (
                <Card className="border-0 shadow-sm">
                    <CardContent className="flex flex-col items-center justify-center py-16">
                        <div className="p-4 rounded-full bg-muted mb-4">
                            <Network className="w-10 h-10 text-muted-foreground" />
                        </div>
                        <p className="text-lg font-semibold">Henüz organizasyon verisi yok</p>
                        <p className="text-sm text-muted-foreground mt-1">
                            Çalışanlara yönetici ataması yapıldığında şema burada görünecek.
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {tree.map((node) => (
                        <OrgTreeNode key={node.id} node={node} />
                    ))}
                </div>
            )}
        </div>
    );
}
