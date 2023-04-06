import React, { useState } from 'react';
import { Link } from 'react-router-dom';

interface SideNavigationProps {
  isCollapsed: boolean;
  onCollapse: () => void;
}

function SideNavigation({ isCollapsed, onCollapse }: SideNavigationProps) {
  const [isOpen, setIsOpen] = useState(false);

  function toggleOpen() {
    setIsOpen(!isOpen);
  }

  return (
    <div className={`sidenav bg-gray-800 text-white fixed top-0 left-0 h-full transition-all duration-300 ease-in-out overflow-y-auto ${isCollapsed ? 'w-20' : 'w-64'}`}>
      <button onClick={onCollapse} className={`text-white focus:outline-none ${isCollapsed ? 'block' : 'hidden'}`}>
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      <ul className={`list-none m-0 p-0 ${isCollapsed ? 'hidden' : 'block'}`}>
        <li><Link to="/groups" className="block text-white hover:bg-gray-700 py-2 px-4">Groups</Link></li>
        <li><Link to="/objectives" className="block text-white hover:bg-gray-700 py-2 px-4">Objectives</Link></li>
        <li><Link to="/kpis" className="block text-white hover:bg-gray-700 py-2 px-4">KPIs</Link></li>
        <li><Link to="/people" className="block text-white hover:bg-gray-700 py-2 px-4">People</Link></li>
      </ul>
      <button onClick={toggleOpen} className={`text-white focus:outline-none ${isCollapsed ? 'hidden' : 'block'} absolute bottom-0 left-0 w-full py-2 px-4 border-t border-gray-700`}>
        <svg className={`h-6 w-6 ${isOpen ? 'transform rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    </div>
  );
}

SideNavigation.defaultProps = {
  isCollapsed: false,
  onCollapse: () => {},
};

export default SideNavigation;
