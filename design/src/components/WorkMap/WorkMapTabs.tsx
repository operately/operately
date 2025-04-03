import React, { useState, useRef, useEffect } from "react";

interface WorkMapTabsProps {
  /**
   * The currently active tab
   * Possible values: "all", "goals", "projects", "completed"
   */
  activeTab: string;
}

interface TimePeriod {
  id: string;
  display: string;
}

interface DropdownPosition {
  top: number;
  left: number;
  width: number;
}

interface QuarterYear {
  quarter: number;
  year: number;
  display: string;
}

/**
 * Navigation component for switching between different WorkMap views
 * Also includes a time period selector for filtering items by quarter/year
 */
export function WorkMapTabs({
  activeTab,
}: WorkMapTabsProps): React.ReactElement {
  // Reference to the button element for positioning the dropdown
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState<DropdownPosition>({
    top: 0,
    left: 0,
    width: 0,
  });
  // State for the time period selection
  const [selectedTimePeriod, setSelectedTimePeriod] =
    useState<string>("current");
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);

  // Get current quarter and year
  const getCurrentQuarterYear = (): QuarterYear => {
    const now = new Date();
    const year = now.getFullYear();
    const quarter = Math.floor(now.getMonth() / 3) + 1;
    return { quarter, year, display: `Q${quarter} ${year}` };
  };

  const currentPeriod = getCurrentQuarterYear();

  // Available time periods
  const timePeriods: TimePeriod[] = [
    { id: "current", display: currentPeriod.display },
    {
      id: "prev-quarter",
      display: `Q${currentPeriod.quarter > 1 ? currentPeriod.quarter - 1 : 4} ${
        currentPeriod.quarter > 1 ? currentPeriod.year : currentPeriod.year - 1
      }`,
    },
    { id: "current-year", display: `${currentPeriod.year}` },
    { id: "prev-year", display: `${currentPeriod.year - 1}` },
    { id: "all-time", display: "All Time" },
  ];

  // The currently displayed period
  const displayPeriod =
    timePeriods.find((p) => p.id === selectedTimePeriod) || timePeriods[0];

  // Toggle dropdown
  const toggleDropdown = (): void => {
    // Calculate position before toggling
    if (!isDropdownOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY,
        left: rect.right - 160 + window.scrollX, // Align right edge of dropdown with right edge of button
        width: Math.max(160, rect.width), // At least 160px wide
      });
    }
    setIsDropdownOpen(!isDropdownOpen);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isDropdownOpen) return;

    const handleClickOutside = (event: MouseEvent): void => {
      if (
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isDropdownOpen]);

  // Select a time period
  const selectTimePeriod = (periodId: string): void => {
    setSelectedTimePeriod(periodId);
    setIsDropdownOpen(false);
    // Here you would trigger filtering of the data based on the selected period
    console.log(`Selected time period: ${periodId}`);
  };

  // Reset to default (current quarter)
  const resetToDefault = (e: React.MouseEvent): void => {
    e.stopPropagation(); // Prevent dropdown from opening
    setSelectedTimePeriod("current");
    // Here you would reset the filtering
    console.log("Reset to current period");
  };

  return (
    <div className="border-b border-surface-outline">
      <div className="px-4 sm:px-6">
        <nav
          className="flex justify-between overflow-x-auto pb-1"
          aria-label="Work Map Tabs"
        >
          <div className="flex space-x-4">
            <a
              href="/work-map"
              className={`
              border-b-2 
              ${
                activeTab === "all"
                  ? "border-blue-500 text-content-base"
                  : "border-transparent text-content-dimmed hover:text-content-base hover:border-surface-accent"
              } 
              px-1 pt-2.5 pb-1 text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-1.5 whitespace-nowrap
            `}
              aria-current={activeTab === "all" ? "page" : undefined}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4 hidden sm:inline"
                data-component-name="WorkMapTabs"
              >
                <rect x="3" y="3" width="7" height="7"></rect>
                <rect x="14" y="3" width="7" height="7"></rect>
                <rect x="14" y="14" width="7" height="7"></rect>
                <rect x="3" y="14" width="7" height="7"></rect>
              </svg>
              All work
            </a>
            <a
              href="/work-map-goals"
              className={`
              border-b-2 
              ${
                activeTab === "goals"
                  ? "border-blue-500 text-content-base"
                  : "border-transparent text-content-dimmed hover:text-content-base hover:border-surface-accent"
              } 
              px-1 pt-2.5 pb-1 text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-1.5 whitespace-nowrap
            `}
              aria-current={activeTab === "goals" ? "page" : undefined}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4 hidden sm:inline"
                data-component-name="WorkMapTabs"
              >
                <path d="M12 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0"></path>
                <path d="M12 7a5 5 0 1 0 5 5"></path>
                <path d="M13 3.055a9 9 0 1 0 7.941 7.945"></path>
                <path d="M15 6v3h3l3 -3h-3v-3z"></path>
                <path d="M15 9l-3 3"></path>
              </svg>
              Goals
            </a>
            <a
              href="/work-map-projects"
              className={`
              border-b-2 
              ${
                activeTab === "projects"
                  ? "border-blue-500 text-content-base"
                  : "border-transparent text-content-dimmed hover:text-content-base hover:border-surface-accent"
              } 
              px-1 pt-2.5 pb-1 text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-1.5 whitespace-nowrap
            `}
              aria-current={activeTab === "projects" ? "page" : undefined}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4 hidden sm:inline"
                data-component-name="WorkMapTabs"
              >
                <path d="M9.615 20h-2.615a2 2 0 0 1 -2 -2v-12a2 2 0 0 1 2 -2h8a2 2 0 0 1 2 2v8"></path>
                <path d="M14 19l2 2l4 -4"></path>
                <path d="M9 8h4"></path>
                <path d="M9 12h2"></path>
              </svg>
              Projects
            </a>
            <a
              href="/work-map-completed"
              className={`
              border-b-2 
              ${
                activeTab === "completed"
                  ? "border-blue-500 text-content-base"
                  : "border-transparent text-content-dimmed hover:text-content-base hover:border-surface-accent"
              } 
              px-1 pt-2.5 pb-1 text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-1.5 whitespace-nowrap
            `}
              aria-current={activeTab === "completed" ? "page" : undefined}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4 hidden sm:inline"
                data-component-name="WorkMapTabs"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              Completed
            </a>
          </div>

          {/* Time period selector with dropdown */}
          <div className="relative self-center mt-1">
            <button
              ref={buttonRef}
              className={`px-2 sm:px-4 py-1 sm:py-1.5 border rounded-full flex items-center gap-1 sm:gap-2 text-xs sm:text-sm transition-colors ${
                selectedTimePeriod !== "current"
                  ? "bg-surface-highlight border-surface-outline"
                  : "bg-surface-base hover:bg-surface-dimmed border-surface-outline"
              }`}
              onClick={toggleDropdown}
              title="Filter work items by time period"
              data-component-name="WorkMapTabs"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              <span className="whitespace-nowrap">{displayPeriod.display}</span>

              {/* Dropdown indicator */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-3 w-3 ml-0.5"
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>

              {/* Reset button (only shows when a non-default period is selected) */}
              {selectedTimePeriod !== "current" && (
                <button
                  onClick={resetToDefault}
                  className="ml-1 rounded-full p-0.5 hover:bg-surface-dimmed transition-colors"
                  title="Reset to current period"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-3 w-3"
                  >
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              )}
            </button>

            {/* Dropdown menu - responsive positioning */}
            {isDropdownOpen && (
              <div
                ref={dropdownRef}
                className="fixed bg-surface-base border border-surface-outline rounded-md shadow-lg z-[9999] min-w-[160px]"
                style={{
                  top: `${dropdownPosition.top}px`,
                  left:
                    window.innerWidth < 640
                      ? `${Math.min(
                          dropdownPosition.left,
                          window.innerWidth - 170
                        )}px` // Mobile: ensure it stays on screen
                      : `${dropdownPosition.left}px`,
                  width:
                    window.innerWidth < 640
                      ? "160px" // Fixed width on mobile
                      : `${dropdownPosition.width}px`,
                }}
              >
                {timePeriods.map((period) => (
                  <button
                    key={period.id}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-surface-dimmed transition-colors ${
                      period.id === selectedTimePeriod
                        ? "bg-surface-dimmed text-content-accent"
                        : "text-content-base"
                    }`}
                    onClick={() => selectTimePeriod(period.id)}
                  >
                    {period.display}
                  </button>
                ))}
              </div>
            )}
          </div>
        </nav>
      </div>
    </div>
  );
}
