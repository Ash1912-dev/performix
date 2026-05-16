function PageHeader({ title, subtitle, actions }) {
 return (
 <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
 <div>
 <h1 className="m-0 text-3xl font-bold tracking-tight text-gray-900">
 {title}
 </h1>
 {subtitle && (
 <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
)}
 </div>
 {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
 </div>
);
}

export default PageHeader;
