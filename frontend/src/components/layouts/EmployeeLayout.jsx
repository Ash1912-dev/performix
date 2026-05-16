import { BarChart3, ClipboardList, Gauge } from'lucide-react';

import DashboardLayout from'./DashboardLayout';

const navItems = [
 { label:'Dashboard', to:'/employee/dashboard', icon: Gauge },
 { label:'My Goals', to:'/employee/goals', icon: ClipboardList },
 { label:'Check-ins', to:'/employee/checkins', icon: BarChart3 },
];

function EmployeeLayout() {
 return <DashboardLayout navItems={navItems} />;
}

export default EmployeeLayout;
