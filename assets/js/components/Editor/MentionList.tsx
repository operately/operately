import React, { forwardRef, useImperativeHandle, useState, useEffect } from 'react';

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
  items: Item[];
  command: ({ id, label }: { id: string, label: string }) => void;
}

interface Item {
  id: string;
  label: string;
}

const MentionList = forwardRef((props : MentionListProps, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0)

  const selectItem = (index : number) => {
    const item = props.items[index];

    if(item) {
      props.command(item);
    }
  }

  const nextIndex = (index : number) => {
    return (index + 1) % props.items.length;
  }

  const prevIndex = (index : number) => {
    return (index + props.items.length - 1) % props.items.length;
  }

  const upHandler = () => {
    setSelectedIndex(nextIndex(selectedIndex))
  }

  const downHandler = () => {
    setSelectedIndex(prevIndex(selectedIndex))
  }

  const enterHandler = () => {
    selectItem(selectedIndex)
  }

  useEffect(() => setSelectedIndex(0), [props.items])

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }) => {
      if (event.key === 'ArrowUp') {
        upHandler()
        return true
      }

      if (event.key === 'ArrowDown') {
        downHandler()
        return true
      }

      if (event.key === 'Enter') {
        enterHandler()
        return true
      }

      return false
    },
  }))

  return (
    <div className="flex flex-col border bg-white rounded">
      {props.items.length > 0
        ? <ItemList items={props.items} selectItem={selectItem} selectedIndex={selectedIndex} />
        : <NoResult />}
    </div>
  )
})

interface ItemListProps {
  items: Item[];
  selectItem: (index : number) => void;
  selectedIndex: number;
}

function ItemList({items, selectItem, selectedIndex} : ItemListProps) : JSX.Element {
  const baseClass = 'px-1 py-0.5 text-left';
  const selectedClass = baseClass + ' bg-sky-200 text-black';
  const unselectedClass = baseClass + ' text-stone-500 rounded hover:bg-sky-200 hover:text-black transition';

  return <>
    {items.map((item : Item, index : number) => (
      <button
        key={index}
        className={index === selectedIndex ? selectedClass : unselectedClass}
        onClick={() => selectItem(index)}
      >{item.label}</button>
    ))}
  </>;
}

function NoResult() : JSX.Element {
  return <div className="px-1 py-0.5 text-left">No result</div>;
}

export default MentionList;
