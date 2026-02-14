import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Plus, Network, Eye, EyeOff, Trash2, Edit, GitBranch, Lightbulb } from "lucide-react";

interface PlotThread {
  id: string;
  campaign_id: string;
  title: string;
  status: string;
  description: string | null;
  truth: string | null;
  party_knowledge: string | null;
  branching_notes: string | null;
  sort_order: number;
  created_at: string;
}

interface PlotBoardTabProps {
  campaignId: string;
}

const STATUS_COLORS: Record<string, string> = {
  active: "border-green-500/40 text-green-400",
  dormant: "border-yellow-500/40 text-yellow-400",
  resolved: "border-brass/40 text-brass",
};

export function PlotBoardTab({ campaignId }: PlotBoardTabProps) {
  const [threads, setThreads] = useState<PlotThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedThread, setSelectedThread] = useState<PlotThread | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const { toast } = useToast();

  // Form state
  const [form, setForm] = useState({
    title: "",
    status: "active",
    description: "",
    truth: "",
    party_knowledge: "",
    branching_notes: "",
  });

  const fetchThreads = useCallback(async () => {
    const { data, error } = await supabase
      .from("plot_threads")
      .select("*")
      .eq("campaign_id", campaignId)
      .order("sort_order", { ascending: true });

    if (!error && data) setThreads(data as PlotThread[]);
    setLoading(false);
  }, [campaignId]);

  useEffect(() => {
    fetchThreads();
  }, [fetchThreads]);

  const filteredThreads = useMemo(() =>
    filterStatus === "all" ? threads : threads.filter(t => t.status === filterStatus),
    [threads, filterStatus]
  );

  const resetForm = () => {
    setForm({ title: "", status: "active", description: "", truth: "", party_knowledge: "", branching_notes: "" });
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast({ title: "Title required", variant: "destructive" });
      return;
    }

    if (selectedThread) {
      // Update
      await supabase.from("plot_threads").update({
        title: form.title,
        status: form.status,
        description: form.description || null,
        truth: form.truth || null,
        party_knowledge: form.party_knowledge || null,
        branching_notes: form.branching_notes || null,
      }).eq("id", selectedThread.id);
      toast({ title: "Thread updated" });
    } else {
      // Create
      await supabase.from("plot_threads").insert({
        campaign_id: campaignId,
        title: form.title,
        status: form.status,
        description: form.description || null,
        truth: form.truth || null,
        party_knowledge: form.party_knowledge || null,
        branching_notes: form.branching_notes || null,
        sort_order: threads.length,
      });
      toast({ title: "Thread created" });
    }

    resetForm();
    setSelectedThread(null);
    setShowCreate(false);
    fetchThreads();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("plot_threads").delete().eq("id", id);
    setThreads(prev => prev.filter(t => t.id !== id));
    toast({ title: "Thread deleted" });
  };

  const openEdit = (thread: PlotThread) => {
    setSelectedThread(thread);
    setForm({
      title: thread.title,
      status: thread.status,
      description: thread.description || "",
      truth: thread.truth || "",
      party_knowledge: thread.party_knowledge || "",
      branching_notes: thread.branching_notes || "",
    });
    setShowCreate(true);
  };

  const openCreate = () => {
    resetForm();
    setSelectedThread(null);
    setShowCreate(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="font-cinzel text-xl font-bold text-ink flex items-center gap-2">
          <Network className="w-5 h-5 text-arcanePurple" />
          Plot Board
          <Badge variant="outline" className="border-arcanePurple/30 text-arcanePurple text-xs ml-2">
            DM Only
          </Badge>
        </h2>
        <div className="flex items-center gap-2">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-32 bg-card/50 border-brass/20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="dormant">Dormant</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={openCreate} size="sm">
            <Plus className="w-4 h-4 mr-1" />
            New Thread
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-3">
          {[1, 2, 3].map(i => <Card key={i} className="h-24 animate-pulse bg-card/30" />)}
        </div>
      ) : filteredThreads.length === 0 ? (
        <Card className="p-12 text-center border-brass/20 bg-card/50">
          <Network className="w-12 h-12 text-arcanePurple/40 mx-auto mb-3" />
          <p className="text-muted-foreground font-cinzel">
            {filterStatus !== "all" ? "No threads with this status" : "No plot threads yet. Start weaving your story!"}
          </p>
        </Card>
      ) : (
        <ScrollArea className="h-[calc(100vh-18rem)]">
          <div className="grid gap-3">
            {filteredThreads.map((thread) => (
              <Card
                key={thread.id}
                className="p-4 border-brass/20 bg-card/50 hover:border-brass/40 transition-all cursor-pointer"
                onClick={() => openEdit(thread)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-cinzel font-bold text-ink truncate">{thread.title}</h3>
                      <Badge variant="outline" className={`text-xs shrink-0 ${STATUS_COLORS[thread.status] || ""}`}>
                        {thread.status}
                      </Badge>
                    </div>
                    {thread.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{thread.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      {thread.truth && (
                        <span className="flex items-center gap-1">
                          <EyeOff className="w-3 h-3" /> Has hidden truth
                        </span>
                      )}
                      {thread.party_knowledge && (
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" /> Party knows something
                        </span>
                      )}
                      {thread.branching_notes && (
                        <span className="flex items-center gap-1">
                          <GitBranch className="w-3 h-3" /> Has branches
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 h-7 w-7 text-destructive hover:text-destructive"
                    onClick={(e) => { e.stopPropagation(); handleDelete(thread.id); }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </ScrollArea>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={showCreate} onOpenChange={(open) => { setShowCreate(open); if (!open) { resetForm(); setSelectedThread(null); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-cinzel">
              {selectedThread ? "Edit Plot Thread" : "New Plot Thread"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="The Dragon's Conspiracy"
                  className="bg-card/50 border-brass/20"
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger className="bg-card/50 border-brass/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="dormant">Dormant</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="What's this thread about?"
                className="bg-card/50 border-brass/20 min-h-[80px]"
              />
            </div>

            <Tabs defaultValue="truth">
              <TabsList className="bg-card/50 border border-brass/20">
                <TabsTrigger value="truth" className="gap-1">
                  <EyeOff className="w-3 h-3" /> Hidden Truth
                </TabsTrigger>
                <TabsTrigger value="known" className="gap-1">
                  <Eye className="w-3 h-3" /> Party Knows
                </TabsTrigger>
                <TabsTrigger value="branches" className="gap-1">
                  <GitBranch className="w-3 h-3" /> Branches
                </TabsTrigger>
              </TabsList>
              <TabsContent value="truth" className="mt-2">
                <Textarea
                  value={form.truth}
                  onChange={(e) => setForm(f => ({ ...f, truth: e.target.value }))}
                  placeholder="The real truth behind this mystery..."
                  className="bg-card/50 border-brass/20 min-h-[100px]"
                />
              </TabsContent>
              <TabsContent value="known" className="mt-2">
                <Textarea
                  value={form.party_knowledge}
                  onChange={(e) => setForm(f => ({ ...f, party_knowledge: e.target.value }))}
                  placeholder="What the party currently knows or believes..."
                  className="bg-card/50 border-brass/20 min-h-[100px]"
                />
              </TabsContent>
              <TabsContent value="branches" className="mt-2">
                <Textarea
                  value={form.branching_notes}
                  onChange={(e) => setForm(f => ({ ...f, branching_notes: e.target.value }))}
                  placeholder="If the party does X, then Y happens..."
                  className="bg-card/50 border-brass/20 min-h-[100px]"
                />
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setShowCreate(false); resetForm(); setSelectedThread(null); }}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                {selectedThread ? "Save Changes" : "Create Thread"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
