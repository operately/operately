import { useTableRowContext } from "./context";

export function QuickEntryWidget() {
  const { showQuickEntryWidget } = useTableRowContext();
  
  if (!showQuickEntryWidget) return null;
  
  return (
    <tr className="bg-transparent">
      <td colSpan={7} className="p-0">
        <div className="relative">
          <ResponsiveWrapper />
        </div>
      </td>
    </tr>
  );
}

export function ResponsiveWrapper() {
  const { level, setShowQuickEntryWidget } = useTableRowContext();
  const indentPadding = level * 20;
  
  const handleClose = () => {
    setShowQuickEntryWidget(false);
  };

  return (
    <>
      {/* Mobile view - full width with proper padding */}
      <div className="block sm:hidden w-full px-2 pt-1 pb-2">
        <div className="bg-surface-base dark:bg-surface-dimmed shadow-lg border border-surface-outline rounded-md px-2 py-2 w-full">
          <QuickEntryForm onClose={handleClose} />
        </div>
      </div>

      {/* Desktop view - positioned with indent */}
      <div
        className="hidden sm:block absolute z-10 mt-1"
        style={{ marginLeft: `${indentPadding + 40}px` }}
      >
        <div className="bg-surface-base dark:bg-surface-dimmed shadow-lg border border-surface-outline rounded-md px-2 py-2 w-auto min-w-[400px]">
          <QuickEntryForm onClose={handleClose} />
        </div>
      </div>
    </>
  );
}

interface FormProps {
  onClose: () => void;
}

function QuickEntryForm({ onClose }: FormProps) {
  const { item } = useTableRowContext();
  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium">Add to {item.name}</h3>
        <button
          onClick={onClose}
          className="text-content-dimmed hover:text-content-base"
        >
          ✕
        </button>
      </div>
      <div className="flex gap-2">
        <button
          onClick={onClose}
          className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Add Project
        </button>
        <button
          onClick={onClose}
          className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
        >
          Add Goal
        </button>
      </div>
    </div>
  );
}
