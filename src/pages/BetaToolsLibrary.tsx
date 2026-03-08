import { useState, useEffect, useCallback } from "react";
import { BetaToolsLayout } from "@/components/beta-tools/BetaToolsLayout";
import { BetaAssetCard, BetaAsset } from "@/components/beta-tools/BetaAssetCard";
import { BetaLibraryFilters } from "@/components/beta-tools/BetaLibraryFilters";
import { BetaAssetEditor } from "@/components/beta-tools/BetaAssetEditor";
import { BetaImportDialog } from "@/components/beta-tools/BetaImportDialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { FlaskConical, Plus } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const BetaToolsLibrary = () => {
  const { userId } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [assets, setAssets] = useState<BetaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [favoritesOnly, setFavoritesOnly] = useState(false);

  const [editingAsset, setEditingAsset] = useState<BetaAsset | null>(null);
  const [importingAsset, setImportingAsset] = useState<BetaAsset | null>(null);
  const [deletingAsset, setDeletingAsset] = useState<BetaAsset | null>(null);

  const fetchAssets = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    let query = supabase
      .from('beta_assets')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (typeFilter !== 'all') query = query.eq('asset_type', typeFilter);
    if (statusFilter !== 'all') query = query.eq('status', statusFilter);
    if (favoritesOnly) query = query.eq('is_favorite', true);

    const { data, error } = await query;
    if (error) {
      toast({ title: "Failed to load assets", variant: "destructive" });
    } else {
      setAssets(data as BetaAsset[]);
    }
    setLoading(false);
  }, [userId, typeFilter, statusFilter, favoritesOnly, toast]);

  useEffect(() => { fetchAssets(); }, [fetchAssets]);

  const filteredAssets = search
    ? assets.filter(a =>
        a.name.toLowerCase().includes(search.toLowerCase()) ||
        a.tags?.some(t => t.toLowerCase().includes(search.toLowerCase()))
      )
    : assets;

  const handleToggleFavorite = async (asset: BetaAsset) => {
    const { error } = await supabase.from('beta_assets').update({ is_favorite: !asset.is_favorite }).eq('id', asset.id);
    if (!error) {
      setAssets(prev => prev.map(a => a.id === asset.id ? { ...a, is_favorite: !a.is_favorite } : a));
    }
  };

  const handleDuplicate = async (asset: BetaAsset) => {
    if (!userId) return;
    const { error } = await supabase.from('beta_assets').insert({
      user_id: userId,
      asset_type: asset.asset_type,
      name: `${asset.name} (Copy)`,
      data: asset.data,
      tags: asset.tags,
      status: 'draft',
    });
    if (!error) {
      toast({ title: "Asset duplicated" });
      fetchAssets();
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingAsset) return;
    const { error } = await supabase.from('beta_assets').delete().eq('id', deletingAsset.id);
    if (!error) {
      setAssets(prev => prev.filter(a => a.id !== deletingAsset.id));
      toast({ title: "Asset deleted" });
    }
    setDeletingAsset(null);
  };

  return (
    <BetaToolsLayout title="My Library">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-cinzel text-2xl font-bold text-foreground">Beta Library</h1>
          <Button
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
            onClick={() => navigate('/beta-tools')}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create New
          </Button>
        </div>

        <BetaLibraryFilters
          search={search} onSearchChange={setSearch}
          typeFilter={typeFilter} onTypeFilterChange={setTypeFilter}
          statusFilter={statusFilter} onStatusFilterChange={setStatusFilter}
          favoritesOnly={favoritesOnly} onFavoritesOnlyChange={setFavoritesOnly}
        />

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="text-muted-foreground">Loading...</div>
          </div>
        ) : filteredAssets.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 space-y-3">
            <FlaskConical className="h-12 w-12 text-muted-foreground/30" />
            <p className="text-muted-foreground">No assets yet. Start creating!</p>
            <Button
              variant="outline"
              className="border-border text-muted-foreground hover:text-foreground"
              onClick={() => navigate('/beta-tools')}
            >
              Go to Workshop
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredAssets.map((asset) => (
              <BetaAssetCard
                key={asset.id}
                asset={asset}
                onEdit={(a) => setEditingAsset(a)}
                onDuplicate={handleDuplicate}
                onDelete={(a) => setDeletingAsset(a)}
                onToggleFavorite={handleToggleFavorite}
                onImport={(a) => setImportingAsset(a)}
              />
            ))}
          </div>
        )}
      </div>

      <BetaAssetEditor
        open={!!editingAsset}
        onOpenChange={(open) => !open && setEditingAsset(null)}
        asset={editingAsset}
        onSaved={fetchAssets}
      />

      <BetaImportDialog
        open={!!importingAsset}
        onOpenChange={(open) => !open && setImportingAsset(null)}
        asset={importingAsset}
        onImported={fetchAssets}
      />

      <AlertDialog open={!!deletingAsset} onOpenChange={(open) => !open && setDeletingAsset(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-cinzel">Delete "{deletingAsset?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this asset from your Beta Library. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </BetaToolsLayout>
  );
};

export default BetaToolsLibrary;
