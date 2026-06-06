import { useEffect, useMemo, useState } from "react";
import supabase from "../../utils/supabase";
import { ErrorState } from "../CategoryGrid";

interface ProductRow {
  id: number;
  productName: string;
  subCategoryName: string;
  categoryName: string;
  original_price: number | null;
  price: number | null;
  snapshot: {
    original_price: number | null;
    price: number | null;
  };
  isSaving: boolean;
}

interface SubCategoryLite {
  id: number;
  name: string;
  category_id: number;
  sort_number: number;
}

interface CategoryLite {
  id: number;
  name: string;
  sort_number: number;
}

const isRowDirty = (row: ProductRow): boolean =>
  row.original_price !== row.snapshot.original_price ||
  row.price !== row.snapshot.price;

const isValidNonNegative = (v: number | null): boolean =>
  v !== null && !isNaN(v) && v >= 0;

export default function UpdatePrices() {
  const [rows, setRows] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isBulkSaving, setIsBulkSaving] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    setFetchError(null);

    const [productsResult, subCatsResult, catsResult] = await Promise.all([
      supabase
        .from("product")
        .select("id, name, price, original_price, sub_cat_id, sort_number")
        .order("sort_number", { ascending: true }),
      supabase.from("sub-categories").select("id, name, category_id, sort_number"),
      supabase.from("categories").select("id, name, sort_number"),
    ]);

    if (productsResult.error || subCatsResult.error || catsResult.error) {
      const msg =
        productsResult.error?.message ||
        subCatsResult.error?.message ||
        catsResult.error?.message ||
        "Failed to load price data";
      setFetchError(msg);
      setLoading(false);
      return;
    }

    const subCats: SubCategoryLite[] = subCatsResult.data || [];
    const cats: CategoryLite[] = catsResult.data || [];

    const subCatMap = new Map<number, SubCategoryLite>();
    subCats.forEach((sc) => subCatMap.set(sc.id, sc));

    const catMap = new Map<number, CategoryLite>();
    cats.forEach((c) => catMap.set(c.id, c));

    const builtRows: (ProductRow & {
      _catSort: number;
      _subCatSort: number;
      _productSort: number;
    })[] = (productsResult.data || []).map((p) => {
      const sub = subCatMap.get(Number(p.sub_cat_id));
      const cat = sub ? catMap.get(Number(sub.category_id)) : undefined;
      const orig = p.original_price === null || p.original_price === undefined
        ? null
        : Number(p.original_price);
      const price = p.price === null || p.price === undefined ? null : Number(p.price);
      return {
        id: p.id,
        productName: p.name,
        subCategoryName: sub?.name || "—",
        categoryName: cat?.name || "—",
        original_price: orig,
        price,
        snapshot: { original_price: orig, price },
        isSaving: false,
        _catSort: cat?.sort_number ?? Number.MAX_SAFE_INTEGER,
        _subCatSort: sub?.sort_number ?? Number.MAX_SAFE_INTEGER,
        _productSort: p.sort_number ?? Number.MAX_SAFE_INTEGER,
      };
    });

    builtRows.sort((a, b) => {
      if (a._catSort !== b._catSort) return a._catSort - b._catSort;
      if (a.categoryName !== b.categoryName)
        return a.categoryName.localeCompare(b.categoryName);
      if (a._subCatSort !== b._subCatSort) return a._subCatSort - b._subCatSort;
      if (a.subCategoryName !== b.subCategoryName)
        return a.subCategoryName.localeCompare(b.subCategoryName);
      if (a._productSort !== b._productSort) return a._productSort - b._productSort;
      return a.productName.localeCompare(b.productName);
    });

    setRows(builtRows);
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const updateRowField = (
    id: number,
    field: "original_price" | "price",
    rawValue: string
  ) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const parsed = rawValue === "" ? null : Number(rawValue);
        return { ...r, [field]: parsed };
      })
    );
  };

  const persistRow = async (row: ProductRow): Promise<boolean> => {
    if (!isValidNonNegative(row.original_price) || !isValidNonNegative(row.price)) {
      alert(
        `"${row.productName}": Original Price and Price must both be non-negative numbers.`
      );
      return false;
    }

    const { error } = await supabase
      .from("product")
      .update({
        original_price: row.original_price,
        price: row.price,
      })
      .eq("id", row.id);

    if (error) {
      alert(`Failed to update "${row.productName}": ${error.message}`);
      return false;
    }
    return true;
  };

  const handleSaveOne = async (id: number) => {
    const target = rows.find((r) => r.id === id);
    if (!target || !isRowDirty(target)) return;

    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, isSaving: true } : r)));
    const ok = await persistRow(target);
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        if (!ok) return { ...r, isSaving: false };
        return {
          ...r,
          isSaving: false,
          snapshot: { original_price: r.original_price, price: r.price },
        };
      })
    );
  };

  const dirtyRows = useMemo(() => rows.filter(isRowDirty), [rows]);

  const handleSaveAll = async () => {
    if (dirtyRows.length === 0) return;

    const invalid = dirtyRows.find(
      (r) => !isValidNonNegative(r.original_price) || !isValidNonNegative(r.price)
    );
    if (invalid) {
      alert(
        `"${invalid.productName}" has an invalid price. Fix it before saving all.`
      );
      return;
    }

    setIsBulkSaving(true);
    setRows((prev) =>
      prev.map((r) => (isRowDirty(r) ? { ...r, isSaving: true } : r))
    );

    const results = await Promise.all(
      dirtyRows.map(async (row) => ({
        id: row.id,
        ok: await persistRow(row),
      }))
    );

    const okIds = new Set(results.filter((r) => r.ok).map((r) => r.id));
    const failCount = results.length - okIds.size;

    setRows((prev) =>
      prev.map((r) => {
        if (!isRowDirty(r) && !r.isSaving) return r;
        if (okIds.has(r.id)) {
          return {
            ...r,
            isSaving: false,
            snapshot: { original_price: r.original_price, price: r.price },
          };
        }
        return { ...r, isSaving: false };
      })
    );

    setIsBulkSaving(false);

    if (failCount === 0) {
      alert(`Updated ${results.length} product${results.length === 1 ? "" : "s"} successfully.`);
    } else {
      alert(
        `Updated ${okIds.size} of ${results.length}. ${failCount} failed — see errors above.`
      );
    }
  };

  const filteredRows = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter(
      (r) =>
        r.productName.toLowerCase().includes(term) ||
        r.subCategoryName.toLowerCase().includes(term) ||
        r.categoryName.toLowerCase().includes(term)
    );
  }, [rows, searchTerm]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (fetchError) {
    return <ErrorState message={fetchError} onRetry={fetchAll} />;
  }

  if (rows.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No products found. Add products before updating prices.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h3 className="text-xl font-semibold">Update Prices</h3>
          <p className="text-sm text-gray-500 mt-0.5">
            Edit <span className="font-medium">Original Price</span> (cost) and{" "}
            <span className="font-medium">Price</span> (sell) inline. Only changed rows are saved.
          </p>
        </div>
        <span className="text-sm text-gray-500">
          {searchTerm
            ? `${filteredRows.length} of ${rows.length} products`
            : `${rows.length} products`}
          {dirtyRows.length > 0 && (
            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
              {dirtyRows.length} unsaved
            </span>
          )}
        </span>
      </div>

      <input
        type="text"
        placeholder="Search by category, sub-category, or product name…"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full border rounded-lg p-2"
      />

      <div className="border rounded-lg overflow-hidden">
        <div className="max-h-[600px] overflow-y-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr className="text-left text-gray-600">
                <th className="px-3 py-2 font-semibold">Category</th>
                <th className="px-3 py-2 font-semibold">Sub-Category</th>
                <th className="px-3 py-2 font-semibold">Product</th>
                <th className="px-3 py-2 font-semibold w-32">Original (₹)</th>
                <th className="px-3 py-2 font-semibold w-32">Price (₹)</th>
                <th className="px-3 py-2 font-semibold w-28">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => {
                const dirty = isRowDirty(row);
                return (
                  <tr
                    key={row.id}
                    className={`border-t ${dirty ? "bg-amber-50" : ""}`}
                  >
                    <td className="px-3 py-2 text-gray-700">{row.categoryName}</td>
                    <td className="px-3 py-2 text-gray-700">{row.subCategoryName}</td>
                    <td className="px-3 py-2 text-gray-900 font-medium">{row.productName}</td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={row.original_price ?? ""}
                        onChange={(e) =>
                          updateRowField(row.id, "original_price", e.target.value)
                        }
                        className="w-full border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="0.00"
                        disabled={row.isSaving}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={row.price ?? ""}
                        onChange={(e) => updateRowField(row.id, "price", e.target.value)}
                        className="w-full border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="0.00"
                        disabled={row.isSaving}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <button
                        onClick={() => handleSaveOne(row.id)}
                        disabled={!dirty || row.isSaving || isBulkSaving}
                        className="px-3 py-1 rounded text-white text-xs font-medium bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                      >
                        {row.isSaving ? "Saving…" : "Update"}
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredRows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-gray-500">
                    No products match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSaveAll}
          disabled={dirtyRows.length === 0 || isBulkSaving}
          className="px-4 py-2 rounded-lg text-white font-medium bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isBulkSaving ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Updating {dirtyRows.length}…
            </>
          ) : dirtyRows.length === 0 ? (
            "Update All"
          ) : (
            `Update All (${dirtyRows.length} changed)`
          )}
        </button>
      </div>
    </div>
  );
}
