import { useState } from "react";

export default function FilterSidebar() {
  const [selected, setSelected] = useState<string[]>([]);

  const filters = {
    Category: ["Tools", "Electrical", "Safety", "Hardware", "Plumbing"],
    Brand: ["Bosch", "3M", "Stanley", "Makita"],
    Availability: ["In Stock", "Out of Stock"],
  };

  const toggle = (value: string) => {
    setSelected((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  return (
    <aside className="w-full md:w-64 bg-white border border-border rounded-lg p-4 h-fit sticky top-24">
      <h2 className="text-lg font-semibold mb-4 text-text-primary">Filters</h2>

      {Object.entries(filters).map(([title, options]) => (
        <div key={title} className="mb-6">
          <h3 className="font-medium text-text-primary mb-2">{title}</h3>
          <div className="space-y-1">
            {options.map((opt) => (
              <label key={opt} className="flex items-center space-x-2 text-sm text-text-secondary">
                <input
                  type="checkbox"
                  checked={selected.includes(opt)}
                  onChange={() => toggle(opt)}
                  className="accent-primary"
                />
                <span>{opt}</span>
              </label>
            ))}
          </div>
        </div>
      ))}
    </aside>
  );
}
