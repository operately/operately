import React from "react";
import classNames from "classnames";

interface TableProps {
  headers: string[];
  rows: React.ReactNode[][];
  columnSizes?: number[];
  cellPadding?: string;
}

export function Table(props: TableProps) {
  const { headers } = props;

  return (
    <div className="border border-stroke-base overflow-x-scroll min-w-full">
      <div className="inline-block min-w-full">
        <div className="flex min-w-full">
          {headers.map((header, index) => (
            <div
              key={index}
              className={classNames(
                "text-sm font-bold uppercase",
                props.cellPadding,
                "shrink-0",
                "not-first:border-l border-stroke-base",
              )}
              style={{
                width: props.columnSizes?.[index] + "px",
              }}
            >
              {header}
            </div>
          ))}
        </div>
      </div>

      {props.rows.map((row, index) => (
        <div key={index} className="inline-block min-w-full">
          <div className="border-t border-stroke-base">
            <div key={index} className="flex">
              {row.map((cell, index) => (
                <div
                  key={index}
                  className={classNames(
                    "text-sm",
                    props.cellPadding,
                    "shrink-0",
                    "not-first:border-l border-stroke-base",
                  )}
                  style={{ width: props.columnSizes?.[index] + "px" }}
                >
                  {cell}
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
