import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { FileText, Edit, Save, Plus, Trash2, Star, Quote, DollarSign, Eye } from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";

interface CMSBlock {
  id: string;
  section: "hero" | "features" | "about" | "contact" | "footer";
  title: string;
  content: string;
  isActive: boolean;
  order: number;
  lastModified: string;
}

interface Testimonial {
  id: string;
  name: string;
  role: string;
  company: string;
  content: string;
  rating: number;
  avatarUrl?: string;
  isActive: boolean;
  createdAt: string;
}

interface PricingContent {
  id: string;
  planTier: string;
  title: string;
  subtitle: string;
  bulletPoints: string[];
  ctaText: string;
  isActive: boolean;
}

export default function AdminContent() {
  const [selectedBlock, setSelectedBlock] = useState<CMSBlock | null>(null);
  const [selectedTestimonial, setSelectedTestimonial] = useState<Testimonial | null>(null);
  const [isBlockDialogOpen, setIsBlockDialogOpen] = useState(false);
  const [isTestimonialDialogOpen, setIsTestimonialDialogOpen] = useState(false);
  const [blockForm, setBlockForm] = useState({
    section: "hero" as const,
    title: "",
    content: "",
    isActive: true,
    order: 1,
  });
  const [testimonialForm, setTestimonialForm] = useState({
    name: "",
    role: "",
    company: "",
    content: "",
    rating: 5,
    avatarUrl: "",
    isActive: true,
  });
  const { toast } = useToast();

  const { data: cmsBlocks = [], isLoading: blocksLoading } = useQuery<CMSBlock[]>({
    queryKey: ["/api/admin/cms-blocks"],
  });

  const { data: testimonials = [], isLoading: testimonialsLoading } = useQuery<Testimonial[]>({
    queryKey: ["/api/admin/testimonials"],
  });

  const { data: pricingContent = [], isLoading: pricingLoading } = useQuery<PricingContent[]>({
    queryKey: ["/api/admin/pricing-content"],
  });

  const createBlockMutation = useMutation({
    mutationFn: async (blockData: any) => {
      const response = await apiRequest("POST", "/api/admin/cms-blocks", blockData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/cms-blocks"] });
      setIsBlockDialogOpen(false);
      resetBlockForm();
      toast({
        title: "Content Block Created",
        description: "Content block has been created successfully.",
      });
    },
  });

  const updateBlockMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiRequest("PUT", `/api/admin/cms-blocks/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/cms-blocks"] });
      setIsBlockDialogOpen(false);
      setSelectedBlock(null);
      toast({
        title: "Content Updated",
        description: "Content block has been updated successfully.",
      });
    },
  });

  const createTestimonialMutation = useMutation({
    mutationFn: async (testimonialData: any) => {
      const response = await apiRequest("POST", "/api/admin/testimonials", testimonialData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/testimonials"] });
      setIsTestimonialDialogOpen(false);
      resetTestimonialForm();
      toast({
        title: "Testimonial Created",
        description: "Testimonial has been created successfully.",
      });
    },
  });

  const updateTestimonialMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiRequest("PUT", `/api/admin/testimonials/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/testimonials"] });
      setIsTestimonialDialogOpen(false);
      setSelectedTestimonial(null);
      toast({
        title: "Testimonial Updated",
        description: "Testimonial has been updated successfully.",
      });
    },
  });

  const deleteBlockMutation = useMutation({
    mutationFn: async (blockId: string) => {
      const response = await apiRequest("DELETE", `/api/admin/cms-blocks/${blockId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/cms-blocks"] });
      toast({
        title: "Content Deleted",
        description: "Content block has been deleted successfully.",
      });
    },
  });

  const resetBlockForm = () => {
    setBlockForm({
      section: "hero",
      title: "",
      content: "",
      isActive: true,
      order: 1,
    });
  };

  const resetTestimonialForm = () => {
    setTestimonialForm({
      name: "",
      role: "",
      company: "",
      content: "",
      rating: 5,
      avatarUrl: "",
      isActive: true,
    });
  };

  const handleEditBlock = (block: CMSBlock) => {
    setSelectedBlock(block);
    setBlockForm({
      section: block.section,
      title: block.title,
      content: block.content,
      isActive: block.isActive,
      order: block.order,
    });
    setIsBlockDialogOpen(true);
  };

  const handleEditTestimonial = (testimonial: Testimonial) => {
    setSelectedTestimonial(testimonial);
    setTestimonialForm({
      name: testimonial.name,
      role: testimonial.role,
      company: testimonial.company,
      content: testimonial.content,
      rating: testimonial.rating,
      avatarUrl: testimonial.avatarUrl || "",
      isActive: testimonial.isActive,
    });
    setIsTestimonialDialogOpen(true);
  };

  const handleCreateBlock = () => {
    resetBlockForm();
    setSelectedBlock(null);
    setIsBlockDialogOpen(true);
  };

  const handleCreateTestimonial = () => {
    resetTestimonialForm();
    setSelectedTestimonial(null);
    setIsTestimonialDialogOpen(true);
  };

  const handleSaveBlock = () => {
    if (selectedBlock) {
      updateBlockMutation.mutate({ id: selectedBlock.id, data: blockForm });
    } else {
      createBlockMutation.mutate(blockForm);
    }
  };

  const handleSaveTestimonial = () => {
    if (selectedTestimonial) {
      updateTestimonialMutation.mutate({ id: selectedTestimonial.id, data: testimonialForm });
    } else {
      createTestimonialMutation.mutate(testimonialForm);
    }
  };

  const getSectionIcon = (section: string) => {
    switch (section) {
      case "hero":
        return <Star className="h-4 w-4 text-yellow-500" />;
      case "features":
        return <FileText className="h-4 w-4 text-blue-500" />;
      case "about":
        return <Eye className="h-4 w-4 text-green-500" />;
      case "contact":
        return <FileText className="h-4 w-4 text-purple-500" />;
      case "footer":
        return <FileText className="h-4 w-4 text-gray-500" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < rating ? "text-yellow-500 fill-current" : "text-gray-300"}`}
      />
    ));
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar className="hidden md:flex" />
      
      <div className="flex-1 flex flex-col overflow-hidden ml-0 md:ml-64">
        <Header 
          title="Content Management" 
          subtitle="Manage home page content, testimonials, and pricing information" 
        />
        
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="space-y-6">

      <Tabs defaultValue="cms" className="space-y-4">
        <TabsList>
          <TabsTrigger value="cms">Website Content</TabsTrigger>
          <TabsTrigger value="testimonials">Testimonials</TabsTrigger>
          <TabsTrigger value="pricing">Pricing Content</TabsTrigger>
        </TabsList>

        <TabsContent value="cms" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Website Content Blocks</h2>
            <Button onClick={handleCreateBlock}>
              <Plus className="h-4 w-4 mr-2" />
              Add Content Block
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {blocksLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-20 bg-gray-200 rounded"></div>
                  </CardContent>
                </Card>
              ))
            ) : (
              cmsBlocks.map((block) => (
                <Card key={block.id} className={!block.isActive ? "opacity-60" : ""}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex items-center space-x-2">
                        {getSectionIcon(block.section)}
                        <div>
                          <CardTitle className="text-lg">{block.title}</CardTitle>
                          <CardDescription className="capitalize">{block.section} section</CardDescription>
                        </div>
                      </div>
                      <Badge variant={block.isActive ? "default" : "secondary"}>
                        {block.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {block.content}
                      </p>
                      <div className="text-xs text-muted-foreground">
                        Order: {block.order} • Modified: {new Date(block.lastModified).toLocaleDateString()}
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditBlock(block)}
                          className="flex-1"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteBlockMutation.mutate(block.id)}
                          disabled={deleteBlockMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="testimonials" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Customer Testimonials</h2>
            <Button onClick={handleCreateTestimonial}>
              <Plus className="h-4 w-4 mr-2" />
              Add Testimonial
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {testimonialsLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-16 bg-gray-200 rounded"></div>
                  </CardContent>
                </Card>
              ))
            ) : (
              testimonials.map((testimonial) => (
                <Card key={testimonial.id} className={!testimonial.isActive ? "opacity-60" : ""}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex items-center space-x-3">
                        <Quote className="h-5 w-5 text-blue-500" />
                        <div>
                          <CardTitle className="text-lg">{testimonial.name}</CardTitle>
                          <CardDescription>{testimonial.role} at {testimonial.company}</CardDescription>
                        </div>
                      </div>
                      <Badge variant={testimonial.isActive ? "default" : "secondary"}>
                        {testimonial.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex space-x-1">
                        {renderStars(testimonial.rating)}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        "{testimonial.content}"
                      </p>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditTestimonial(testimonial)}
                          className="flex-1"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="pricing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pricing Page Content</CardTitle>
              <CardDescription>Manage pricing plan descriptions and call-to-action text</CardDescription>
            </CardHeader>
            <CardContent>
              {pricingLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-20 bg-gray-100 rounded animate-pulse"></div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {pricingContent.map((content) => (
                    <div key={content.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <DollarSign className="h-5 w-5 text-green-500" />
                        <div>
                          <h4 className="font-medium">{content.title}</h4>
                          <p className="text-sm text-muted-foreground capitalize">{content.planTier} plan</p>
                          <p className="text-sm text-muted-foreground">{content.subtitle}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={content.isActive ? "default" : "secondary"}>
                          {content.isActive ? "Active" : "Inactive"}
                        </Badge>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Content Block Dialog */}
      <Dialog open={isBlockDialogOpen} onOpenChange={setIsBlockDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedBlock ? "Edit Content Block" : "Create Content Block"}
            </DialogTitle>
            <DialogDescription>
              {selectedBlock ? "Update website content" : "Add new content to your website"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="section">Section</Label>
                <select
                  id="section"
                  value={blockForm.section}
                  onChange={(e) => setBlockForm(prev => ({ ...prev, section: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-border rounded-md"
                >
                  <option value="hero">Hero</option>
                  <option value="features">Features</option>
                  <option value="about">About</option>
                  <option value="contact">Contact</option>
                  <option value="footer">Footer</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="order">Display Order</Label>
                <Input
                  id="order"
                  type="number"
                  value={blockForm.order}
                  onChange={(e) => setBlockForm(prev => ({ ...prev, order: Number(e.target.value) }))}
                  min="1"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={blockForm.title}
                onChange={(e) => setBlockForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Content block title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                value={blockForm.content}
                onChange={(e) => setBlockForm(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Content block text..."
                rows={6}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={blockForm.isActive}
                onCheckedChange={(checked) => setBlockForm(prev => ({ ...prev, isActive: checked }))}
              />
              <Label>Make this content visible</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBlockDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveBlock} disabled={createBlockMutation.isPending || updateBlockMutation.isPending}>
              <Save className="h-4 w-4 mr-2" />
              {createBlockMutation.isPending || updateBlockMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Testimonial Dialog */}
      <Dialog open={isTestimonialDialogOpen} onOpenChange={setIsTestimonialDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedTestimonial ? "Edit Testimonial" : "Create Testimonial"}
            </DialogTitle>
            <DialogDescription>
              {selectedTestimonial ? "Update customer testimonial" : "Add new customer testimonial"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Customer Name</Label>
                <Input
                  id="name"
                  value={testimonialForm.name}
                  onChange={(e) => setTestimonialForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rating">Rating (1-5)</Label>
                <Input
                  id="rating"
                  type="number"
                  min="1"
                  max="5"
                  value={testimonialForm.rating}
                  onChange={(e) => setTestimonialForm(prev => ({ ...prev, rating: Number(e.target.value) }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Input
                  id="role"
                  value={testimonialForm.role}
                  onChange={(e) => setTestimonialForm(prev => ({ ...prev, role: e.target.value }))}
                  placeholder="CEO"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  value={testimonialForm.company}
                  onChange={(e) => setTestimonialForm(prev => ({ ...prev, company: e.target.value }))}
                  placeholder="Tech Company Inc."
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="testimonial-content">Testimonial</Label>
              <Textarea
                id="testimonial-content"
                value={testimonialForm.content}
                onChange={(e) => setTestimonialForm(prev => ({ ...prev, content: e.target.value }))}
                placeholder="This product has transformed our business..."
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="avatar">Avatar URL (optional)</Label>
              <Input
                id="avatar"
                value={testimonialForm.avatarUrl}
                onChange={(e) => setTestimonialForm(prev => ({ ...prev, avatarUrl: e.target.value }))}
                placeholder="https://example.com/avatar.jpg"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={testimonialForm.isActive}
                onCheckedChange={(checked) => setTestimonialForm(prev => ({ ...prev, isActive: checked }))}
              />
              <Label>Display this testimonial</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTestimonialDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveTestimonial} disabled={createTestimonialMutation.isPending || updateTestimonialMutation.isPending}>
              <Save className="h-4 w-4 mr-2" />
              {createTestimonialMutation.isPending || updateTestimonialMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
          </div>
        </main>
      </div>
    </div>
  );
}