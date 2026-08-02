import Link from "next/link";

interface BreadcrumbItem {
  label: string;
  href?: string;
  active?: boolean;
}

export default function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav className="text-sm " aria-label="Breadcrumb">
      <ol className="flex items-center space-x-1">
        {items.map((item, idx) => (
          <li key={idx} className="flex items-center">
            {item.href && !item.active ? (
              <Link href={item.href} className="text-gray-700 hover:underline">
                {item.label}
              </Link>
            ) : (
              <span className="font-semibold text-black">{item.label}</span>
            )}
            {idx < items.length - 1 && (
              <span className="mx-2 text-gray-400">{'›'}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}