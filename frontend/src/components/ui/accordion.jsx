import { ChevronDown } from 'lucide-react';

function Accordion({ items = [] }) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <details
          key={item.value}
          className="group overflow-hidden rounded-2xl border border-slate-200 bg-slate-50"
        >
          <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-4 text-sm font-medium text-gray-900">
            <span>{item.label}</span>
            <ChevronDown className="size-4 transition group-open:rotate-180" />
          </summary>
          <div className="border-t border-slate-200 bg-white px-4 py-4 text-gray-700">
            {item.content}
          </div>
        </details>
      ))}
    </div>
  );
}

export { Accordion };
