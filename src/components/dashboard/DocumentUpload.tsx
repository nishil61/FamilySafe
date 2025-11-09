"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { UploadCloud, X, File } from "lucide-react";
import { format } from "date-fns";
import { useCallback, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { uploadDocument } from "@/app/actions/documents-actions";
import { getIdTokenSafely } from "@/lib/firebase/get-id-token";

const documentUploadSchema = z.object({
  file: z.any().refine((file) => file?.length == 1, "File is required."),
  docType: z.string().min(1, "Document type is required."),
  customLabel: z.string().optional(),
  expiryDate: z.date().optional(),
  notes: z.string().optional(),
});

interface DocumentUploadProps {
  onDocumentUploaded?: () => void;
}

export default function DocumentUpload({ onDocumentUploaded }: DocumentUploadProps) {
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const form = useForm<z.infer<typeof documentUploadSchema>>({
    resolver: zodResolver(documentUploadSchema),
    defaultValues: {
      docType: "",
      customLabel: "",
      notes: "",
      expiryDate: undefined,
    },
  });

  const docType = form.watch("docType");

  const onSubmit = useCallback(async (values: z.infer<typeof documentUploadSchema>) => {
    try {
      // Get ID token
      const idToken = await getIdTokenSafely();
      if (!idToken) {
        throw new Error("Unable to authenticate. Please sign in again.");
      }

      // Get file
      const file = values.file[0];
      if (!file) {
        throw new Error("No file selected");
      }

      toast({ 
        title: "Uploading...", 
        description: "Uploading your document." 
      });

      // Read file as ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      // Upload to Firestore - document will be encrypted server-side using central password
      const result = await uploadDocument(
        uint8Array,
        file.name,
        file.type,
        file.size,
        values.docType as "aadhar" | "pan" | "passport" | "drivers_license" | "custom",
        values.customLabel,
        values.notes,
        values.expiryDate ? values.expiryDate.toISOString() : undefined,
        idToken
      );

      toast({ 
        title: "Success", 
        description: "Document uploaded securely." 
      });
      
      // Reset form and clear file selection
      form.reset({
        docType: "",
        customLabel: "",
        notes: "",
        expiryDate: undefined,
      });
      setSelectedFile(null);
      
      // Trigger refresh in parent component
      if (onDocumentUploaded) {
        onDocumentUploaded();
      }
    } catch (error: any) {
      toast({ 
        variant: "destructive", 
        title: "Upload Failed", 
        description: error.message || "Could not upload document." 
      });
    }
  }, [form, toast, onDocumentUploaded]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="file"
          render={({ field }) => (
            <FormItem>
              <FormLabel>File</FormLabel>
              <FormControl>
                {selectedFile ? (
                  <div className="flex items-center justify-between w-full p-4 border-2 border-solid border-green-300 rounded-lg bg-green-50">
                    <div className="flex items-center gap-3">
                      <File className="w-6 h-6 text-green-600" />
                      <div>
                        <p className="font-semibold text-sm text-gray-900">{selectedFile.name}</p>
                        <p className="text-xs text-gray-600">
                          {(selectedFile.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedFile(null);
                        field.onChange([]);
                      }}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="w-5 h-5" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-center w-full">
                    <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted/80">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <UploadCloud className="w-8 h-8 mb-2 text-muted-foreground" />
                        <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                      </div>
                      <Input 
                        id="dropzone-file" 
                        type="file" 
                        className="hidden" 
                        onChange={(e) => {
                          const files = e.target.files ? Array.from(e.target.files) : [];
                          if (files.length > 0) {
                            setSelectedFile(files[0]);
                          }
                          field.onChange(files);
                        }} 
                      />
                    </label>
                  </div>
                )}
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="docType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Document Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a document type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="aadhar">Aadhar Card</SelectItem>
                  <SelectItem value="pan">PAN Card</SelectItem>
                  <SelectItem value="passport">Passport</SelectItem>
                  <SelectItem value="drivers_license">Driver's License</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        {docType === "custom" && (
          <FormField
            control={form.control}
            name="customLabel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Custom Label</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., House Lease Agreement" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
            control={form.control}
            name="expiryDate"
            render={({ field }) => (
                <FormItem className="flex flex-col">
                <FormLabel>Expiry Date (Optional)</FormLabel>
                <Input 
                    type="date"
                    value={field.value ? format(field.value, "yyyy-MM-dd") : ""}
                    onChange={(e) => {
                        if (e.target.value) {
                            field.onChange(new Date(e.target.value));
                        } else {
                            field.onChange(undefined);
                        }
                    }}
                    min="1900-01-01"
                    className="flex-1"
                />
                {field.value && (
                    <p className="text-sm font-medium text-blue-600">
                        Selected: {format(field.value, "dd/MM/yyyy")}
                    </p>
                )}
                <FormMessage />
                </FormItem>
            )}
            />
        </div>
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Add any relevant notes..."
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Uploading...' : 'Upload Document'}
        </Button>
      </form>
    </Form>
  );
}
