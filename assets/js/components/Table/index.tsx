import React from "react";
import classnames from "classnames";

//
// Example usage:
//
// const headers = [
//   { id: "health", label: "Health", size: "w-6" },
//   { id: "phase", label: "Phase", size: "w-6" },
//   { id: "title", label: "Title", size: "flex-1" }
// ]
//
// const rows = [
//   {
//     health: "Healthy",
//     phase: "Planning",
//     title: "My Project"
//   },
//   {
//     health: "At Risk",
//     phase: "Execution",
//     title: "My Other Project"
//   }
// ]
//
// <Table headers={headers} rows={rows} />
//

interface Header {
  id: string;
  label: string;
  size: string;
  visible?: boolean;
}

interface Row {
  onClick?: () => null;
  cells: Cells;
}

interface Cells {
  [key: string]: React.ReactNode;
}

interface Style {
  header?: HeaderStyle;
}

interface HeaderStyle {
  className?: string;
}

interface ContextDescriptor {
  headers: Header[];
  rows: Row[];
  style: Style;
}

const Context = React.createContext<ContextDescriptor | null>(null);

export default function Table({ headers, rows, style }) {
  return (
    <Context.Provider value={{ headers, rows, style }}>
      <div className="flex flex-col">
        <Headers />
        <Rows />
      </div>
    </Context.Provider>
  );
}

function Headers() {
  const { headers, style } = React.useContext(Context) as ContextDescriptor;

  const visibleHeaders = headers.filter((header) => header.visible !== false);

  return (
    <TableRow className={classnames("text-sm text-white-2", style?.header?.className)}>
      {visibleHeaders.map((column, index) => (
        <TableCell key={index} size={column.size} className="font-bold text-white-1">
          {column.label}
        </TableCell>
      ))}
    </TableRow>
  );
}

function Rows() {
  const { headers, rows } = React.useContext(Context) as ContextDescriptor;

  const visibleHeaders = headers.filter((header) => header.visible !== false);

  return (
    <div className="flex flex-col">
      {rows.map((row, index) => (
        <TableRow key={index} onClick={row.onClick} className="hover:bg-dark-4 cursor-pointer transition-colors">
          {visibleHeaders.map((column, index) => (
            <TableCell key={index} size={column.size}>
              {row.cells[column.id]}
            </TableCell>
          ))}
        </TableRow>
      ))}
    </div>
  );
}

function TableRow({ children, className = "", onClick = () => null }) {
  return (
    <div
      className={
        "flex items-center justify-between gap-4 first:border-t border-b border-shade-1 py-3 px-6 " + className
      }
      onClick={onClick}
    >
      {children}
    </div>
  );
}

function TableCell({ children, size, className = "" }) {
  return <div className={"flex items-center gap-2 shrink-0" + " " + size + " " + className}>{children}</div>;
}
