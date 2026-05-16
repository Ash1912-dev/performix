import { BarChart3, Gauge, Share2, Users } from'lucide-react';

import DashboardLayout from'./DashboardLayout';

const navItems = [
 { label:'Dashboard', to:'/manager/dashboard', icon: Gauge },
 { label:'Team Goals', to:'/manager/team-goals', icon: Users },
 { label:'Check-ins', to:'/manager/checkins', icon: BarChart3 },
 { label:'Shared Goals', to:'/manager/shared-goals', icon: Share2 },
];

function ManagerLayout() {
 return <DashboardLayout navItems={navItems} />;
}

export default ManagerLayout;
