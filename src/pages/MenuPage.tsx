import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import {
  Plus,
  Search,
  UtensilsCrossed,
  TrendingUp,
  Edit,
  Trash2,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import {
  useMenuItems,
  useCreateMenuItem,
  useUpdateMenuItem,
  useDeleteMenuItem,
} from '@/hooks/api';
import { MenuItem, DishCategory } from '@/types';
import { toast } from 'sonner';

const CATEGORIES: DishCategory[] = [
  'Main',
  'BBQ',
  'Rice',
  'Dessert',
  'Live Station',
  'Appetizer',
  'Beverage',
];

const categoryBadgeStyles: Record<DishCategory, string> = {
  Main: 'bg-charcoal text-white',
  BBQ: 'bg-terracotta text-white',
  Rice: 'bg-butter-light text-warning border-butter',
  Dessert: 'bg-secondary text-foreground border-border',
  'Live Station': 'bg-sage-light text-success border-sage/30',
  Appetizer: 'bg-info-light text-info border-info/30',
  Beverage: 'bg-secondary text-secondary-foreground border-border',
};

export default function MenuPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<MenuItem | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'Main' as DishCategory,
    costPerServing: 250,
    sellingPrice: 600,
    prepTimeMinutes: 30,
    isAvailable: true,
    ingredientsText: 'Aged basmati, clarified butter, whole spices',
  });

  const { data: menuItems = [], isLoading } = useMenuItems();
  const createMutation = useCreateMenuItem();
  const updateMutation = useUpdateMenuItem();
  const deleteMutation = useDeleteMenuItem();

  // Filtered Items
  const filteredItems = menuItems.filter((item) => {
    const matchSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchCategory = categoryFilter === 'all' || item.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  // Summary Metrics
  const totalItems = menuItems.length;
  const activeCount = menuItems.filter((i) => i.isAvailable).length;
  const avgMargin =
    menuItems.length > 0
      ? Math.round((menuItems.reduce((acc, i) => acc + (i.marginPercent || 0), 0) / menuItems.length) * 10) / 10
      : 0;

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      description: '',
      category: 'Main',
      costPerServing: 250,
      sellingPrice: 600,
      prepTimeMinutes: 30,
      isAvailable: true,
      ingredientsText: '',
    });
    setIsAddOpen(true);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Dish title is required');
      return;
    }

    const ingredients = formData.ingredientsText
      ? formData.ingredientsText.split(',').map((s) => s.trim()).filter(Boolean)
      : [];

    createMutation.mutate(
      {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        costPerServing: formData.costPerServing,
        sellingPrice: formData.sellingPrice,
        prepTimeMinutes: formData.prepTimeMinutes,
        isAvailable: formData.isAvailable,
        ingredients,
      },
      {
        onSuccess: () => {
          toast.success('New dish added to menu repertoire');
          setIsAddOpen(false);
        },
        onError: () => toast.error('Failed to add dish'),
      }
    );
  };

  const handleOpenEdit = (item: MenuItem) => {
    setSelectedItem(item);
    setFormData({
      name: item.name,
      description: item.description || '',
      category: item.category,
      costPerServing: item.costPerServing,
      sellingPrice: item.sellingPrice,
      prepTimeMinutes: item.prepTimeMinutes || 30,
      isAvailable: item.isAvailable,
      ingredientsText: item.ingredients?.join(', ') || '',
    });
    setIsEditOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    const ingredients = formData.ingredientsText
      ? formData.ingredientsText.split(',').map((s) => s.trim()).filter(Boolean)
      : [];

    updateMutation.mutate(
      {
        id: selectedItem.id,
        data: {
          name: formData.name,
          description: formData.description,
          category: formData.category,
          costPerServing: formData.costPerServing,
          sellingPrice: formData.sellingPrice,
          prepTimeMinutes: formData.prepTimeMinutes,
          isAvailable: formData.isAvailable,
          ingredients,
        },
      },
      {
        onSuccess: () => {
          toast.success('Dish recipe & costing updated');
          setIsEditOpen(false);
          setSelectedItem(null);
        },
        onError: () => toast.error('Failed to update dish'),
      }
    );
  };

  const handleToggleAvailability = (item: MenuItem) => {
    updateMutation.mutate(
      {
        id: item.id,
        data: { isAvailable: !item.isAvailable },
      },
      {
        onSuccess: () =>
          toast.success(`${item.name} is now ${!item.isAvailable ? 'available' : 'unavailable'}`),
        onError: () => toast.error('Failed to toggle availability'),
      }
    );
  };

  const handleDeleteConfirm = () => {
    if (!deleteConfirmItem) return;
    deleteMutation.mutate(deleteConfirmItem.id, {
      onSuccess: () => {
        toast.success(`"${deleteConfirmItem.name}" deleted from menu`);
        setDeleteConfirmItem(null);
      },
      onError: () => toast.error('Failed to delete dish'),
    });
  };

  return (
    <DashboardLayout
      title="Menu & Food Costing"
      subtitle="Recipe development, portion margins, cost of goods, and service availability"
      actions={
        <Button
          onClick={handleOpenAdd}
          className="bg-terracotta hover:bg-terracotta/90 text-white shadow-xs text-xs h-9"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Add Dish
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Metric Cards Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="card-premium p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                Total Recipes
              </p>
              <p className="font-display text-2xl font-bold text-foreground mt-1">{totalItems}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-charcoal text-white flex items-center justify-center">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
          </div>

          <div className="card-premium p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                Active in Service
              </p>
              <p className="font-display text-2xl font-bold text-success mt-1">{activeCount}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-sage-light text-success flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          <div className="card-premium p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                Average Portfolio Margin
              </p>
              <p className="font-display text-2xl font-bold text-terracotta mt-1">{avgMargin}%</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-terracotta-light text-terracotta flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="card-premium p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex-1 flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            <div className="relative min-w-[220px] flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search dishes or descriptions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9 bg-card text-xs border-border"
              />
            </div>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[150px] h-9 text-xs bg-card border-border">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <p className="text-xs font-medium text-muted-foreground self-end sm:self-center">
            Showing <span className="font-bold text-foreground">{filteredItems.length}</span> items
          </p>
        </div>

        {/* Menu Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {isLoading ? (
            <div className="col-span-full py-12 text-center text-xs text-muted-foreground">
              Loading menu catalog...
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="col-span-full card-premium p-12 text-center text-sm text-muted-foreground">
              No dishes found matching your search.
            </div>
          ) : (
            filteredItems.map((dish) => {
              const profit = dish.sellingPrice - dish.costPerServing;
              const isHighMargin = dish.marginPercent >= 55;

              return (
                <div
                  key={dish.id}
                  className={cn(
                    'card-premium p-5 flex flex-col justify-between transition-all group',
                    !dish.isAvailable ? 'opacity-70 bg-card/60' : ''
                  )}
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <Badge className={cn('text-[10px] font-semibold shadow-none', categoryBadgeStyles[dish.category])}>
                        {dish.category}
                      </Badge>

                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-muted-foreground">
                          {dish.isAvailable ? 'In Service' : '86’d'}
                        </span>
                        <Switch
                          checked={dish.isAvailable}
                          onCheckedChange={() => handleToggleAvailability(dish)}
                          className="scale-75 data-[state=checked]:bg-sage"
                        />
                      </div>
                    </div>

                    <h3 className="font-display text-lg font-bold text-foreground group-hover:text-terracotta transition-colors">
                      {dish.name}
                    </h3>

                    {dish.description && (
                      <p className="text-xs text-secondary-foreground leading-relaxed mt-1.5 line-clamp-2">
                        {dish.description}
                      </p>
                    )}

                    {/* Ingredients tags */}
                    {dish.ingredients && dish.ingredients.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {dish.ingredients.slice(0, 3).map((ing, i) => (
                          <span
                            key={i}
                            className="text-[10px] px-2 py-0.5 rounded bg-secondary text-secondary-foreground"
                          >
                            {ing}
                          </span>
                        ))}
                        {dish.ingredients.length > 3 && (
                          <span className="text-[10px] px-1.5 py-0.5 text-muted-foreground font-semibold">
                            +{dish.ingredients.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Pricing and Margin Ledger */}
                  <div className="mt-5 pt-3 border-t border-border">
                    <div className="grid grid-cols-3 gap-2 text-center py-2 px-1 bg-secondary/40 rounded-xl mb-3">
                      <div>
                        <span className="text-[10px] text-muted-foreground font-medium uppercase">
                          Portion Cost
                        </span>
                        <p className="font-semibold text-xs text-foreground mt-0.5">
                          AED {dish.costPerServing}
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground font-medium uppercase">
                          Selling Price
                        </span>
                        <p className="font-bold text-xs text-foreground mt-0.5">
                          AED {dish.sellingPrice}
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground font-medium uppercase">
                          Margin
                        </span>
                        <p
                          className={cn(
                            'font-bold text-xs mt-0.5',
                            isHighMargin ? 'text-success' : 'text-warning'
                          )}
                        >
                          {dish.marginPercent}%
                        </p>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] text-muted-foreground font-mono">
                        Profit: AED {profit}/portion
                      </span>

                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-secondary"
                          onClick={() => handleOpenEdit(dish)}
                          title="Edit Recipe"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive-light"
                          onClick={() => setDeleteConfirmItem(dish)}
                          title="Delete Dish"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Add Dish Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-6">
          <form onSubmit={handleAddSubmit} className="space-y-4">
            <DialogHeader>
              <DialogTitle className="font-display text-xl font-bold">Add Recipe & Dish</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Set selling price and ingredient cost to calculate margin automatically.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 text-xs">
              <div>
                <Label htmlFor="dishName" className="font-semibold text-xs">Dish Title *</Label>
                <Input
                  id="dishName"
                  required
                  placeholder="e.g. Saffron Silk Biryani"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 h-9 bg-card text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="dishCategory" className="font-semibold text-xs">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(val: any) => setFormData({ ...formData, category: val })}
                  >
                    <SelectTrigger className="mt-1 h-9 text-xs bg-card">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="prepTime" className="font-semibold text-xs">Prep Time (mins)</Label>
                  <Input
                    id="prepTime"
                    type="number"
                    min="5"
                    value={formData.prepTimeMinutes}
                    onChange={(e) => setFormData({ ...formData, prepTimeMinutes: Number(e.target.value) })}
                    className="mt-1 h-9 bg-card text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="costServing" className="font-semibold text-xs">Cost Per Serving (AED) *</Label>
                  <Input
                    id="costServing"
                    type="number"
                    min="0"
                    required
                    value={formData.costPerServing}
                    onChange={(e) => setFormData({ ...formData, costPerServing: Number(e.target.value) })}
                    className="mt-1 h-9 bg-card text-xs"
                  />
                </div>

                <div>
                  <Label htmlFor="sellPrice" className="font-semibold text-xs">Selling Price (AED) *</Label>
                  <Input
                    id="sellPrice"
                    type="number"
                    min="1"
                    required
                    value={formData.sellingPrice}
                    onChange={(e) => setFormData({ ...formData, sellingPrice: Number(e.target.value) })}
                    className="mt-1 h-9 bg-card text-xs"
                  />
                </div>
              </div>

              {/* Live Margin Calculation Preview */}
              <div className="p-3 bg-secondary/50 rounded-xl flex items-center justify-between text-xs">
                <span>Calculated Profit Margin:</span>
                <span className="font-bold text-sm text-terracotta">
                  {formData.sellingPrice > 0
                    ? `${(((formData.sellingPrice - formData.costPerServing) / formData.sellingPrice) * 100).toFixed(1)}%`
                    : '0%'}
                </span>
              </div>

              <div>
                <Label htmlFor="description" className="font-semibold text-xs">Culinary Description</Label>
                <Textarea
                  id="description"
                  rows={2}
                  placeholder="Editorial description for guest banquets and menus..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mt-1 bg-card text-xs"
                />
              </div>

              <div>
                <Label htmlFor="ingredients" className="font-semibold text-xs">
                  Key Ingredients (comma separated)
                </Label>
                <Input
                  id="ingredients"
                  placeholder="e.g. Basmati Rice, Chicken, Saffron, Ghee"
                  value={formData.ingredientsText}
                  onChange={(e) => setFormData({ ...formData, ingredientsText: e.target.value })}
                  className="mt-1 h-9 bg-card text-xs"
                />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)} className="text-xs h-9">
                Cancel
              </Button>
              <Button type="submit" className="bg-terracotta hover:bg-terracotta/90 text-white text-xs h-9">
                Save Recipe
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dish Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-6">
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <DialogHeader>
              <DialogTitle className="font-display text-xl font-bold">Edit Dish</DialogTitle>
            </DialogHeader>

            <div className="space-y-3 text-xs">
              <div>
                <Label htmlFor="editName" className="font-semibold text-xs">Dish Title</Label>
                <Input
                  id="editName"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 h-9 bg-card text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="editCategory" className="font-semibold text-xs">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(val: any) => setFormData({ ...formData, category: val })}
                  >
                    <SelectTrigger className="mt-1 h-9 text-xs bg-card">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="editCost" className="font-semibold text-xs">Cost Per Serving (AED)</Label>
                  <Input
                    id="editCost"
                    type="number"
                    value={formData.costPerServing}
                    onChange={(e) => setFormData({ ...formData, costPerServing: Number(e.target.value) })}
                    className="mt-1 h-9 bg-card text-xs"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="editPrice" className="font-semibold text-xs">Selling Price (AED)</Label>
                <Input
                  id="editPrice"
                  type="number"
                  value={formData.sellingPrice}
                  onChange={(e) => setFormData({ ...formData, sellingPrice: Number(e.target.value) })}
                  className="mt-1 h-9 bg-card text-xs"
                />
              </div>

              <div>
                <Label htmlFor="editDesc" className="font-semibold text-xs">Description</Label>
                <Textarea
                  id="editDesc"
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mt-1 bg-card text-xs"
                />
              </div>

              <div>
                <Label htmlFor="editIngredients" className="font-semibold text-xs">Ingredients</Label>
                <Input
                  id="editIngredients"
                  value={formData.ingredientsText}
                  onChange={(e) => setFormData({ ...formData, ingredientsText: e.target.value })}
                  className="mt-1 h-9 bg-card text-xs"
                />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)} className="text-xs h-9">
                Cancel
              </Button>
              <Button type="submit" className="bg-charcoal text-white hover:bg-charcoal/90 text-xs h-9">
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirmItem} onOpenChange={(open) => !open && setDeleteConfirmItem(null)}>
        <DialogContent className="max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="font-display text-lg font-bold text-destructive">
              Delete Dish Repertoire
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-2">
              Are you sure you want to remove <span className="font-bold text-foreground">{deleteConfirmItem?.name}</span>?
              Historical order records will safely preserve existing contract history.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 mt-4">
            <Button variant="outline" onClick={() => setDeleteConfirmItem(null)} className="text-xs h-9">
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} className="text-xs h-9">
              Confirm Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
