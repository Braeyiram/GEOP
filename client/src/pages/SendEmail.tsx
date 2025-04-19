import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { TopNavigation } from "@/components/layout/top-navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle, XCircle, AlertTriangle, Send as SendIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { sendEmail, getTemplates } from "@/lib/api";
import type { SendEmailRequest } from "@/types";

// Form validation schema
const sendEmailSchema = z.object({
  to: z.string().email({ message: "Please enter a valid email address" }),
  from: z.string().email({ message: "Please enter a valid sender email" }),
  subject: z.string().min(1, { message: "Subject is required" }).max(998, { message: "Subject too long" }),
  html: z.string().optional(),
  text: z.string().optional(),
  templateId: z.coerce.number().optional(),
  region: z.string().optional(),
  volume: z.coerce.number().optional().default(1)
});

export default function SendEmail() {
  const [activeTab, setActiveTab] = useState("simple");
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [previewHtml, setPreviewHtml] = useState("");
  const [sendEmailResult, setSendEmailResult] = useState<
    { success: boolean; emailId?: number; trackingId?: string; message: string; error?: string } | null
  >(null);
  
  const { toast } = useToast();

  // Form setup
  const form = useForm<z.infer<typeof sendEmailSchema>>({
    resolver: zodResolver(sendEmailSchema),
    defaultValues: {
      to: "",
      from: "",
      subject: "",
      html: "",
      text: "",
      region: "Global",
      volume: 1
    }
  });

  // Fetch templates
  const { data: templates } = useQuery({ 
    queryKey: ['/api/template'],
    queryFn: getTemplates
  });

  // Send email mutation
  const sendEmailMutation = useMutation({
    mutationFn: (data: SendEmailRequest) => sendEmail(data),
    onSuccess: (data) => {
      setSendEmailResult(data);
      if (data.success) {
        toast({
          title: "Email sent successfully",
          description: `Email ID: ${data.emailId}, Tracking ID: ${data.trackingId}`,
          variant: "default",
        });
      } else {
        toast({
          title: "Failed to send email",
          description: data.error || data.message,
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  });

  // Handle form submission
  const onSubmit = (data: z.infer<typeof sendEmailSchema>) => {
    // Remove empty fields
    const cleanedData: SendEmailRequest = Object.entries(data).reduce(
      (acc, [key, value]) => {
        if (value !== undefined && value !== '' && value !== null) {
          acc[key as keyof SendEmailRequest] = value;
        }
        return acc;
      },
      {} as SendEmailRequest
    );

    // Add variables if template is used
    if (data.templateId && Object.keys(variables).length > 0) {
      cleanedData.variables = variables;
    }

    sendEmailMutation.mutate(cleanedData);
  };

  // Update preview when template changes
  const updatePreview = (templateId: number) => {
    if (!templates) return;
    
    const selectedTemplate = templates.find(t => t.id === templateId);
    if (!selectedTemplate) return;
    
    // Replace variables in template
    let html = selectedTemplate.htmlContent;
    Object.entries(variables).forEach(([key, value]) => {
      html = html.replace(new RegExp(`{{\\s*${key}\\s*}}`, 'g'), value);
    });
    
    setPreviewHtml(html);
  };

  // Extract variables from template
  const extractVariables = (templateId: number) => {
    if (!templates) return [];
    
    const selectedTemplate = templates.find(t => t.id === templateId);
    if (!selectedTemplate) return [];
    
    const matches = selectedTemplate.htmlContent.match(/{{([^}]+)}}/g) || [];
    return matches.map(m => m.replace(/{{|}}/g, "").trim());
  };

  return (
    <>
      <TopNavigation 
        title="Send Email" 
        subtitle="Compose and send emails" 
      />
      
      <div className="p-4 sm:p-6 lg:p-8">
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle>Send Email</CardTitle>
            <CardDescription>
              Create and send emails through the platform's email pipeline.
            </CardDescription>
          </CardHeader>
          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="px-6">
              <TabsList className="w-full">
                <TabsTrigger value="simple" className="flex-1">Simple Email</TabsTrigger>
                <TabsTrigger value="template" className="flex-1">Template Email</TabsTrigger>
                <TabsTrigger value="advanced" className="flex-1">Advanced Options</TabsTrigger>
              </TabsList>
            </div>
            
            <CardContent className="p-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  
                  {/* Common fields for all tabs */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="to"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Recipient Email</FormLabel>
                          <FormControl>
                            <Input placeholder="recipient@example.com" {...field} />
                          </FormControl>
                          <FormDescription>
                            The email address of the recipient.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="from"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sender Email</FormLabel>
                          <FormControl>
                            <Input placeholder="sender@yourdomain.com" {...field} />
                          </FormControl>
                          <FormDescription>
                            Your sender email address.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="subject"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subject</FormLabel>
                        <FormControl>
                          <Input placeholder="Email subject" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <TabsContent value="simple" className="space-y-4 mt-4 pt-0">
                    <FormField
                      control={form.control}
                      name="html"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>HTML Content</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="<h1>Hello!</h1><p>Your HTML content here...</p>" 
                              className="min-h-[200px] font-mono"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="text"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Text Content (fallback)</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Hello! Your text content here..." 
                              className="min-h-[100px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TabsContent>
                  
                  <TabsContent value="template" className="space-y-4 mt-4 pt-0">
                    <FormField
                      control={form.control}
                      name="templateId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Template</FormLabel>
                          <Select
                            onValueChange={(value) => {
                              field.onChange(parseInt(value));
                              // Reset variables when template changes
                              setVariables({});
                              updatePreview(parseInt(value));
                            }}
                            value={field.value?.toString()}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a template" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {templates?.map(template => (
                                <SelectItem key={template.id} value={template.id.toString()}>
                                  {template.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Choose a pre-defined email template.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {form.watch("templateId") && (
                      <>
                        <div className="bg-gray-50 rounded-md p-4 space-y-3">
                          <h3 className="text-sm font-medium mb-2">Template Variables</h3>
                          {extractVariables(form.watch("templateId") || 0).map(variable => (
                            <div key={variable} className="flex gap-2">
                              <FormLabel className="w-1/4 flex items-center">{variable}:</FormLabel>
                              <Input
                                value={variables[variable] || ""}
                                onChange={(e) => {
                                  const newVariables = {...variables, [variable]: e.target.value};
                                  setVariables(newVariables);
                                  updatePreview(form.watch("templateId") || 0);
                                }}
                                placeholder={`Value for ${variable}`}
                              />
                            </div>
                          ))}
                        </div>
                        
                        <div className="mt-4 space-y-2">
                          <h3 className="text-sm font-medium">Template Preview</h3>
                          <div className="border rounded-md p-4 min-h-[200px] bg-white">
                            {previewHtml ? (
                              <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
                            ) : (
                              <div className="text-gray-400 italic">
                                Preview will appear here after selecting a template and filling variables.
                              </div>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="advanced" className="space-y-4 mt-4 pt-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="region"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Region</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a region" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Global">Global (Auto-detect)</SelectItem>
                                <SelectItem value="NA">North America</SelectItem>
                                <SelectItem value="EU">Europe</SelectItem>
                                <SelectItem value="APAC">Asia Pacific</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Target region for email delivery.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="volume"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Estimated Volume</FormLabel>
                            <FormControl>
                              <Input type="number" min="1" {...field} />
                            </FormControl>
                            <FormDescription>
                              Estimated number of similar emails in batch.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="bg-gray-50 rounded-md p-4">
                      <h3 className="text-sm font-medium mb-2">About Advanced Options</h3>
                      <p className="text-sm text-gray-500">
                        These settings help optimize email routing based on recipient region and expected volume.
                        The system will select the most appropriate SMTP provider based on these parameters.
                      </p>
                    </div>
                  </TabsContent>
                  
                  {sendEmailResult && (
                    <Alert variant={sendEmailResult.success ? "default" : "destructive"}>
                      {sendEmailResult.success ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <XCircle className="h-4 w-4" />
                      )}
                      <AlertTitle>
                        {sendEmailResult.success ? "Email Sent Successfully" : "Failed to Send Email"}
                      </AlertTitle>
                      <AlertDescription>
                        {sendEmailResult.message}
                        {sendEmailResult.success && (
                          <div className="mt-2 text-sm">
                            <p><b>Email ID:</b> {sendEmailResult.emailId}</p>
                            <p><b>Tracking ID:</b> {sendEmailResult.trackingId}</p>
                          </div>
                        )}
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  <Separator />
                  
                  <div className="flex justify-end">
                    <Button 
                      type="submit" 
                      className="bg-primary" 
                      disabled={sendEmailMutation.isPending}
                    >
                      {sendEmailMutation.isPending ? (
                        <span className="flex items-center gap-2">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Sending...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <SendIcon className="h-4 w-4" />
                          Send Email
                        </span>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Tabs>
          
          <CardFooter className="bg-gray-50 px-6 py-4 text-xs text-gray-500">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <span>
                All emails will be processed through our secure pipeline and are subject to compliance checks.
              </span>
            </div>
          </CardFooter>
        </Card>
      </div>
    </>
  );
}
