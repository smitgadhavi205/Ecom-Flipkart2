import { useState, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import Papa from 'papaparse';

const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const selectedFile = e.target.files?.[0];
  if (!selectedFile) return;
  
  setFile(selectedFile);
  setStatus("parsing");
  
  try {
    if (uploadMethod === "csv") {
      Papa.parse(selectedFile, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          const result = await parseCSV({ products: results.data });
          // Handle result...
        },
        error: (error) => {
          setStatus("error");
          toast.error("Failed to parse CSV");
        }
      });
    }
  } catch (error) {
    // Handle error
  }
};







type UploadMethod = "csv" | "json" | "form";
type UploadStatus = "idle" | "parsing" | "uploading" | "success" | "error";

interface UploadResult {
  success: number;
  failed: number;
  errors: string[];
}

export function BulkProductUpload({ onBack }: { onBack: () => void }) {
  const [uploadMethod, setUploadMethod] = useState<UploadMethod>("csv");
  const [file, setFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string>("");
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [result, setResult] = useState<UploadResult | null>(null);
  const [parsedProducts, setParsedProducts] = useState<any[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Mutations
  const parseCSV = useMutation(api.admin.parseCSVProducts);
  const parseJSON = useMutation(api.admin.parseJSONProducts);
  const bulkUpload = useMutation(api.admin.bulkUploadProducts);
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    
    setFile(selectedFile);
    setStatus("parsing");
    
    try {
      // Read file content
      const content = await readFileContent(selectedFile);
      setFileContent(content);
      
      // Parse file content based on upload method
      if (uploadMethod === "csv") {
        const result = await parseCSV({ csvContent: content });
        if (result.success) {
          setParsedProducts(result.products);
          setValidationErrors(result.errors || []);
        } else {
          setValidationErrors([result.error]);
          setParsedProducts([]);
        }
      } else if (uploadMethod === "json") {
        const result = await parseJSON({ jsonContent: content });
        if (result.success) {
          setParsedProducts(result.products);
          setValidationErrors(result.errors || []);
        } else {
          setValidationErrors([result.error]);
          setParsedProducts([]);
        }
      }
      
      setStatus("idle");
    } catch (error) {
      setStatus("error");
      toast.error("Failed to parse file");
      console.error(error);
    }
  };
  
  const handleUpload = async () => {
    if (parsedProducts.length === 0) {
      toast.error("No valid products to upload");
      return;
    }
    
    setStatus("uploading");
    
    try {
      const result = await bulkUpload({ products: parsedProducts });
      setResult(result);
      setStatus("success");
      
      if (result.success > 0) {
        toast.success(`Successfully uploaded ${result.success} products`);
      }
      
      if (result.failed > 0) {
        toast.error(`Failed to upload ${result.failed} products`);
      }
    } catch (error) {
      setStatus("error");
      toast.error("Failed to upload products");
      console.error(error);
    }
  };
  
  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = (e) => reject(e);
      reader.readAsText(file);
    });
  };
  
  const resetForm = () => {
    setFile(null);
    setFileContent("");
    setParsedProducts([]);
    setValidationErrors([]);
    setResult(null);
    setStatus("idle");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-900">Bulk Upload Products</h2>
        <button
          onClick={onBack}
          className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
        >
          Back to Products
        </button>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-2">Upload Method</h3>
          <div className="flex space-x-4">
            <button
              onClick={() => { setUploadMethod("csv"); resetForm(); }}
              className={`px-4 py-2 rounded-lg ${uploadMethod === "csv" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"}`}
            >
              CSV Upload
            </button>
            <button
              onClick={() => { setUploadMethod("json"); resetForm(); }}
              className={`px-4 py-2 rounded-lg ${uploadMethod === "json" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"}`}
            >
              JSON Upload
            </button>
          </div>
        </div>
        
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-2">File Upload</h3>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <input
              type="file"
              ref={fileInputRef}
              accept={uploadMethod === "csv" ? ".csv" : ".json"}
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 mb-2"
              disabled={status === "parsing" || status === "uploading"}
            >
              {status === "parsing" ? "Parsing..." : `Select ${uploadMethod.toUpperCase()} File`}
            </button>
            <p className="text-sm text-gray-500">
              {uploadMethod === "csv" ? 
                "CSV file must include headers: name, price, category, stock (or inventory)" : 
                "JSON file must contain an array of product objects"}
            </p>
            {file && (
              <p className="mt-2 text-sm font-medium text-blue-600">
                Selected file: {file.name}
              </p>
            )}
          </div>
        </div>
        
        {parsedProducts.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2">Preview</h3>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Price
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Stock
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {parsedProducts.slice(0, 5).map((product, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {product.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {product.category}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          ${product.price}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {product.inventory}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {parsedProducts.length > 5 && (
                <div className="px-6 py-3 bg-gray-50 text-sm text-gray-500">
                  Showing 5 of {parsedProducts.length} products
                </div>
              )}
            </div>
          </div>
        )}
        
        {validationErrors.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2 text-red-600">Validation Errors</h3>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <ul className="list-disc pl-5 space-y-1">
                {validationErrors.slice(0, 10).map((error, index) => (
                  <li key={index} className="text-sm text-red-600">{error}</li>
                ))}
                {validationErrors.length > 10 && (
                  <li className="text-sm text-red-600">And {validationErrors.length - 10} more errors...</li>
                )}
              </ul>
            </div>
          </div>
        )}
        
        {result && (
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2">Upload Results</h3>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex space-x-6">
                <div>
                  <p className="text-sm text-gray-500">Successfully uploaded:</p>
                  <p className="text-2xl font-bold text-green-600">{result.success}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Failed to upload:</p>
                  <p className="text-2xl font-bold text-red-600">{result.failed}</p>
                </div>
              </div>
              
              {result.errors && result.errors.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-red-600">Errors:</p>
                  <ul className="list-disc pl-5 space-y-1 mt-2">
                    {result.errors.slice(0, 5).map((error, index) => (
                      <li key={index} className="text-sm text-red-600">{error}</li>
                    ))}
                    {result.errors.length > 5 && (
                      <li className="text-sm text-red-600">And {result.errors.length - 5} more errors...</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
        
        <div className="flex justify-end space-x-4">
          <button
            onClick={resetForm}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            disabled={status === "parsing" || status === "uploading"}
          >
            Reset
          </button>
          <button
            onClick={handleUpload}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            disabled={parsedProducts.length === 0 || status === "parsing" || status === "uploading"}
          >
            {status === "uploading" ? "Uploading..." : `Upload ${parsedProducts.length} Products`}
          </button>
        </div>
      </div>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-lg font-medium mb-2 text-blue-800">CSV Format Guidelines</h3>
        <p className="text-sm text-blue-700 mb-2">
          Your CSV file should include the following columns:
        </p>
        <ul className="list-disc pl-5 space-y-1 text-sm text-blue-700">
          <li><strong>name</strong> (required): Product name</li>
          <li><strong>price</strong> (required): Product price (numeric)</li>
          <li><strong>category</strong> (required): Product category (must exist in the system)</li>
          <li><strong>stock</strong> or <strong>inventory</strong> (required): Available quantity (numeric)</li>
          <li><strong>description</strong>: Product description</li>
          <li><strong>brand</strong>: Product brand</li>
          <li><strong>originalPrice</strong>: Original price before discount (numeric)</li>
          <li><strong>isActive</strong>: Whether the product is active (true/false)</li>
          <li><strong>tags</strong>: Product tags (semicolon-separated)</li>
          <li><strong>weight, dimensions, color, material</strong>: Product specifications</li>
        </ul>
      </div>
    </div>
  );
}
