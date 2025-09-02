import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

export function CategoryManagement() {
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const categories = useQuery(api.categories.getAllCategories) || [];
  const categoryStats = useQuery(api.categories.getCategoryStats);

  // Filter categories based on search term
  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (showAddCategory || editingCategory) {
    return (
      <CategoryForm
        categoryId={editingCategory}
        onBack={() => {
          setShowAddCategory(false);
          setEditingCategory(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Category Management</h2>
          <p className="text-gray-600 mt-1">Manage product categories and their organization</p>
        </div>
        <div className="flex gap-3">
          <SeedCategoriesButton />
          <button
            onClick={() => setShowAddCategory(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <span>+</span>
            Add Category
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {categoryStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <span className="text-2xl">📁</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Categories</p>
                <p className="text-2xl font-bold text-gray-900">{categoryStats.totalCategories}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <span className="text-2xl">✅</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Categories</p>
                <p className="text-2xl font-bold text-gray-900">{categoryStats.activeCategories}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <span className="text-2xl">📦</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Products</p>
                <p className="text-2xl font-bold text-gray-900">{categoryStats.totalProducts}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <span className="text-2xl">🏷️</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Categories with Products</p>
                <p className="text-2xl font-bold text-gray-900">{categoryStats.categoriesWithProducts}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Categories Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Products
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCategories.map((category) => (
                <tr key={category._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-12 w-12 flex-shrink-0">
                        {category.imageUrl ? (
                          <img
                            className="h-12 w-12 rounded-lg object-cover"
                            src={category.imageUrl}
                            alt={category.name}
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-lg bg-gray-200 flex items-center justify-center">
                            <span className="text-2xl">📁</span>
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{category.name}</div>
                        <div className="text-sm text-gray-500">
                          Created {new Date(category._creationTime).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs">
                      {category.description}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-900">
                        {category.productCount}
                      </span>
                      <span className="text-sm text-gray-500 ml-1">products</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        category.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {category.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setEditingCategory(category._id)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Edit
                      </button>
                      <ToggleStatusButton category={category} />
                      <DeleteCategoryButton category={category} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredCategories.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📁</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No categories found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm ? 'No categories match your search.' : 'Get started by creating your first category.'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => setShowAddCategory(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Add Category
              </button>
            )}
          </div>
        )}
      </div>

      {/* Top Categories */}
      {categoryStats?.topCategories && categoryStats.topCategories.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Categories by Product Count</h3>
          <div className="space-y-3">
            {categoryStats.topCategories.map((category, index) => (
              <div key={category.name} className="flex items-center justify-between py-2">
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-500 w-6">#{index + 1}</span>
                  <span className="text-sm font-medium text-gray-900 ml-3">{category.name}</span>
                </div>
                <span className="text-sm text-gray-600">{category.productCount} products</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Category Form Component
function CategoryForm({ categoryId, onBack }: { categoryId?: string | null; onBack: () => void }) {
  const category = useQuery(
    api.categories.getCategory,
    categoryId ? { categoryId: categoryId as any } : "skip"
  );

  const createCategory = useMutation(api.categories.createCategory);
  const updateCategory = useMutation(api.categories.updateCategory);
  const generateUploadUrl = useMutation(api.categories.generateUploadUrl);

  const [form, setForm] = useState({
    name: '',
    description: '',
    isActive: true,
  });

  const [image, setImage] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Initialize form with category data if editing
  useState(() => {
    if (category) {
      setForm({
        name: category.name || '',
        description: category.description || '',
        isActive: category.isActive ?? true,
      });
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    try {
      let imageId = undefined;

      // Upload image if provided
      if (image) {
        const uploadUrl = await generateUploadUrl();
        const result = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": image.type },
          body: image,
        });
        const { storageId } = await result.json();
        imageId = storageId;
      }

      const categoryData = {
        name: form.name.trim(),
        description: form.description.trim(),
        image: imageId,
        isActive: form.isActive,
      };

      if (categoryId) {
        await updateCategory({ categoryId: categoryId as any, ...categoryData });
        toast.success("Category updated successfully");
      } else {
        await createCategory(categoryData);
        toast.success("Category created successfully");
      }

      onBack();
    } catch (error: any) {
      toast.error(error.message || "Failed to save category");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
        >
          <span>←</span>
          Back to Categories
        </button>
        <h2 className="text-3xl font-bold text-gray-900">
          {categoryId ? 'Edit Category' : 'Add New Category'}
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category Name *
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Electronics, Fashion, Books"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category Image
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImage(e.target.files?.[0] || null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-sm text-gray-500 mt-1">Upload an icon or image for this category</p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description *
          </label>
          <textarea
            required
            rows={4}
            value={form.description}
            onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Describe what products belong to this category..."
          />
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="isActive"
            checked={form.isActive}
            onChange={(e) => setForm(prev => ({ ...prev, isActive: e.target.checked }))}
            className="mr-2"
          />
          <label htmlFor="isActive" className="text-sm text-gray-700">
            Category is active and visible to customers
          </label>
        </div>

        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={onBack}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={uploading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
          >
            {uploading ? 'Saving...' : (categoryId ? 'Update Category' : 'Create Category')}
          </button>
        </div>
      </form>
    </div>
  );
}

// Toggle Status Button Component
function ToggleStatusButton({ category }: { category: any }) {
  const toggleStatus = useMutation(api.categories.toggleCategoryStatus);

  const handleToggle = async () => {
    try {
      await toggleStatus({ categoryId: category._id });
      toast.success(`Category ${category.isActive ? 'deactivated' : 'activated'}`);
    } catch (error) {
      toast.error("Failed to update category status");
    }
  };

  return (
    <button
      onClick={handleToggle}
      className={`${
        category.isActive ? 'text-orange-600 hover:text-orange-900' : 'text-green-600 hover:text-green-900'
      }`}
    >
      {category.isActive ? 'Deactivate' : 'Activate'}
    </button>
  );
}

// Delete Category Button Component
function DeleteCategoryButton({ category }: { category: any }) {
  const deleteCategory = useMutation(api.categories.deleteCategory);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = async () => {
    try {
      await deleteCategory({ categoryId: category._id });
      toast.success("Category deleted successfully");
      setShowConfirm(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to delete category");
    }
  };

  if (showConfirm) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={handleDelete}
          className="text-red-600 hover:text-red-900 text-xs"
        >
          Confirm
        </button>
        <button
          onClick={() => setShowConfirm(false)}
          className="text-gray-600 hover:text-gray-900 text-xs"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      className="text-red-600 hover:text-red-900"
      disabled={category.productCount > 0}
      title={category.productCount > 0 ? "Cannot delete category with products" : "Delete category"}
    >
      Delete
    </button>
  );
}

// Seed Categories Button Component
function SeedCategoriesButton() {
  const seedCategories = useMutation(api.categories.seedDefaultCategories);
  const [seeding, setSeeding] = useState(false);

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const result = await seedCategories();
      toast.success(result);
    } catch (error: any) {
      toast.error(error.message || "Failed to seed categories");
    } finally {
      setSeeding(false);
    }
  };

  return (
    <button
      onClick={handleSeed}
      disabled={seeding}
      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 flex items-center gap-2"
    >
      <span>🌱</span>
      {seeding ? 'Seeding...' : 'Seed Categories'}
    </button>
  );
}
