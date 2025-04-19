import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { EmailTemplate } from "@/types";

interface TemplateEditorProps {
  template?: Partial<EmailTemplate>;
  onSave: (template: Partial<EmailTemplate>) => void;
  onCancel?: () => void;
  isSaving?: boolean;
}

export function TemplateEditor({ 
  template = {}, 
  onSave, 
  onCancel,
  isSaving = false
}: TemplateEditorProps) {
  const [name, setName] = useState(template.name || "");
  const [subject, setSubject] = useState(template.subject || "");
  const [htmlContent, setHtmlContent] = useState(template.htmlContent || "");
  const [textContent, setTextContent] = useState(template.textContent || "");
  const [activeTab, setActiveTab] = useState("html");
  const [previewWithVariables, setPreviewWithVariables] = useState(false);
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});

  // Extract all variable names from HTML and text content
  const extractVariables = (content: string): string[] => {
    const matches = content.match(/\{\{([^}]+)\}\}/g) || [];
    return matches.map(m => m.replace(/\{\{|\}\}/g, "").trim());
  };

  const allVariables = Array.from(
    new Set([
      ...extractVariables(htmlContent),
      ...extractVariables(textContent)
    ])
  );

  // Replace variables in content with their values
  const replaceVariables = (content: string, values: Record<string, string>): string => {
    return content.replace(/\{\{([^}]+)\}\}/g, (match, variable) => {
      const key = variable.trim();
      return values[key] !== undefined ? values[key] : match;
    });
  };

  // Preview content with variables replaced
  const getPreviewContent = (): string => {
    const content = activeTab === "html" ? htmlContent : textContent;
    return previewWithVariables ? replaceVariables(content, variableValues) : content;
  };

  const handleSave = () => {
    onSave({
      name,
      subject,
      htmlContent,
      textContent
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Template Editor</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="template-name">Template Name</Label>
              <Input
                id="template-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Welcome Email"
              />
            </div>
            <div>
              <Label htmlFor="template-subject">Email Subject</Label>
              <Input
                id="template-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Welcome to our platform"
              />
            </div>
          </div>

          <Tabs defaultValue="html" value={activeTab} onValueChange={setActiveTab}>
            <div className="flex justify-between items-center mb-2">
              <TabsList>
                <TabsTrigger value="html">HTML Content</TabsTrigger>
                <TabsTrigger value="text">Text Content</TabsTrigger>
                <TabsTrigger value="preview">Preview</TabsTrigger>
              </TabsList>
              
              {activeTab === "preview" && (
                <div className="flex items-center gap-2">
                  <Label htmlFor="use-variables" className="text-sm">
                    Apply Variables
                  </Label>
                  <input
                    id="use-variables"
                    type="checkbox"
                    checked={previewWithVariables}
                    onChange={(e) => setPreviewWithVariables(e.target.checked)}
                    className="mr-2"
                  />
                </div>
              )}
            </div>

            <TabsContent value="html">
              <Textarea
                className="font-mono min-h-[300px]"
                value={htmlContent}
                onChange={(e) => setHtmlContent(e.target.value)}
                placeholder="<h1>Welcome!</h1><p>Thank you for signing up, {{name}}!</p>"
              />
              <p className="text-sm text-gray-500 mt-2">
                Use &#123;&#123;variableName&#125;&#125; for dynamic content.
              </p>
            </TabsContent>
            
            <TabsContent value="text">
              <Textarea
                className="font-mono min-h-[300px]"
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                placeholder="Welcome! Thank you for signing up, {{name}}!"
              />
              <p className="text-sm text-gray-500 mt-2">
                Use &#123;&#123;variableName&#125;&#125; for dynamic content.
                Make sure to include the same variables as in HTML content.
              </p>
            </TabsContent>
            
            <TabsContent value="preview">
              {previewWithVariables && allVariables.length > 0 && (
                <div className="mb-4 p-4 border rounded-md bg-gray-50">
                  <h3 className="text-sm font-medium mb-2">Template Variables</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {allVariables.map((variable) => (
                      <div key={variable} className="flex items-center gap-2">
                        <Label htmlFor={`var-${variable}`} className="text-sm w-1/3">
                          {variable}:
                        </Label>
                        <Input
                          id={`var-${variable}`}
                          value={variableValues[variable] || ""}
                          onChange={(e) => setVariableValues({
                            ...variableValues,
                            [variable]: e.target.value
                          })}
                          className="h-8"
                          placeholder={`Value for ${variable}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {activeTab === "preview" && (
                activeTab === "html" || activeTab === "preview" ? (
                  <div 
                    className="border rounded-md p-4 min-h-[300px] bg-white"
                    dangerouslySetInnerHTML={{ __html: getPreviewContent() }}
                  />
                ) : (
                  <pre className="border rounded-md p-4 min-h-[300px] bg-white font-mono text-sm whitespace-pre-wrap">
                    {getPreviewContent()}
                  </pre>
                )
              )}
            </TabsContent>
          </Tabs>
          
          {allVariables.length > 0 && (
            <div className="mt-2">
              <h3 className="text-sm font-medium">Detected Variables:</h3>
              <div className="flex flex-wrap gap-2 mt-1">
                {allVariables.map((variable) => (
                  <span key={variable} className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">
                    {variable}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        {onCancel && (
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? "Saving..." : "Save Template"}
        </Button>
      </CardFooter>
    </Card>
  );
}
