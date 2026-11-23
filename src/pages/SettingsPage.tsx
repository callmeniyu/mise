import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Building2,
  Database,
  RotateCcw,
  Download,
  Upload,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { toast } from 'sonner';
import { useProfile, useUpdateProfile } from '@/hooks/api';
import { storageService } from '@/services/storage.service';
import { profileService } from '@/services/profile.service';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const updateProfileMutation = useUpdateProfile();

  const [formData, setFormData] = useState(() => {
    const p = profileService.getProfile();
    return {
      name: p?.name || '',
      tagline: p?.tagline || '',
      email: p?.email || '',
      phone: p?.phone || '',
      address: p?.address || '',
      city: p?.city || '',
      currency: p?.currency || 'AED',
      currencySymbol: p?.currencySymbol || 'AED ',
      taxNumber: p?.taxNumber || '',
    };
  });

  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');
  const [isImportOpen, setIsImportOpen] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Business name is required');
      return;
    }

    updateProfileMutation.mutate(formData, {
      onSuccess: () => toast.success('Business settings updated'),
      onError: () => toast.error('Failed to update business settings'),
    });
  };

  const handleResetToSeed = () => {
    storageService.resetToSeed();
    queryClient.invalidateQueries();
    toast.success('Database safely reset to original Mise seed demonstration data');
    setIsResetConfirmOpen(false);
  };

  const handleExportData = () => {
    const jsonString = storageService.exportDataset();
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mise-operations-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Mise operations dataset exported to JSON');
  };

  const handleImportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!importJsonText.trim()) {
      toast.error('Please paste JSON dataset string');
      return;
    }

    const result = storageService.importDataset(importJsonText);
    if (!result.success) {
      toast.error(result.error || 'Failed to import dataset');
    } else {
      queryClient.invalidateQueries();
      toast.success('Dataset successfully restored into browser local storage!');
      setIsImportOpen(false);
      setImportJsonText('');
    }
  };

  return (
    <DashboardLayout
      title="Business Configuration & Data"
      subtitle="Establishment identity, currency localization, demo database manager, and backups"
    >
      <div className="max-w-4xl space-y-6">
        {/* Business Identity Form */}
        <div className="card-premium p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-charcoal text-white flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display text-lg font-bold text-foreground">
                Hospitality Atelier Identity
              </h3>
              <p className="text-xs text-muted-foreground">
                Appears on event contracts, proposal PDFs, and client receipts
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="bizName" className="font-semibold text-xs">Business Name *</Label>
                <Input
                  id="bizName"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 h-9 bg-card text-xs"
                />
              </div>

              <div>
                <Label htmlFor="bizTagline" className="font-semibold text-xs">Tagline / Subtitle</Label>
                <Input
                  id="bizTagline"
                  value={formData.tagline}
                  onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                  className="mt-1 h-9 bg-card text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="bizEmail" className="font-semibold text-xs">Concierge Email</Label>
                <Input
                  id="bizEmail"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="mt-1 h-9 bg-card text-xs"
                />
              </div>

              <div>
                <Label htmlFor="bizPhone" className="font-semibold text-xs">Direct Line / Phone</Label>
                <Input
                  id="bizPhone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="mt-1 h-9 bg-card text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <Label htmlFor="bizAddress" className="font-semibold text-xs">Kitchen / Office Address</Label>
                <Input
                  id="bizAddress"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="mt-1 h-9 bg-card text-xs"
                />
              </div>

              <div>
                <Label htmlFor="bizCity" className="font-semibold text-xs">City</Label>
                <Input
                  id="bizCity"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="mt-1 h-9 bg-card text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-border">
              <div>
                <Label htmlFor="bizCurrency" className="font-semibold text-xs">Currency Code</Label>
                <Input
                  id="bizCurrency"
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="mt-1 h-9 bg-card text-xs uppercase"
                />
              </div>

              <div>
                <Label htmlFor="bizSymbol" className="font-semibold text-xs">Currency Display Prefix</Label>
                <Input
                  id="bizSymbol"
                  value={formData.currencySymbol}
                  onChange={(e) => setFormData({ ...formData, currencySymbol: e.target.value })}
                  className="mt-1 h-9 bg-card text-xs"
                />
              </div>

              <div>
                <Label htmlFor="bizTax" className="font-semibold text-xs">Tax Registration NTN</Label>
                <Input
                  id="bizTax"
                  value={formData.taxNumber}
                  onChange={(e) => setFormData({ ...formData, taxNumber: e.target.value })}
                  className="mt-1 h-9 bg-card text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                disabled={updateProfileMutation.isPending}
                className="bg-charcoal text-white hover:bg-charcoal/90 text-xs h-9 px-5"
              >
                Save Business Profile
              </Button>
            </div>
          </form>
        </div>

        {/* Database & Local Storage Management */}
        <div className="card-premium p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-sage-light text-success flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display text-lg font-bold text-foreground">
                LocalStorage Database Architecture
              </h3>
              <p className="text-xs text-muted-foreground">
                Standalone browser data persistence engine (schema v1)
              </p>
            </div>
          </div>

          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-secondary/50 border border-border flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-foreground">State Isolation:</span>
                  <span className="text-sage font-bold font-mono">mise:database:v1</span>
                </div>
                <p className="text-secondary-foreground mt-1">
                  All contracts, dishes, ingredients, suppliers, and payment transactions are safely persisted in your browser's private local storage partition. No external cloud process or server is invoked.
                </p>
              </div>

              <div className="flex-shrink-0 flex items-center gap-1.5 text-success font-semibold">
                <CheckCircle2 className="w-4 h-4 text-sage" />
                <span>Operational</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <Button
                variant="outline"
                onClick={handleExportData}
                className="h-9 text-xs border-border hover:bg-secondary justify-center"
              >
                <Download className="w-4 h-4 mr-1.5 text-muted-foreground" />
                Export JSON Dataset
              </Button>

              <Button
                variant="outline"
                onClick={() => setIsImportOpen(true)}
                className="h-9 text-xs border-border hover:bg-secondary justify-center"
              >
                <Upload className="w-4 h-4 mr-1.5 text-muted-foreground" />
                Import JSON Backup
              </Button>

              <Button
                variant="outline"
                onClick={() => setIsResetConfirmOpen(true)}
                className="h-9 text-xs border-destructive/30 text-destructive hover:bg-destructive-light hover:text-destructive justify-center"
              >
                <RotateCcw className="w-4 h-4 mr-1.5" />
                Reset to Seed Data
              </Button>
            </div>
          </div>
        </div>

        {/* Demo Authentication Profile */}
        <div className="card-premium p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-butter-light text-warning flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display text-base font-bold text-foreground">
                  Demo Authentication Identity
                </h3>
                <p className="text-xs text-muted-foreground">Local session attributes</p>
              </div>
            </div>

            <Badge variant="outline" className="text-[10px] bg-secondary text-foreground border-border uppercase">
              {user?.role || 'Admin'}
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-secondary/30 rounded-xl text-xs">
            <div>
              <span className="text-[10px] text-muted-foreground uppercase font-semibold">Active User</span>
              <p className="font-bold text-foreground mt-0.5">{user?.firstName} {user?.lastName}</p>
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground uppercase font-semibold">Demo Email</span>
              <p className="font-semibold text-foreground font-mono mt-0.5">{user?.email}</p>
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground uppercase font-semibold">Storage Key</span>
              <p className="font-mono text-muted-foreground mt-0.5">mise:session:v1</p>
            </div>
          </div>
        </div>
      </div>

      {/* Reset Confirmation Dialog */}
      <Dialog open={isResetConfirmOpen} onOpenChange={setIsResetConfirmOpen}>
        <DialogContent className="max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="font-display text-lg font-bold text-destructive flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Reset Demo Dataset?
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-2 leading-relaxed">
              This will restore the original Mise demonstration dataset (15 culinary recipes, 24 inventory ingredients, 24 event orders, 18 purchases, and 20 simulated payments). Any manual additions or changes you created will be reset.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setIsResetConfirmOpen(false)}
              className="text-xs h-9"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleResetToSeed}
              className="text-xs h-9"
            >
              Confirm Full Reset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import JSON Dialog */}
      <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
        <DialogContent className="max-w-lg p-6">
          <form onSubmit={handleImportSubmit} className="space-y-4">
            <DialogHeader>
              <DialogTitle className="font-display text-lg font-bold">Import Mise JSON Dataset</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Paste a valid exported Mise JSON database string to restore your environment.
              </DialogDescription>
            </DialogHeader>

            <div>
              <Label className="font-semibold text-xs">JSON Content</Label>
              <textarea
                rows={8}
                required
                placeholder='{"version": 1, "orders": [...]}'
                value={importJsonText}
                onChange={(e) => setImportJsonText(e.target.value)}
                className="w-full mt-1 p-3 bg-secondary/40 font-mono text-xs rounded-lg border border-border focus:border-charcoal focus:outline-hidden"
              />
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setIsImportOpen(false)} className="text-xs h-9">
                Cancel
              </Button>
              <Button type="submit" className="bg-charcoal text-white hover:bg-charcoal/90 text-xs h-9">
                Validate & Import
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
