import React, { forwardRef, useImperativeHandle, useState, useEffect } from "react";

import * as People from "@/models/people";
import Avatar from "@/components/Avatar";

/**
 *  This is a custom mention list component for tiptap.
 *  It is used to display the list of people that can be mentioned.
 *
 *  It is used in the Mention extension.
 *  https://tiptap.dev/api/nodes/mention
 *
 *  When active, the MentionList component will be rendered in a tippy popup.
 *  https://atomiks.github.io/tippyjs/
 *
 *  The component allows the user to navigate the list using the arrow keys.
 *  When the user presses enter, the selected item will be inserted into the editor.
 *  When the user presses escape, the popup will be closed.
 *  When the user clicks outside the popup, the popup will be closed.
 *
 */

//
// The props that are passed to the MentionList component.
// The items are the people that can be mentioned.
// The command is a function that will be called when the user selects an item.
//
interface MentionListProps {
  items: People.Person[];
  command: ({ id, label }: { id: string; label: string }) => void;
}

export const MentionList = forwardRef((props: MentionListProps, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const selectItem = (index: number) => {
    const item = props.items[index];

    if (item) {
      props.command({ id: item.id!, label: item.fullName! });
    }
  };

  const nextIndex = (index: number) => {
    return (index + 1) % props.items.length;
  };

  const prevIndex = (index: number) => {
    return (index + props.items.length - 1) % props.items.length;
  };

  const upHandler = () => {
    setSelectedIndex(prevIndex(selectedIndex));
  };

  const downHandler = () => {
    setSelectedIndex(nextIndex(selectedIndex));
  };

  const enterHandler = () => {
    selectItem(selectedIndex);
  };

  useEffect(() => setSelectedIndex(0), [props.items]);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }) => {
      if (event.key === "ArrowUp") {
        upHandler();
        return true;
      }

      if (event.key === "ArrowDown") {
        downHandler();
        return true;
      }

      if (event.key === "Enter") {
        enterHandler();
        return true;
      }

      return false;
    },
  }));

  return (
    <div className="flex flex-col border border-surface-outline rounded overflow-hidden bg-surface">
      {props.items.length > 0 ? (
        <ItemList items={props.items} selectItem={selectItem} selectedIndex={selectedIndex} />
      ) : (
        <NoResult />
      )}
    </div>
  );
});

interface ItemListProps {
  items: People.Person[];
  selectItem: (index: number) => void;
  selectedIndex: number;
}

function ItemList({ items, selectItem, selectedIndex }: ItemListProps): JSX.Element {
  const baseClass = "px-1.5 py-1 text-left";
  const selectedClass = baseClass + " bg-accent-1 text-content-accent";
  const unselectedClass = baseClass + " text-content-accent hover:bg-accent-1";

  return (
    <>
      {items.map((item: People.Person, index: number) => (
        <button
          key={index}
          className={index === selectedIndex ? selectedClass : unselectedClass}
          onClick={() => selectItem(index)}
        >
          <div className="flex items-center gap-2 text-sm font-medium">
            <Avatar person={item} size="tiny" />
            {item.fullName}
          </div>
        </button>
      ))}
    </>
  );
}

function NoResult(): JSX.Element {
  return <div className="px-1.5 py-1 text-left">No result</div>;
}
