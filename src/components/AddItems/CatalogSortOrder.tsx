import { useEffect, useState, useRef } from "react";
import supabase from "../../utils/supabase";
import { getDisplayUrl, handleImageError } from "../../utils/imageUtils";
import { GripVertical, Save, Loader2, RotateCcw } from "lucide-react";

interface SubCategory {
  id: number;
  name: string;
  image_url: string;
  category_id: number;
  catalog_sort_number: number;
}

interface Category {
  id: number;
  name: string;
}

export default function CatalogSortOrder() {
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [originalOrder, setOriginalOrder] = useState<SubCategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const dragItemRef = useRef<number | null>(null);
  const dragOverItemRef = useRef<number | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);

    const [subCatsResult, catsResult] = await Promise.all([
      supabase
        .from("sub-categories")
        .select("id, name, image_url, category_id, catalog_sort_number")
        .order("catalog_sort_number", { ascending: true }),
      supabase.from("categories").select("id, name"),
    ]);

    if (subCatsResult.error) {
      console.error(subCatsResult.error);
      alert("Error fetching subcategories");
    } else {
      const data = subCatsResult.data || [];
      setSubCategories(data);
      setOriginalOrder(data.map((item) => ({ ...item })));
    }

    if (catsResult.error) {
      console.error(catsResult.error);
    } else {
      setCategories(catsResult.data || []);
    }

    setLoading(false);
    setHasChanges(false);
  };

  const getCategoryName = (categoryId: number) => {
    return categories.find((c) => c.id === categoryId)?.name || "Unknown";
  };

  const handleDragStart = (index: number) => {
    dragItemRef.current = index;
    setDragIndex(index);
  };

  const handleDragEnter = (index: number) => {
    dragOverItemRef.current = index;
    setDragOverIndex(index);
  };

  const handleDragEnd = () => {
    if (dragItemRef.current === null || dragOverItemRef.current === null) {
      setDragIndex(null);
      setDragOverIndex(null);
      return;
    }

    const fromIndex = dragItemRef.current;
    const toIndex = dragOverItemRef.current;

    if (fromIndex !== toIndex) {
      const updated = [...subCategories];
      const [movedItem] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, movedItem);
      setSubCategories(updated);
      setHasChanges(true);
    }

    dragItemRef.current = null;
    dragOverItemRef.current = null;
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // Touch drag support
  const touchStartRef = useRef<{ index: number; startY: number } | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (index: number, e: React.TouchEvent) => {
    touchStartRef.current = {
      index,
      startY: e.touches[0].clientY,
    };
    setDragIndex(index);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartRef.current || !listRef.current) return;

    const touchY = e.touches[0].clientY;
    const items = listRef.current.querySelectorAll("[data-drag-item]");

    for (let i = 0; i < items.length; i++) {
      const rect = items[i].getBoundingClientRect();
      if (touchY >= rect.top && touchY <= rect.bottom) {
        setDragOverIndex(i);
        dragOverItemRef.current = i;
        break;
      }
    }
  };

  const handleTouchEnd = () => {
    if (!touchStartRef.current) return;

    dragItemRef.current = touchStartRef.current.index;
    handleDragEnd();
    touchStartRef.current = null;
  };

  const handleReset = () => {
    setSubCategories(originalOrder.map((item) => ({ ...item })));
    setHasChanges(false);
  };

  const handleSave = async () => {
    setSaving(true);

    const updates = subCategories.map((item, index) => ({
      id: item.id,
      catalog_sort_number: index + 1,
    }));

    let hasError = false;
    for (const update of updates) {
      const { error } = await supabase
        .from("sub-categories")
        .update({ catalog_sort_number: update.catalog_sort_number })
        .eq("id", update.id);

      if (error) {
        console.error(`Error updating id ${update.id}:`, error);
        hasError = true;
        break;
      }
    }

    if (hasError) {
      alert("Error saving catalog order. Please try again.");
    } else {
      // Refresh to get the saved state as the new baseline
      const { data } = await supabase
        .from("sub-categories")
        .select("id, name, image_url, category_id, catalog_sort_number")
        .order("catalog_sort_number", { ascending: true });

      if (data) {
        setSubCategories(data);
        setOriginalOrder(data.map((item) => ({ ...item })));
      }

      alert("Catalog order updated successfully!");
      setHasChanges(false);
    }

    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-xl font-semibold">Catalog Sort Order</h3>
          <p className="text-sm text-gray-500 mt-1">
            Drag and drop to reorder how subcategories appear on the Catalog
            page.
          </p>
        </div>
        <span className="text-sm text-gray-500">
          {subCategories.length} subcategories
        </span>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 sticky top-0 bg-white z-10 py-2">
        <button
          onClick={handleSave}
          disabled={!hasChanges || saving}
          className="flex items-center gap-2 bg-amber-500 text-white px-4 py-2 rounded-lg hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saving ? "Saving..." : "Update Order"}
        </button>
        <button
          onClick={handleReset}
          disabled={!hasChanges || saving}
          className="flex items-center gap-2 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          <RotateCcw className="w-4 h-4" />
          Reset
        </button>
        {hasChanges && (
          <span className="self-center text-sm text-amber-600 font-medium">
            Unsaved changes
          </span>
        )}
      </div>

      {/* Draggable List */}
      <div ref={listRef} className="space-y-2 max-h-[600px] overflow-y-auto">
        {subCategories.map((subCat, index) => (
          <div
            key={subCat.id}
            data-drag-item
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragEnter={() => handleDragEnter(index)}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
            onTouchStart={(e) => handleTouchStart(index, e)}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className={`flex items-center gap-3 border rounded-lg p-3 bg-white transition-all select-none ${
              dragIndex === index
                ? "opacity-50 scale-[0.98]"
                : dragOverIndex === index
                  ? "border-amber-400 shadow-md bg-amber-50"
                  : "hover:shadow-sm"
            } ${dragIndex !== null ? "cursor-grabbing" : "cursor-grab"}`}
          >
            {/* Drag Handle */}
            <div className="text-gray-400 flex-shrink-0 touch-none">
              <GripVertical className="w-5 h-5" />
            </div>

            {/* Position Number */}
            <span className="text-sm font-mono text-gray-400 w-6 text-center flex-shrink-0">
              {index + 1}
            </span>

            {/* Image */}
            <img
              src={getDisplayUrl(subCat.image_url)}
              alt={subCat.name}
              className="w-10 h-10 object-cover rounded flex-shrink-0"
              onError={handleImageError}
              draggable={false}
            />

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate">
                {subCat.name}
              </p>
              <p className="text-xs text-gray-500">
                {getCategoryName(subCat.category_id)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
