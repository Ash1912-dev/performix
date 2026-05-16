import {
 BarChart3,
 ClipboardList,
 FileText,
 Gauge,
 ScrollText,
 ShieldAlert,
 Users,
} from'lucide-react';

import DashboardLayout from'./DashboardLayout';

const navItems = [
 { label:'Dashboard', to:'/admin/dashboard', icon: Gauge },
 { label:'Users', to:'/admin/users', icon: Users },
 { label:'Goal Management', to:'/admin/goals', icon: ClipboardList },
 { label:'Reports', to:'/admin/reports', icon: FileText },
 { label:'Analytics', to:'/admin/analytics', icon: BarChart3 },
 { label:'Escalation', to:'/admin/escalation', icon: ShieldAlert },
 { label:'Audit Log', to:'/admin/audit', icon: ScrollText },
];

function AdminLayout() {
 return <DashboardLayout navItems={navItems} />;
}

export default AdminLayout;
