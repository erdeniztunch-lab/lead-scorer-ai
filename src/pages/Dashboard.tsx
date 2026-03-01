import { useState } from "react";
import { Users, Clock, Target, TrendingUp, Mail, Phone, Linkedin, Search, ChevronDown, ChevronUp, BarChart3, Settings, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { NavLink } from "@/components/NavLink";
import { mockLeads, kpiData, type Lead } from "@/data/mockLeads";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const tierColors = {
  hot: "bg-score-hot-bg text-score-hot border-score-hot/20",
  warm: "bg-score-warm-bg text-score-warm border-score-warm/20",
  cold: "bg-score-cold-bg text-score-cold border-score-cold/20",
};

function ScoreBadge({ score, tier }: { score: number; tier: Lead["tier"] }) {
  return (
    <span className={cn("inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-bold", tierColors[tier])}>
      {score}
    </span>
  );
}

function ReasonBadge({ reason }: { reason: string }) {
  return (
    <span className="inline-flex items-center rounded-full bg-secondary text-secondary-foreground px-2 py-0.5 text-xs">
      {reason}
    </span>
  );
}

function KPICard({ title, value, icon: Icon }: { title: string; value: string | number; icon: React.ElementType }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</span>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="text-2xl font-bold text-foreground">{value}</div>
      </CardContent>
    </Card>
  );
}

function LeadActions({ lead }: { lead: Lead }) {
  return (
    <div className="flex items-center gap-1">
      <Button variant="ghost" size="icon" className="h-8 w-8" title={`Email ${lead.name}`}>
        <Mail className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" className="h-8 w-8" title={`Call ${lead.name}`}>
        <Phone className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" className="h-8 w-8" title={`LinkedIn ${lead.name}`}>
        <Linkedin className="h-4 w-4" />
      </Button>
    </div>
  );
}

function AppSidebar() {
  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarContent className="bg-sidebar">
        <div className="p-4 border-b border-sidebar-border">
          <span className="text-base font-bold text-sidebar-foreground">
            Lead<span className="text-sidebar-primary">Scorer</span>
          </span>
        </div>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/dashboard" end activeClassName="bg-sidebar-accent text-sidebar-accent-foreground">
                    <Users className="mr-2 h-4 w-4" />
                    <span>Leads</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/dashboard/analytics" activeClassName="bg-sidebar-accent text-sidebar-accent-foreground">
                    <BarChart3 className="mr-2 h-4 w-4" />
                    <span>Analytics</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/dashboard/settings" activeClassName="bg-sidebar-accent text-sidebar-accent-foreground">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <div className="mt-auto p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground text-xs">JD</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-sidebar-foreground truncate">Jane Doe</div>
              <div className="text-xs text-sidebar-foreground/60 truncate">jane@company.com</div>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-sidebar-foreground/60 hover:text-sidebar-foreground">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}

const Dashboard = () => {
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [tierFilter, setTierFilter] = useState("all");
  const [engagementRange, setEngagementRange] = useState([0]);
  const [date, setDate] = useState<Date>();

  const filteredLeads = mockLeads.filter((lead) => {
    if (searchQuery && !lead.name.toLowerCase().includes(searchQuery.toLowerCase()) && !lead.company.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (sourceFilter !== "all" && lead.source !== sourceFilter) return false;
    if (tierFilter !== "all" && lead.tier !== tierFilter) return false;
    if (lead.score < engagementRange[0]) return false;
    return true;
  });

  const sources = [...new Set(mockLeads.map((l) => l.source))];

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-12 flex items-center border-b px-4 bg-card">
            <SidebarTrigger className="mr-3" />
            <h1 className="text-lg font-semibold text-foreground">Lead Queue</h1>
          </header>

          <main className="flex-1 p-4 md:p-6 space-y-6 overflow-auto">
            {/* Filters */}
            <div className="flex flex-wrap gap-3 items-center">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search leads..." className="pl-9 w-56" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger className="w-36"><SelectValue placeholder="Source" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  {sources.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={tierFilter} onValueChange={setTierFilter}>
                <SelectTrigger className="w-32"><SelectValue placeholder="Priority" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tiers</SelectItem>
                  <SelectItem value="hot">🔥 Hot</SelectItem>
                  <SelectItem value="warm">🟡 Warm</SelectItem>
                  <SelectItem value="cold">🔵 Cold</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2 min-w-[160px]">
                <span className="text-xs text-muted-foreground whitespace-nowrap">Min score:</span>
                <Slider value={engagementRange} onValueChange={setEngagementRange} max={100} step={5} className="w-24" />
                <span className="text-xs font-medium w-6">{engagementRange[0]}</span>
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className={cn("text-xs", !date && "text-muted-foreground")}>
                    {date ? format(date, "MMM d, yyyy") : "Date range"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={date} onSelect={setDate} className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPICard title="Total Leads" value={kpiData.totalLeads} icon={Users} />
              <KPICard title="Avg. First Contact" value={kpiData.timeToFirstContact} icon={Clock} />
              <KPICard title="Precision@10" value={kpiData.precisionAt10} icon={Target} />
              <KPICard title="Lift" value={kpiData.lift} icon={TrendingUp} />
            </div>

            {/* Lead Table */}
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="hidden md:table-cell">Company</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead className="hidden lg:table-cell">Reasons</TableHead>
                    <TableHead className="hidden md:table-cell">Source</TableHead>
                    <TableHead className="hidden lg:table-cell">Last Activity</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeads.map((lead) => (
                    <Collapsible key={lead.id} open={expandedRow === lead.id} onOpenChange={(open) => setExpandedRow(open ? lead.id : null)} asChild>
                      <>
                        <CollapsibleTrigger asChild>
                          <TableRow className="cursor-pointer">
                            <TableCell className="font-medium text-muted-foreground">{lead.rank}</TableCell>
                            <TableCell>
                              <div className="font-medium text-foreground">{lead.name}</div>
                              <div className="text-xs text-muted-foreground md:hidden">{lead.company}</div>
                            </TableCell>
                            <TableCell className="hidden md:table-cell text-muted-foreground">{lead.company}</TableCell>
                            <TableCell><ScoreBadge score={lead.score} tier={lead.tier} /></TableCell>
                            <TableCell className="hidden lg:table-cell">
                              <div className="flex gap-1 flex-wrap">
                                {lead.reasons.map((r) => <ReasonBadge key={r} reason={r} />)}
                              </div>
                            </TableCell>
                            <TableCell className="hidden md:table-cell text-muted-foreground text-sm">{lead.source}</TableCell>
                            <TableCell className="hidden lg:table-cell text-muted-foreground text-sm">{lead.lastActivity}</TableCell>
                            <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                              <LeadActions lead={lead} />
                            </TableCell>
                          </TableRow>
                        </CollapsibleTrigger>
                        <CollapsibleContent asChild>
                          <TableRow className="bg-muted/30 hover:bg-muted/30">
                            <TableCell colSpan={8} className="py-4">
                              <div className="max-w-2xl">
                                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">AI Explanation</div>
                                <p className="text-sm text-foreground leading-relaxed">{lead.aiExplanation}</p>
                                <div className="flex gap-1 mt-3 lg:hidden flex-wrap">
                                  {lead.reasons.map((r) => <ReasonBadge key={r} reason={r} />)}
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        </CollapsibleContent>
                      </>
                    </Collapsible>
                  ))}
                  {filteredLeads.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No leads match your filters.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
