import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { TopNavigation } from "@/components/layout/top-navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TemplateEditor } from "@/components/email/template-editor";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { PlusCircle, Search, FileText, Edit, Trash2, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getTemplates, createTemplate, updateTemplate, deleteTemplate } from "@/lib/api";
import type { EmailTemplate } from "@/types";

export default function Templates() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);
  const [isEditingTemplate, setIsEditingTemplate] = useState(false);
  const [isPreviewingTemplate, setIsPreviewingTemplate] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState<Partial<EmailTemplate>>({});
  const [templateToDelete, setTemplateToDelete] = useState<number | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch templates
  const { data: templates, isLoading, error } = useQuery({
    queryKey: ['/api/template'],
    queryFn: getTemplates
  });

  // Create template mutation
  const createTemplateMutation = useMutation({
    mutationFn: (data: Omit<EmailTemplate, 'id' | 'createdAt' | 'updatedAt'>) => createTemplate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/template'] });
      setIsCreatingTemplate(false);
      toast({
        title: "Template created",
        description: "Template has been created successfully",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create template: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  });

  // Update template mutation
  const updateTemplateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: Partial<Omit<EmailTemplate, 'id' | 'createdAt' | 'updatedAt'>> }) => 
      updateTemplate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/template'] });
      setIsEditingTemplate(false);
      toast({
        title: "Template updated",
        description: "Template has been updated successfully",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update template: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  });

  // Delete template mutation
  const deleteTemplateMutation = useMutation({
    mutationFn: (id: number) => deleteTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/template'] });
      setTemplateToDelete(null);
      toast({
        title: "Template deleted",
        description: "Template has been deleted successfully",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete template: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  });

  // Filter templates by search query
  const filteredTemplates = templates?.filter(template => 
    template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle template create
  const handleCreateTemplate = (templateData: Partial<EmailTemplate>) => {
    if (!templateData.name || !templateData.subject || !templateData.htmlContent || !templateData.textContent) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    
    createTemplateMutation.mutate({
      name: templateData.name,
      subject: templateData.subject,
      htmlContent: templateData.htmlContent,
      textContent: templateData.textContent
    });
  };

  // Handle template update
  const handleUpdateTemplate = (templateData: Partial<EmailTemplate>) => {
    if (!currentTemplate.id) return;
    
    updateTemplateMutation.mutate({
      id: currentTemplate.id,
      data: templateData
    });
  };

  // Handle template delete
  const handleDeleteTemplate = () => {
    if (templateToDelete === null) return;
    deleteTemplateMutation.mutate(templateToDelete);
  };

  return (
    <>
      <TopNavigation 
        title="Email Templates" 
        subtitle="Manage your email templates" 
      />
      
      <div className="p-4 sm:p-6 lg:p-8">
        {isCreatingTemplate ? (
          <>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Create New Template</h2>
              <Button variant="outline" onClick={() => setIsCreatingTemplate(false)}>
                Cancel
              </Button>
            </div>
            <TemplateEditor 
              onSave={handleCreateTemplate} 
              onCancel={() => setIsCreatingTemplate(false)}
              isSaving={createTemplateMutation.isPending}
            />
          </>
        ) : isEditingTemplate ? (
          <>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Edit Template: {currentTemplate.name}</h2>
              <Button variant="outline" onClick={() => setIsEditingTemplate(false)}>
                Cancel
              </Button>
            </div>
            <TemplateEditor 
              template={currentTemplate}
              onSave={handleUpdateTemplate}
              onCancel={() => setIsEditingTemplate(false)}
              isSaving={updateTemplateMutation.isPending}
            />
          </>
        ) : isPreviewingTemplate ? (
          <>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Preview Template: {currentTemplate.name}</h2>
              <Button variant="outline" onClick={() => setIsPreviewingTemplate(false)}>
                Close Preview
              </Button>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>{currentTemplate.name}</CardTitle>
                <CardDescription>Subject: {currentTemplate.subject}</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="html">
                  <TabsList className="mb-4">
                    <TabsTrigger value="html">HTML Preview</TabsTrigger>
                    <TabsTrigger value="text">Text Preview</TabsTrigger>
                    <TabsTrigger value="code">HTML Code</TabsTrigger>
                  </TabsList>
                  <TabsContent value="html">
                    <div 
                      className="border rounded-md p-4 min-h-[400px] bg-white"
                      dangerouslySetInnerHTML={{ __html: currentTemplate.htmlContent || '' }}
                    />
                  </TabsContent>
                  <TabsContent value="text">
                    <pre className="border rounded-md p-4 min-h-[400px] bg-white font-mono text-sm whitespace-pre-wrap">
                      {currentTemplate.textContent}
                    </pre>
                  </TabsContent>
                  <TabsContent value="code">
                    <pre className="border rounded-md p-4 min-h-[400px] bg-white font-mono text-sm whitespace-pre-wrap overflow-auto">
                      {currentTemplate.htmlContent}
                    </pre>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
              <h2 className="text-lg font-semibold">Email Templates</h2>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    type="search"
                    placeholder="Search templates..."
                    className="pl-9 w-[200px] md:w-[300px]"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as "grid" | "list")}>
                  <TabsList className="hidden md:flex">
                    <TabsTrigger value="grid">Grid View</TabsTrigger>
                    <TabsTrigger value="list">List View</TabsTrigger>
                  </TabsList>
                </Tabs>
                <Button onClick={() => setIsCreatingTemplate(true)}>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  New Template
                </Button>
              </div>
            </div>
            
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-64">
                <p className="text-red-500">Error loading templates</p>
              </div>
            ) : filteredTemplates?.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                <FileText className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">No templates found</h3>
                <p className="text-gray-500 text-center max-w-md mb-4">
                  {searchQuery ? 
                    `No templates matching "${searchQuery}"` : 
                    "You haven't created any email templates yet."}
                </p>
                {!searchQuery && (
                  <Button onClick={() => setIsCreatingTemplate(true)}>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Create your first template
                  </Button>
                )}
              </div>
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTemplates?.map(template => (
                  <Card key={template.id} className="flex flex-col overflow-hidden">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <CardDescription className="truncate">{template.subject}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 px-6 pb-2">
                      <div className="h-32 overflow-hidden text-sm text-gray-500 border-b">
                        <div 
                          className="text-xs opacity-75 overflow-hidden"
                          style={{ maxHeight: '100%' }}
                          dangerouslySetInnerHTML={{ 
                            __html: template.htmlContent.length > 250 ? 
                              template.htmlContent.substring(0, 250) + '...' : 
                              template.htmlContent 
                          }}
                        />
                      </div>
                      <div className="mt-4 flex justify-between items-center text-xs text-gray-500">
                        <span>Created: {new Date(template.createdAt).toLocaleDateString()}</span>
                        <span>ID: {template.id}</span>
                      </div>
                    </CardContent>
                    <div className="px-6 py-4 bg-gray-50 flex justify-between items-center">
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline" onClick={() => {
                          setCurrentTemplate(template);
                          setIsPreviewingTemplate(true);
                        }}>
                          <Eye className="h-4 w-4 mr-1" />
                          Preview
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => {
                          setCurrentTemplate(template);
                          setIsEditingTemplate(true);
                        }}>
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="outline" className="text-red-500 hover:text-red-600" onClick={() => setTemplateToDelete(template.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete the template "{template.name}". This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setTemplateToDelete(null)}>Cancel</AlertDialogCancel>
                            <AlertDialogAction className="bg-red-500 hover:bg-red-600" onClick={handleDeleteTemplate}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-4">Name</th>
                        <th className="text-left p-4">Subject</th>
                        <th className="text-left p-4">Created</th>
                        <th className="text-left p-4">Updated</th>
                        <th className="text-right p-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTemplates?.map(template => (
                        <tr key={template.id} className="border-b hover:bg-gray-50">
                          <td className="p-4 font-medium">{template.name}</td>
                          <td className="p-4 truncate max-w-[200px]">{template.subject}</td>
                          <td className="p-4 text-gray-500">{new Date(template.createdAt).toLocaleDateString()}</td>
                          <td className="p-4 text-gray-500">{new Date(template.updatedAt).toLocaleDateString()}</td>
                          <td className="p-4 text-right">
                            <div className="flex justify-end space-x-2">
                              <Button size="sm" variant="outline" onClick={() => {
                                setCurrentTemplate(template);
                                setIsPreviewingTemplate(true);
                              }}>
                                <Eye className="h-4 w-4 mr-1" />
                                Preview
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => {
                                setCurrentTemplate(template);
                                setIsEditingTemplate(true);
                              }}>
                                <Edit className="h-4 w-4 mr-1" />
                                Edit
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button size="sm" variant="outline" className="text-red-500 hover:text-red-600" onClick={() => setTemplateToDelete(template.id)}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This will permanently delete the template "{template.name}". This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel onClick={() => setTemplateToDelete(null)}>Cancel</AlertDialogCancel>
                                    <AlertDialogAction className="bg-red-500 hover:bg-red-600" onClick={handleDeleteTemplate}>
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </>
  );
}
