import { 
  Bell, 
  Search,
  Settings
} from "lucide-react";
import { Input } from "@/components/ui/input";

interface TopNavigationProps {
  title: string;
  subtitle?: string;
}

export function TopNavigation({ title, subtitle }: TopNavigationProps) {
  return (
    <header className="bg-white shadow-sm">
      <div className="px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-700">{title}</h1>
            {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative hidden sm:block">
              <Input
                type="text"
                placeholder="Search..."
                className="pl-9 pr-4 py-2 w-56"
              />
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
            </div>
            <button className="p-2 relative text-gray-400 hover:text-gray-500">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <button className="p-2 relative text-gray-400 hover:text-gray-500">
              <Settings className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
