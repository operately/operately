import { StatusBadge } from "../../StatusBadge";
import { WorkMap } from "..";
import { ChildRows } from "./ChildRows";
import { DeadlineCell } from "./DeadlineCell";
import { ItemNameCell } from "./ItemNameCell";
import { NextStepCell } from "./NextStepCell";
import { OwnerCell } from "./OwnerCell";
import { ProgressCell } from "./ProgressCell";
import { SpaceCell } from "./SpaceCell";
import { RowContainer } from "./RowContainer";
import { TableRowProvider, useTableRowContext } from "./context";
import { QuickEntryWidget } from "../QuickEntryWidget";

interface Props {
  item: WorkMap.Item;
  level: number;
  isLast: boolean;
  filter: WorkMap.Filter;
  isSelected?: boolean;
  selectedItemId?: string;
  onRowClick?: (item: WorkMap.Item) => void;
  onDelete: () => void;
  addItem: (newItem: WorkMap.NewItem) => void;
}

/**
 * TableRow component for rendering a WorkMap item (goal or project) in a table
 * Handles recursive rendering of children, styling for different item states,
 * and interactions like hover, selection, and adding new items
 */
export function TableRow(props: Props) {
  const { item, filter } = props;

  return (
    <TableRowProvider {...props}>
      <RowContainer>
        <ItemNameCell />
        <StatusCell status={item.status} />
        {filter !== "completed" && (
          <ProgressCell progress={item.progress} status={item.status} />
        )}
        <DeadlineCell
          filter={filter}
          completedOn={item.closedAt}
          timeframe={item.timeframe}
          status={item.status}
        />
        <SpaceCell space={item.space} status={item.status} />
        <OwnerCell owner={item.owner} status={item.status} />
        {filter !== "completed" && (
          <NextStepCell nextStep={item.nextStep} status={item.status} />
        )}
      </RowContainer>

      <QuickEntryWidgetWrapper addItem={props.addItem} />
      <ChildRows {...props} />
    </TableRowProvider>
  );
}

function QuickEntryWidgetWrapper({ addItem }: { addItem: Props["addItem"] }) {
  const {
    indentPadding,
    item,
    showQuickEntryWidget,
    setShowQuickEntryWidget,
    filter,
  } = useTableRowContext();

  return (
    <QuickEntryWidget
      addItem={addItem}
      indentPadding={indentPadding}
      item={item}
      setShowWidget={setShowQuickEntryWidget}
      showWidget={showQuickEntryWidget}
      filter={filter}
    />
  );
}

function StatusCell({ status }: { status: WorkMap.Status }) {
  return (
    <td className="py-2 px-2 md:px-4">
      <div className="transform group-hover:scale-105 transition-transform duration-150">
        <StatusBadge status={status} />
      </div>
    </td>
  );
}
