import { ArrowUpRight, Sparkles } from'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from'@/components/ui/card';

function AppShellPlaceholder({ title, description }) {
 return (
 <div className="space-y-6">
 <div className="rounded-[2rem] bg-[linear-gradient(135deg,#0f172a_0%,#1d4ed8_55%,#38bdf8_100%)] p-8 text-white shadow-[0_24px_60px_-24px_rgba(15,23,42,0.45)]">
 <div className="inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-sky-100">
 <Sparkles className="size-3.5" />
 Performix Workspace
 </div>
 <h1 className="mt-5 text-3xl font-bold tracking-tight">{title}</h1>
 <p className="mt-3 max-w-2xl text-sm leading-7 text-sky-50/90">{description}</p>
 </div>

 <div className="grid gap-5 lg:grid-cols-3">
 <Card className="lg:col-span-2">
 <CardHeader>
 <CardTitle>Page Ready for Feature Build</CardTitle>
 </CardHeader>
 <CardContent>
 <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm leading-7 text-gray-600">
 This route is fully wired into authentication, layout, navigation, and
 role-based access control. You can start building live page modules
 here next without reworking the app shell.
 </div>
 </CardContent>
 </Card>
 <Card>
 <CardHeader>
 <CardTitle>Next Step</CardTitle>
 </CardHeader>
 <CardContent>
 <div className="flex items-start gap-3 rounded-2xl bg-slate-950 p-5 text-gray-900">
 <ArrowUpRight className="mt-0.5 size-4 text-sky-300" />
 <p className="text-sm leading-6">
 Connect this screen to its API queries, forms, tables, and workflows.
 </p>
 </div>
 </CardContent>
 </Card>
 </div>
 </div>
);
}

export default AppShellPlaceholder;
