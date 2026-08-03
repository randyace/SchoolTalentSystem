import { Search, Settings, HelpCircle, Bell } from "lucide-react";
import { JiraAvatar } from "./JiraAvatar";

export function JiraNavigation() {
  return (
    <nav className="bg-[#0747a6] text-white px-4 py-2">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-white rounded text-[#0747a6] flex items-center justify-center text-sm">
              J
            </div>
            <span className="text-sm">Jira</span>
          </div>
          
          <div className="hidden md:flex items-center space-x-4 text-sm">
            <a href="#" className="hover:bg-[#0052cc] px-2 py-1 rounded">Your work</a>
            <a href="#" className="hover:bg-[#0052cc] px-2 py-1 rounded">Projects</a>
            <a href="#" className="hover:bg-[#0052cc] px-2 py-1 rounded">Filters</a>
            <a href="#" className="hover:bg-[#0052cc] px-2 py-1 rounded">Dashboards</a>
            <a href="#" className="hover:bg-[#0052cc] px-2 py-1 rounded">Teams</a>
            <a href="#" className="hover:bg-[#0052cc] px-2 py-1 rounded">Apps</a>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search"
              className="bg-[#0052cc] text-white placeholder-gray-300 pl-10 pr-4 py-1 rounded text-sm w-64 focus:outline-none focus:bg-white focus:text-gray-900"
            />
          </div>
          
          <button className="p-1 hover:bg-[#0052cc] rounded">
            <Bell className="w-5 h-5" />
          </button>
          <button className="p-1 hover:bg-[#0052cc] rounded">
            <HelpCircle className="w-5 h-5" />
          </button>
          <button className="p-1 hover:bg-[#0052cc] rounded">
            <Settings className="w-5 h-5" />
          </button>
          
          <JiraAvatar name="Current User" initials="CU" />
        </div>
      </div>
    </nav>
  );
}