import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Save, Trash2, Edit } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CustomAchievement {
  id: string;
  name: string;
  description: string;
  category: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  points: number;
  icon: string;
  target: number;
  progress: number;
  isCustom: boolean;
  createdAt: string;
}

interface CustomAchievementEditorProps {
  onSave: (achievement: CustomAchievement) => void;
  onDelete: (id: string) => void;
  customAchievements: CustomAchievement[];
}

const rarityOptions = [
  { value: 'common', label: 'Common', color: 'bg-gray-100 text-gray-800' },
  { value: 'uncommon', label: 'Uncommon', color: 'bg-green-100 text-green-800' },
  { value: 'rare', label: 'Rare', color: 'bg-blue-100 text-blue-800' },
  { value: 'epic', label: 'Epic', color: 'bg-purple-100 text-purple-800' },
  { value: 'legendary', label: 'Legendary', color: 'bg-yellow-100 text-yellow-800' },
];

const categoryOptions = [
  'trading', 'analysis', 'learning', 'milestone', 'streak', 'profit', 'risk-management', 'research'
];

const iconOptions = [
  '🎯', '📈', '⚡', '💎', '🚀', '🏆', '⭐', '🔥', '💪', '🎖️', '🥇', '👑', '🌟', '✨', '🎊'
];

export default function CustomAchievementEditor({ onSave, onDelete, customAchievements }: CustomAchievementEditorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingAchievement, setEditingAchievement] = useState<CustomAchievement | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'trading',
    rarity: 'common' as const,
    points: 100,
    icon: '🎯',
    target: 1
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: 'trading',
      rarity: 'common',
      points: 100,
      icon: '🎯',
      target: 1
    });
    setEditingAchievement(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.description.trim()) {
      return;
    }

    const achievement: CustomAchievement = {
      id: editingAchievement?.id || `custom-${Date.now()}`,
      name: formData.name,
      description: formData.description,
      category: formData.category,
      rarity: formData.rarity,
      points: formData.points,
      icon: formData.icon,
      target: formData.target,
      progress: editingAchievement?.progress || 0,
      isCustom: true,
      createdAt: editingAchievement?.createdAt || new Date().toISOString()
    };

    onSave(achievement);
    resetForm();
    setIsOpen(false);
  };

  const handleEdit = (achievement: CustomAchievement) => {
    setFormData({
      name: achievement.name,
      description: achievement.description,
      category: achievement.category,
      rarity: achievement.rarity,
      points: achievement.points,
      icon: achievement.icon,
      target: achievement.target
    });
    setEditingAchievement(achievement);
    setIsOpen(true);
  };

  const getRarityColor = (rarity: string) => {
    const option = rarityOptions.find(r => r.value === rarity);
    return option?.color || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Create New Achievement Button */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button className="w-full" onClick={() => resetForm()}>
            <Plus className="h-4 w-4 mr-2" />
            Create Custom Achievement
          </Button>
        </DialogTrigger>
        
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingAchievement ? 'Edit Achievement' : 'Create Custom Achievement'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Achievement Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Profit Master"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="e.g., Achieve $5,000+ in total profits"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map(category => (
                      <SelectItem key={category} value={category}>
                        {category.charAt(0).toUpperCase() + category.slice(1).replace('-', ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Rarity</Label>
                <Select value={formData.rarity} onValueChange={(value: any) => setFormData(prev => ({ ...prev, rarity: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {rarityOptions.map(rarity => (
                      <SelectItem key={rarity.value} value={rarity.value}>
                        {rarity.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="points">XP Points</Label>
                <Input
                  id="points"
                  type="number"
                  value={formData.points}
                  onChange={(e) => setFormData(prev => ({ ...prev, points: parseInt(e.target.value) || 0 }))}
                  min="50"
                  max="2000"
                  step="25"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="target">Target Value</Label>
                <Input
                  id="target"
                  type="number"
                  value={formData.target}
                  onChange={(e) => setFormData(prev => ({ ...prev, target: parseInt(e.target.value) || 1 }))}
                  min="1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Icon</Label>
              <div className="grid grid-cols-5 gap-2">
                {iconOptions.map(icon => (
                  <Button
                    key={icon}
                    type="button"
                    variant={formData.icon === icon ? 'default' : 'outline'}
                    className="h-12 text-xl"
                    onClick={() => setFormData(prev => ({ ...prev, icon }))}
                  >
                    {icon}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" className="flex-1">
                <Save className="h-4 w-4 mr-2" />
                {editingAchievement ? 'Update' : 'Create'}
              </Button>
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Custom Achievements List */}
      {customAchievements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your Custom Achievements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <AnimatePresence>
                {customAchievements.map((achievement) => (
                  <motion.div
                    key={achievement.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{achievement.icon}</div>
                      <div className="flex-1">
                        <h4 className="font-semibold">{achievement.name}</h4>
                        <p className="text-sm text-muted-foreground">{achievement.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={getRarityColor(achievement.rarity)}>
                            {achievement.rarity}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {achievement.progress}/{achievement.target} • +{achievement.points} XP
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(achievement)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDelete(achievement.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}