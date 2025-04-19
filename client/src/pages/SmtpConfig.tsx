import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { TopNavigation } from "@/components/layout/top-navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { 
  Mail, 
  ServerIcon, 
  Shield, 
  Settings, 
  Zap, 
  Globe, 
  Lock, 
  Key, 
  Edit, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  AlertCircle
} from "lucide-react";
import { getSmtpProviders } from "@/lib/api";
import type { SmtpProvider } from "@/types";

// SMTP Provider form validation schema
const smtpProviderSchema = z.object({
  name: z.string().min(1, "Name is required"),
  host: z.string().min(1, "Host is required"),
  port: z.coerce.number().int().min(1, "Port is required"),
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  region: z.string().min(1, "Region is required"),
  isSecure: z.boolean().default(true),
  isActive: z.boolean().default(true),
  priority: z.coerce.number().int().min(0),
  maxSendsPerHour: z.coerce.number().int().min(1, "Send limit is required")
});

export default function SmtpConfig() {
  const [activeTab, setActiveTab] = useState("providers");
  const [isEditingProvider, setIsEditingProvider] = useState(false);
  const [isCreatingProvider, setIsCreatingProvider] = useState(false);
  const [currentProvider, setCurrentProvider] = useState<SmtpProvider | null>(null);
  
  // Fetch SMTP providers
  const { data: smtpProviders, isLoading } = useQuery({
    queryKey: ['/api/smtp'],
    queryFn: getSmtpProviders
  });

  // Form for SMTP provider
  const form = useForm<z.infer<typeof smtpProviderSchema>>({
    resolver: zodResolver(smtpProviderSchema),
    defaultValues: {
      name: "",
      host: "",
      port: 587,
      username: "",
      password: "",
      region: "Global",
      isSecure: true,
      isActive: true,
      priority: 1,
      maxSendsPerHour: 1000
    }
  });

  // Group providers by region
  const providersByRegion = smtpProviders?.reduce<Record<string, SmtpProvider[]>>((acc, provider) => {
    if (!acc[provider.region]) {
      acc[provider.region] = [];
    }
    acc[provider.region].push(provider);
    return acc;
  }, {}) || {};

  // Set form values when editing a provider
  const openEditDialog = (provider: SmtpProvider) => {
    setCurrentProvider(provider);
    form.reset({
      name: provider.name,
      host: provider.host,
      port: provider.port,
      username: provider.username,
      password: provider.password,
      region: provider.region,
      isSecure: provider.isSecure,
      isActive: provider.isActive,
      priority: provider.priority,
      maxSendsPerHour: provider.maxSendsPerHour
    });
    setIsEditingProvider(true);
  };

  // Reset form when creating a new provider
  const openCreateDialog = () => {
    form.reset({
      name: "",
      host: "",
      port: 587,
      username: "",
      password: "",
      region: "Global",
      isSecure: true,
      isActive: true,
      priority: 1,
      maxSendsPerHour: 1000
    });
    setIsCreatingProvider(true);
  };

  // Handle form submission
  const onSubmit = (data: z.infer<typeof smtpProviderSchema>) => {
    console.log("Form submitted:", data);
    
    if (isEditingProvider) {
      // Update provider logic would go here in a real implementation
      setIsEditingProvider(false);
    } else {
      // Create provider logic would go here in a real implementation
      setIsCreatingProvider(false);
    }
  };

  // Delete provider modal
  const handleDeleteProvider = (id: number) => {
    console.log("Delete provider:", id);
    // Delete provider logic would go here in a real implementation
  };

  return (
    <>
      <TopNavigation 
        title="SMTP Configuration" 
        subtitle="Manage email delivery providers" 
      />
      
      <div className="p-4 sm:p-6 lg:p-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="providers" className="flex items-center">
              <ServerIcon className="mr-2 h-4 w-4" />
              SMTP Providers
            </TabsTrigger>
            <TabsTrigger value="routing" className="flex items-center">
              <Zap className="mr-2 h-4 w-4" />
              Routing Rules
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center">
              <Shield className="mr-2 h-4 w-4" />
              Security Settings
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="providers" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">SMTP Providers</h2>
              <Button onClick={openCreateDialog}>
                Add Provider
              </Button>
            </div>
            
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : !smtpProviders || smtpProviders.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                  <ServerIcon className="h-16 w-16 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No SMTP Providers Configured</h3>
                  <p className="text-gray-500 max-w-md mb-4">
                    Configure SMTP providers to send emails through the platform.
                  </p>
                  <Button onClick={openCreateDialog}>
                    Add Your First Provider
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                {Object.entries(providersByRegion).map(([region, providers]) => (
                  <div key={region} className="space-y-4">
                    <div className="flex items-center">
                      <Globe className="mr-2 h-5 w-5 text-gray-500" />
                      <h3 className="text-md font-medium">{region} Region</h3>
                      <Badge className="ml-2">{providers.length} Providers</Badge>
                    </div>
                    
                    <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
                      {providers.map(provider => (
                        <Card key={provider.id} className={provider.isActive ? "" : "opacity-70"}>
                          <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                              <div>
                                <CardTitle className="flex items-center">
                                  {provider.name}
                                  {!provider.isActive && <Badge variant="outline" className="ml-2 text-gray-500">Inactive</Badge>}
                                </CardTitle>
                                <CardDescription>{provider.host}:{provider.port}</CardDescription>
                              </div>
                              <div className="flex gap-1">
                                <Button variant="ghost" size="icon" onClick={() => openEditDialog(provider)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="text-red-500">
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete SMTP Provider</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to delete the SMTP provider "{provider.name}"? This action cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction className="bg-red-500 hover:bg-red-600" onClick={() => handleDeleteProvider(provider.id)}>
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div className="flex items-center">
                                <Key className="mr-2 h-4 w-4 text-gray-500" />
                                <span className="text-gray-500">Username:</span>
                              </div>
                              <div className="font-medium truncate">{provider.username}</div>
                              
                              <div className="flex items-center">
                                <Lock className="mr-2 h-4 w-4 text-gray-500" />
                                <span className="text-gray-500">Security:</span>
                              </div>
                              <div className="font-medium">
                                {provider.isSecure ? (
                                  <span className="flex items-center text-green-600">
                                    <CheckCircle className="mr-1 h-3 w-3" />
                                    TLS/SSL
                                  </span>
                                ) : (
                                  <span className="flex items-center text-amber-500">
                                    <AlertCircle className="mr-1 h-3 w-3" />
                                    Unencrypted
                                  </span>
                                )}
                              </div>
                              
                              <div className="flex items-center">
                                <Zap className="mr-2 h-4 w-4 text-gray-500" />
                                <span className="text-gray-500">Priority:</span>
                              </div>
                              <div className="font-medium">{provider.priority}</div>
                              
                              <div className="flex items-center">
                                <Mail className="mr-2 h-4 w-4 text-gray-500" />
                                <span className="text-gray-500">Hourly Limit:</span>
                              </div>
                              <div className="font-medium">{provider.maxSendsPerHour.toLocaleString()}</div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}
              </>
            )}
          </TabsContent>
          
          <TabsContent value="routing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Adaptive Email Routing</CardTitle>
                <CardDescription>
                  Configure how emails are routed between different SMTP providers
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Routing Diagram</h3>
                  <div className="p-6 bg-gray-50 rounded-md">
                    <div className="flex flex-col items-center">
                      <div className="p-3 bg-primary text-white rounded-md mb-4">
                        Outbound Request
                      </div>
                      <div className="border-2 border-dashed border-gray-300 h-10 w-0 mb-4"></div>
                      <div className="p-3 bg-gray-100 text-gray-800 rounded-md mb-4 w-64 text-center">
                        Volume &lt; 1K/hr?
                      </div>
                      <div className="flex items-center w-full justify-center mb-4">
                        <div className="border-2 border-dashed border-gray-300 h-10 w-20 rotate-45 origin-left"></div>
                        <div className="mx-10"></div>
                        <div className="border-2 border-dashed border-gray-300 h-10 w-20 -rotate-45 origin-right"></div>
                      </div>
                      <div className="flex w-full justify-between mb-4">
                        <div className="p-3 bg-gray-100 text-gray-800 rounded-md w-40 text-center">
                          Primary ESP
                        </div>
                        <div className="p-3 bg-gray-100 text-gray-800 rounded-md w-40 text-center">
                          Secondary ESP Cluster
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Volume-Based Routing Rules</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                      <div>
                        <p className="font-medium">Low Volume (&lt;1K/hr)</p>
                        <p className="text-sm text-gray-500">Route to Primary ESP</p>
                      </div>
                      <Button variant="outline" size="sm">Configure</Button>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                      <div>
                        <p className="font-medium">Medium Volume (1K-10K/hr)</p>
                        <p className="text-sm text-gray-500">Route to Secondary ESP Cluster</p>
                      </div>
                      <Button variant="outline" size="sm">Configure</Button>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                      <div>
                        <p className="font-medium">High Volume (&gt;10K/hr)</p>
                        <p className="text-sm text-gray-500">Load balance across all providers</p>
                      </div>
                      <Button variant="outline" size="sm">Configure</Button>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Region-Based Routing</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                      <div>
                        <p className="font-medium">North America (NA)</p>
                        <p className="text-sm text-gray-500">Prefer Amazon SES Virginia</p>
                      </div>
                      <Button variant="outline" size="sm">Configure</Button>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                      <div>
                        <p className="font-medium">Europe (EU)</p>
                        <p className="text-sm text-gray-500">Prefer Mailgun Frankfurt</p>
                      </div>
                      <Button variant="outline" size="sm">Configure</Button>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                      <div>
                        <p className="font-medium">Asia Pacific (APAC)</p>
                        <p className="text-sm text-gray-500">Prefer SendGrid Tokyo</p>
                      </div>
                      <Button variant="outline" size="sm">Configure</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>
                  Configure security settings for SMTP providers and email delivery
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <h3 className="text-sm font-medium">Authentication and Encryption</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                      <div className="flex items-center">
                        <Lock className="h-5 w-5 mr-2 text-primary" />
                        <div>
                          <p className="font-medium">Require TLS for All Connections</p>
                          <p className="text-sm text-gray-500">Always use secure connections</p>
                        </div>
                      </div>
                      <Switch checked={true} />
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                      <div className="flex items-center">
                        <Shield className="h-5 w-5 mr-2 text-primary" />
                        <div>
                          <p className="font-medium">Enable DKIM Signing</p>
                          <p className="text-sm text-gray-500">Sign all outgoing emails</p>
                        </div>
                      </div>
                      <Switch checked={true} />
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                      <div className="flex items-center">
                        <Settings className="h-5 w-5 mr-2 text-primary" />
                        <div>
                          <p className="font-medium">SPF Authentication</p>
                          <p className="text-sm text-gray-500">Validate sender IP addresses</p>
                        </div>
                      </div>
                      <Switch checked={true} />
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                      <div className="flex items-center">
                        <Mail className="h-5 w-5 mr-2 text-primary" />
                        <div>
                          <p className="font-medium">DMARC Policy</p>
                          <p className="text-sm text-gray-500">Email authentication policy</p>
                        </div>
                      </div>
                      <Select defaultValue="quarantine">
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="quarantine">Quarantine</SelectItem>
                          <SelectItem value="reject">Reject</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-3">
                  <h3 className="text-sm font-medium">Data Protection</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                      <div className="flex items-center">
                        <Lock className="h-5 w-5 mr-2 text-primary" />
                        <div>
                          <p className="font-medium">Encrypt PII at Rest</p>
                          <p className="text-sm text-gray-500">AES-256-GCM encryption</p>
                        </div>
                      </div>
                      <Switch checked={true} />
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                      <div className="flex items-center">
                        <Shield className="h-5 w-5 mr-2 text-primary" />
                        <div>
                          <p className="font-medium">API Signatures</p>
                          <p className="text-sm text-gray-500">ECDSA-521 for API auth</p>
                        </div>
                      </div>
                      <Switch checked={true} />
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-3">
                  <h3 className="text-sm font-medium">Access Control</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                      <div className="flex items-center">
                        <Lock className="h-5 w-5 mr-2 text-primary" />
                        <div>
                          <p className="font-medium">IP Allowlist</p>
                          <p className="text-sm text-gray-500">Restrict API access by IP</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">Configure</Button>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                      <div className="flex items-center">
                        <Shield className="h-5 w-5 mr-2 text-primary" />
                        <div>
                          <p className="font-medium">API Key Rotation</p>
                          <p className="text-sm text-gray-500">Regular key rotation policy</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">Configure</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Provider form dialog */}
      <Dialog 
        open={isCreatingProvider || isEditingProvider} 
        onOpenChange={(open) => {
          if (!open) {
            setIsCreatingProvider(false);
            setIsEditingProvider(false);
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {isEditingProvider ? "Edit SMTP Provider" : "Add SMTP Provider"}
            </DialogTitle>
            <DialogDescription>
              Configure the SMTP provider details for email delivery.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Provider Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Amazon SES (NA)" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="region"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Region</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a region" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Global">Global</SelectItem>
                          <SelectItem value="NA">North America</SelectItem>
                          <SelectItem value="EU">Europe</SelectItem>
                          <SelectItem value="APAC">Asia Pacific</SelectItem>
                          <SelectItem value="LATAM">Latin America</SelectItem>
                          <SelectItem value="MEA">Middle East & Africa</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="host"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Host</FormLabel>
                      <FormControl>
                        <Input placeholder="smtp.provider.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="port"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Port</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormDescription>
                        Lower numbers have higher priority.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="maxSendsPerHour"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Sends Per Hour</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormDescription>
                        Maximum hourly email send capacity.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="isSecure"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Use TLS/SSL</FormLabel>
                        <FormDescription>
                          Enable secure connections.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Active</FormLabel>
                        <FormDescription>
                          Enable this SMTP provider.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => {
                  setIsCreatingProvider(false);
                  setIsEditingProvider(false);
                }}>
                  Cancel
                </Button>
                <Button type="submit">
                  {isEditingProvider ? "Save Changes" : "Add Provider"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
