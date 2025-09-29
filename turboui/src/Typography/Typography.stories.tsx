import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { IconCoffee, IconFlag, IconMessage, IconSquare } from "../icons";
import { Page } from "../Page";

const meta = {
  title: "Design System/Typography",
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
} satisfies Meta;

export default meta;

interface TypographyExampleProps {
  title: string;
  description: string;
  children: React.ReactNode;
  className?: string;
}

const TypographyExample: React.FC<TypographyExampleProps> = ({ title, description, children, className = "" }) => (
  <div className={`mb-8 ${className}`}>
    <div className="mb-2">
      <div className="text-sm font-semibold text-content-dimmed uppercase tracking-wide">{title}</div>
      <div className="text-xs text-content-dimmed mt-1">{description}</div>
    </div>
    <div className="border border-stroke-base bg-white p-6">{children}</div>
  </div>
);

/**
 * Complete typography system used throughout the TurboUI design system.
 * These typography patterns establish hierarchy, readability, and consistency across all pages.
 */
export const AllTypography: StoryObj = {
  render: () => (
    <Page title="Typography" size="large">
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Typography System</h1>
        <p className="text-content-base mb-8 leading-relaxed">
          Operately uses a structured typography system to create clear hierarchy and maintain consistency across all
          pages. This system follows the patterns established in ProjectPage, GoalPage, and WorkMap to ensure a
          professional, serious tone throughout the application.
        </p>

        <TypographyExample title="Page Headers" description="Main page titles with breadcrumbs and status indicators">
          <div className="space-y-6">
            {/* ProjectPage/GoalPage Style Header with Breadcrumbs */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <IconCoffee size={20} className="text-blue-600" />
              </div>
              <div>
                <div className="flex items-center gap-1 text-sm text-content-dimmed">
                  <span>Engineering</span>
                  <span>›</span>
                  <span>Projects</span>
                </div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-semibold text-content-strong">Mobile App Launch</h1>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                    Active
                  </span>
                </div>
              </div>
            </div>

            {/* Top-Level Page Header (ReviewPage style) */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
                <IconCoffee size={20} className="text-amber-600" />
              </div>
              <div>
                <div className="flex items-baseline gap-2">
                  <h1 className="text-lg font-semibold text-content-strong">Review</h1>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-content-dimmed/10 text-content-dimmed">
                    5 outstanding items
                  </span>
                </div>
                <p className="text-sm text-content-dimmed">Stay on top of your responsibilities</p>
              </div>
            </div>

            {/* WorkMap Style Header */}
            <div className="border-b border-stroke-base pb-4">
              <h1 className="text-base font-bold text-content-strong">Company Work Map</h1>
            </div>
          </div>
        </TypographyExample>

        <TypographyExample title="Section Headers" description="Main section titles with optional actions and counts">
          <div className="space-y-6">
            {/* Basic Section Header */}
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-content-strong">Due Soon</h2>
            </div>

            {/* Section Header with Count */}
            <div className="flex items-baseline gap-2">
              <h2 className="font-bold text-content-strong">Needs My Review</h2>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-content-dimmed/10 text-content-dimmed">
                3 items
              </span>
            </div>

            {/* Section Header with Actions */}
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-content-strong">Tasks</h2>
              <button className="text-sm text-brand-1 hover:text-brand-1/80 font-medium">Add Task</button>
            </div>
          </div>
        </TypographyExample>

        <TypographyExample
          title="Subsection Headers"
          description="Group headers and navigation breadcrumbs within sections"
        >
          <div className="space-y-4">
            {/* Group Header with Breadcrumbs */}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-content-dimmed">Product</span>
              <span className="text-content-dimmed">›</span>
              <span className="text-content-dimmed">Project</span>
              <span className="text-content-dimmed">›</span>
              <span className="font-medium text-content-strong">Mobile App Launch</span>
              <span className="text-xs text-content-dimmed">Due Dec 15</span>
            </div>

            {/* Simple Group Header */}
            <div className="text-sm font-medium text-content-strong">Customer Satisfaction Goal</div>
          </div>
        </TypographyExample>

        <TypographyExample title="Content Typography" description="Text content with proper hierarchy and spacing">
          <div className="space-y-4">
            {/* Primary Content */}
            <div className="text-sm font-medium text-content-strong">Complete security audit</div>

            {/* Secondary Content */}
            <div className="text-sm text-content-base">
              Updates, tasks, and milestones that need your attention right away.
            </div>

            {/* Muted Content */}
            <div className="text-sm text-content-dimmed">No check-ins or updates need your review.</div>

            {/* Small Labels */}
            <div className="text-xs text-content-dimmed uppercase tracking-wide">Due Today</div>
          </div>
        </TypographyExample>

        <TypographyExample
          title="List Items with Icons"
          description="Assignment rows and list items with proper icon alignment"
        >
          <div className="space-y-2">
            {/* Task Item */}
            <div className="flex items-center gap-3 py-2">
              <div className="w-6 h-6 flex items-center justify-center">
                <IconSquare size={16} className="text-content-base" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-content-strong">Complete security audit</span>
                  <span className="flex items-center gap-1 text-xs text-content-dimmed">
                    <IconCoffee size={12} />
                    Dec 10
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                    3 days overdue
                  </span>
                </div>
              </div>
            </div>

            {/* Milestone Item */}
            <div className="flex items-center gap-3 py-2">
              <div className="w-6 h-6 flex items-center justify-center">
                <IconFlag size={16} className="text-content-base" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-content-strong">Mobile App Beta Release</span>
                  <span className="flex items-center gap-1 text-xs text-content-dimmed">
                    <IconCoffee size={12} />
                    Dec 15
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                    Due today
                  </span>
                </div>
              </div>
            </div>

            {/* Check-in Item */}
            <div className="flex items-center gap-3 py-2">
              <div className="w-6 h-6 flex items-center justify-center">
                <IconMessage size={16} className="text-content-base" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-content-strong">Weekly check-in</span>
                  <span className="flex items-center gap-1 text-xs text-content-dimmed">
                    <IconCoffee size={12} />
                    Dec 18
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                    Due tomorrow
                  </span>
                </div>
              </div>
            </div>
          </div>
        </TypographyExample>

        <TypographyExample title="Empty States" description="Empty state messaging with proper hierarchy">
          <div className="flex flex-col items-center justify-center gap-1.5 py-4 text-center">
            <div className="w-8 h-8 bg-callout-success-bg rounded-full flex items-center justify-center">
              <IconCoffee size={16} className="text-callout-success-content" />
            </div>
            <div className="text-sm font-semibold text-content-strong">No urgent work</div>
            <p className="text-xs text-content-dimmed max-w-sm">You're all caught up on immediate priorities.</p>
          </div>
        </TypographyExample>

        <div className="mt-12 p-6 bg-surface-dimmed rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Typography Guidelines</h3>
          <div className="space-y-3 text-sm text-content-base">
            <div>
              <strong className="text-content-strong">Page Headers:</strong> Use{" "}
              <code className="bg-white px-1 py-0.5 rounded text-xs">text-lg font-semibold</code> for main page titles
              with breadcrumbs and status indicators. Use{" "}
              <code className="bg-white px-1 py-0.5 rounded text-xs">items-baseline</code> for proper alignment with
              badges.
            </div>
            <div>
              <strong className="text-content-strong">Section Headers:</strong> Use{" "}
              <code className="bg-white px-1 py-0.5 rounded text-xs">font-bold</code> for section titles. Use{" "}
              <code className="bg-white px-1 py-0.5 rounded text-xs">items-baseline</code> for proper alignment with
              counts and actions.
            </div>
            <div>
              <strong className="text-content-strong">Content Text:</strong> Use{" "}
              <code className="bg-white px-1 py-0.5 rounded text-xs">text-sm</code> for most content with appropriate
              color classes. Use <code className="bg-white px-1 py-0.5 rounded text-xs">text-content-dimmed</code> for
              secondary info,
              <code className="bg-white px-1 py-0.5 rounded text-xs">text-content-subtle</code> only for very rare
              tertiary elements.
            </div>
            <div>
              <strong className="text-content-strong">Layout:</strong> Use full-width white backgrounds with{" "}
              <code className="bg-white px-1 py-0.5 rounded text-xs">max-w-*</code> containers. Avoid rounded corners on
              main sections.
            </div>
            <div>
              <strong className="text-content-strong">Date Display:</strong> Use{" "}
              <code className="bg-white px-1 py-0.5 rounded text-xs">FormattedTime</code> with{" "}
              <code className="bg-white px-1 py-0.5 rounded text-xs">format="short-date"</code> for consistent date
              formatting. Add urgency badges with{" "}
              <code className="bg-white px-1 py-0.5 rounded text-xs">StatusBadge</code> for overdue and due soon items.
            </div>
            <div>
              <strong className="text-content-strong">Spacing:</strong> Use consistent gap and padding patterns:{" "}
              <code className="bg-white px-1 py-0.5 rounded text-xs">gap-3</code> for items,{" "}
              <code className="bg-white px-1 py-0.5 rounded text-xs">py-2</code> for list items. Use{" "}
              <code className="bg-white px-1 py-0.5 rounded text-xs">py-4</code> for compact empty states.
            </div>
          </div>
        </div>
      </div>
    </Page>
  ),
};
