import React from "react";
import type { ComponentType } from "react";
import * as Popover from "@radix-ui/react-popover";
import classNames from "../utils/classnames";
import {
  IconCheck,
  IconChevronDown,
  IconCircleCheckCustom,
  IconCircleDashed,
  IconCircleDot,
  IconCircleXCustom,
} from "../icons";
import { createTestId } from "../TestableElement";

const BUTTON_SIZE_CONFIG: Record<StatusSelector.Size, { textSize: string; padding: string; iconSize: number }> = {
  xs: { textSize: "text-xs", padding: "px-1.5 py-0.5", iconSize: 10 },
  sm: { textSize: "text-xs", padding: "px-2 py-1", iconSize: 12 },
  md: { textSize: "text-sm", padding: "px-2.5 py-1.5", iconSize: 14 },
  lg: { textSize: "text-sm", padding: "px-3 py-1.5", iconSize: 16 },
  xl: { textSize: "text-base", padding: "px-3.5 py-2", iconSize: 18 },
  "2xl": { textSize: "text-lg", padding: "px-4 py-2.5", iconSize: 20 },
};

const SIZE_CONFIG: Record<StatusSelector.Size, { iconSize: number; containerSize: string }> = {
  xs: { iconSize: 12, containerSize: "w-3 h-3" },
  sm: { iconSize: 14, containerSize: "w-3.5 h-3.5" },
  md: { iconSize: 16, containerSize: "w-4 h-4" },
  lg: { iconSize: 20, containerSize: "w-5 h-5" },
  xl: { iconSize: 24, containerSize: "w-6 h-6" },
  "2xl": { iconSize: 28, containerSize: "w-7 h-7" },
};

type ButtonVariantKey = StatusSelector.StatusButtonVariant | undefined;

function buildButtonClassNames(variant: ButtonVariantKey, readonly: boolean) {
  const variantKey = variant ?? "default";
  const variantClasses = StatusSelector.STATUS_BUTTON_VARIANTS[variantKey];
  return readonly ? variantClasses.readonly : variantClasses.interactive;
}

type StatusButtonProps<T extends StatusSelector.StatusOption> = {
  option: T;
  size: StatusSelector.Size;
  readonly: boolean;
};

function StatusButton<T extends StatusSelector.StatusOption>({ option, size, readonly }: StatusButtonProps<T>) {
  const { textSize, padding, iconSize } = BUTTON_SIZE_CONFIG[size];
  const colorClasses = StatusSelector.STATUS_COLOR_MAP[option.color];
  const buttonClassName = classNames(
    "inline-flex items-center gap-1.5 rounded-full border font-medium transition-all duration-100 whitespace-nowrap",
    textSize,
    padding,
    buildButtonClassNames(option.buttonVariant, readonly),
    colorClasses.buttonColorClass,
  );

  const IconComponent = StatusSelector.STATUS_ICON_COMPONENTS[option.buttonIcon ?? option.icon];

  return (
    <div className={buttonClassName}>
      <IconComponent
        size={iconSize}
        className={classNames("flex-shrink-0 flex items-center self-center", colorClasses.iconClass)}
      />
      <span className="flex items-center leading-none">{option.label}</span>
      {!readonly && (
        <IconChevronDown size={iconSize - 2} className="flex-shrink-0 opacity-60 flex items-center self-center" />
      )}
    </div>
  );
}

export function StatusSelector<T extends StatusSelector.StatusOption = StatusSelector.StatusOption>({
  statusOptions,
  status,
  onChange,
  size = "md",
  readonly = false,
  showFullBadge = false,
  testId,
}: StatusSelector.Props<T>) {
  if (statusOptions.length === 0) return null;

  const { iconSize, containerSize } = SIZE_CONFIG[size];
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const itemRefs = React.useRef<(HTMLDivElement | null)[]>([]);

  const currentOption = React.useMemo(() => {
    return status ?? statusOptions[0]!;
  }, [status, statusOptions]);

  const filteredStatusOptions = React.useMemo(() => {
    const normalizedQuery = searchTerm.trim().toLowerCase();
    return statusOptions.filter((option) => {
      if (option.legacy) return false;
      return option.label.toLowerCase().includes(normalizedQuery);
    });
  }, [statusOptions, searchTerm]);

  React.useEffect(() => {
    setSelectedIndex(0);
  }, [filteredStatusOptions.length]);

  React.useEffect(() => {
    const selectedItem = itemRefs.current[selectedIndex];
    if (selectedItem) {
      selectedItem.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [selectedIndex]);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setSearchTerm("");
      setSelectedIndex(0);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) => (prev < filteredStatusOptions.length - 1 ? prev + 1 : prev));
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
        break;
      case "Enter":
        e.preventDefault();
        {
          const selectedOption = filteredStatusOptions[selectedIndex];
          if (selectedOption) {
            onChange(selectedOption as T);
            setIsOpen(false);
          }
        }
        break;
      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        break;
    }
  };

  const handleItemClick = (option: T) => {
    onChange(option);
    setIsOpen(false);
    setSearchTerm("");
  };

  const ActiveIcon = StatusSelector.STATUS_ICON_COMPONENTS[currentOption.icon];
  const activeColorClasses = StatusSelector.STATUS_COLOR_MAP[currentOption.color];
  const activeIconClass = classNames("flex items-center self-center", activeColorClasses.iconClass);

  if (readonly) {
    return (
      <div data-test-id={testId}>
        {showFullBadge ? (
          <StatusButton option={currentOption} size={size} readonly={true} />
        ) : (
          <div className={`inline-flex items-center justify-center h-6 ${containerSize}`}>
            <ActiveIcon size={iconSize} className={activeIconClass} />
          </div>
        )}
      </div>
    );
  }

  return (
    <Popover.Root open={isOpen} onOpenChange={handleOpenChange}>
      <Popover.Trigger className="cursor-pointer" data-test-id={testId}>
        {showFullBadge ? (
          <StatusButton option={currentOption} size={size} readonly={false} />
        ) : (
          <div className={`inline-flex items-center justify-center h-6 ${containerSize}`}>
            <ActiveIcon size={iconSize} className={activeIconClass} />
          </div>
        )}
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          className="bg-surface-base shadow rounded border border-stroke-base p-0.5 z-50"
          style={{ width: 220 }}
          sideOffset={4}
          alignOffset={2}
          align="start"
        >
          <div className="p-1">
            <div className="p-1 pb-0.5">
              <input
                ref={inputRef}
                className="w-full border border-stroke-base rounded px-2 py-1 text-sm bg-surface-base text-content-accent placeholder:text-content-dimmed focus:outline outline-brand-1 focus:border-stroke-base"
                placeholder="Change status..."
                value={searchTerm}
                autoFocus
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </div>

            <div className="overflow-y-auto pt-0.5 pb-0.5" style={{ maxHeight: 210 }}>
              {filteredStatusOptions.map((option, index) => {
                const isCurrentStatus = option.value === currentOption.value;
                const isSelected = index === selectedIndex;
                const OptionIcon = StatusSelector.STATUS_ICON_COMPONENTS[option.icon];
                const optionColor = StatusSelector.STATUS_COLOR_MAP[option.color];

                return (
                  <div
                    key={option.value}
                    ref={(el) => (itemRefs.current[index] = el)}
                    data-test-id={createTestId("status-option", option.value)}
                    className={classNames("flex items-center gap-2 px-1.5 py-1 rounded cursor-pointer", {
                      "bg-surface-dimmed": isSelected,
                      "hover:bg-surface-dimmed": !isSelected,
                    })}
                    onClick={() => handleItemClick(option as T)}
                    onMouseEnter={() => setSelectedIndex(index)}
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <OptionIcon
                        size={18}
                        className={classNames("flex-shrink-0 flex items-center", optionColor.iconClass)}
                      />
                      <div className="text-sm truncate">{option.label}</div>
                    </div>
                    {isCurrentStatus && <IconCircleCheckCustom size={14} className="text-primary-500 ml-2" />}
                  </div>
                );
              })}
            </div>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
export namespace StatusSelector {
  type StatusIconComponent = ComponentType<{ size?: number; className?: string }>;

  export const STATUS_ICON_COMPONENTS = {
    circleDashed: IconCircleDashed,
    circleDot: IconCircleDot,
    circleCheck: IconCircleCheckCustom,
    circleX: IconCircleXCustom,
    check: IconCheck,
  } satisfies Record<string, StatusIconComponent>;

  export type StatusIconName = keyof typeof STATUS_ICON_COMPONENTS;

  export const STATUS_COLOR_MAP = {
    gray: { iconClass: "text-content-dimmed", buttonColorClass: "text-content-dimmed" },
    blue: { iconClass: "text-brand-1", buttonColorClass: "text-brand-1" },
    green: { iconClass: "text-callout-success-content", buttonColorClass: "text-callout-success-content" },
    red: { iconClass: "text-callout-error-content", buttonColorClass: "text-callout-error-content" },
  } as const;

  export type StatusColorName = keyof typeof STATUS_COLOR_MAP;

  export const STATUS_BUTTON_VARIANTS = {
    default: {
      readonly: "border-surface-outline bg-surface-base cursor-default",
      interactive: "border-surface-outline bg-surface-base hover:bg-surface-accent cursor-pointer",
    },
    success: {
      readonly: "border-emerald-200 dark:border-emerald-800 bg-callout-success-bg cursor-default",
      interactive:
        "border-emerald-200 dark:border-emerald-800 bg-callout-success-bg hover:bg-emerald-50 dark:hover:bg-emerald-900/30 cursor-pointer",
    },
    muted: {
      readonly: "border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 cursor-default",
      interactive:
        "border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 cursor-pointer",
    },
  } as const;

  export type StatusButtonVariant = keyof typeof STATUS_BUTTON_VARIANTS;

  export type Size = "xs" | "sm" | "md" | "lg" | "xl" | "2xl";

  export interface StatusOption {
    id: string;
    label: string;
    icon: StatusIconName;
    color: StatusColorName;
    index: number;
    value: string;
    closed?: boolean;
    buttonVariant?: StatusButtonVariant;
    buttonIcon?: StatusIconName;
    legacy?: boolean;
  }

  export interface Props<T extends StatusOption = StatusOption> {
    statusOptions: ReadonlyArray<T>;
    status: T;
    onChange: (nextStatus: T) => void;
    size?: Size;
    readonly?: boolean;
    showFullBadge?: boolean;
    testId?: string;
  }
}
