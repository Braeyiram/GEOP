import { useState } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  BarChart, 
  Send, 
  Code, 
  Settings, 
  BarChart2, 
  FileText, 
  Bell, 
  Shield, 
  Users, 
  Cog, 
  RectangleEllipsis, 
  LogOut 
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const mainNavItems = [
  { name: "Dashboard", href: "/", icon: <BarChart className="w-5 h-5" /> },
  { name: "Email Campaigns", href: "/email", icon: <Send className="w-5 h-5" /> },
  { name: "API Management", href: "/api", icon: <Code className="w-5 h-5" /> },
  { name: "SMTP Configuration", href: "/smtp", icon: <Settings className="w-5 h-5" /> },
];

const monitoringNavItems = [
  { name: "Analytics", href: "/analytics", icon: <BarChart2 className="w-5 h-5" /> },
  { name: "Logs", href: "/logs", icon: <FileText className="w-5 h-5" /> },
  { name: "Alerts", href: "/alerts", icon: <Bell className="w-5 h-5" /> },
];

const configNavItems = [
  { name: "Security & Compliance", href: "/compliance", icon: <Shield className="w-5 h-5" /> },
  { name: "User Management", href: "/users", icon: <Users className="w-5 h-5" /> },
  { name: "Settings", href: "/settings", icon: <Cog className="w-5 h-5" /> },
];

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const NavItem = ({ item }: { item: { name: string; href: string; icon: React.ReactNode } }) => {
    const isActive = location === item.href;
    
    return (
      <li className="mb-1">
        <Link href={item.href}>
          <a
            className={cn(
              "flex items-center px-3 py-2 rounded-md transition-colors",
              isActive 
                ? "bg-primary/10 text-primary" 
                : "text-gray-400 hover:bg-gray-100 hover:text-gray-500"
            )}
          >
            <span className="w-5 text-center mr-2">{item.icon}</span>
            <span>{item.name}</span>
          </a>
        </Link>
      </li>
    );
  };
  
  const NavSection = ({ 
    title, 
    items 
  }: { 
    title: string; 
    items: { name: string; href: string; icon: React.ReactNode }[] 
  }) => (
    <div className="mb-4">
      <div className="text-xs uppercase font-semibold text-gray-400 tracking-wider mb-2">
        {title}
      </div>
      <ul>
        {items.map((item) => (
          <NavItem key={item.name} item={item} />
        ))}
      </ul>
    </div>
  );

  return (
    <>
      <div className={cn("w-64 bg-white shadow-md h-full hidden md:block", className)}>
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
              <RectangleEllipsis className="text-white h-4 w-4" />
            </div>
            <h1 className="ml-3 font-semibold text-primary">GEOP</h1>
          </div>
          <div className="text-xs text-gray-400 mt-1">Global Email Orchestration Platform</div>
        </div>
        
        <nav className="p-4">
          <NavSection title="Core" items={mainNavItems} />
          <NavSection title="Monitoring" items={monitoringNavItems} />
          <NavSection title="Configuration" items={configNavItems} />
        </nav>
        
        <div className="absolute bottom-0 w-64 p-4 border-t border-gray-200">
          <div className="flex items-center">
            <Avatar className="h-8 w-8">
              <AvatarImage src="https://github.com/shadcn.png" alt="User" />
              <AvatarFallback>AD</AvatarFallback>
            </Avatar>
            <div className="ml-2">
              <div className="text-sm font-medium">Alex Morgan</div>
              <div className="text-xs text-gray-400">System Admin</div>
            </div>
            <div className="ml-auto">
              <button className="text-gray-400 hover:text-gray-500">
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile navigation toggle */}
      <div className="md:hidden fixed bottom-4 right-4 z-50">
        <button
          className="bg-primary text-white p-3 rounded-full shadow-lg"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16m-7 6h7"
            />
          </svg>
        </button>
      </div>
      
      {/* Mobile menu overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-gray-800 bg-opacity-50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div 
            className="fixed top-0 left-0 w-64 h-full bg-white z-50"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Same content as desktop sidebar */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
                  <RectangleEllipsis className="text-white h-4 w-4" />
                </div>
                <h1 className="ml-3 font-semibold text-primary">GEOP</h1>
              </div>
              <div className="text-xs text-gray-400 mt-1">Global Email Orchestration Platform</div>
            </div>
            
            <nav className="p-4">
              <NavSection title="Core" items={mainNavItems} />
              <NavSection title="Monitoring" items={monitoringNavItems} />
              <NavSection title="Configuration" items={configNavItems} />
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
