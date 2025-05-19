import * as TipTap from "@tiptap/react";
import React from "react";

import { Avatar } from "../../../Avatar";
import { usePerson } from "../../EditorContext";

interface Person {
  id: string;
  fullName: string;
  avatarUrl: string | null;
}

//
// The node view is responsible for rendering the node as a DOM element.
// It behaves like a React component, but it needs to be wrapped in a
// TipTap.NodeViewWrapper in order to function inside the editor.
//
// The editor receives a TipTap.Node instance. The assumpition is that the
// node.attrs.id is the person ID, based on which we fetch the person's avatar.
//

export const NodeView: React.FC<TipTap.NodeViewProps> = (props) => {
  const { node } = props;
  const ref = React.useRef<HTMLDivElement>(null);
  const loadedPerson = usePerson(node.attrs.id);
  const person = loadedPerson || { fullName: node.attrs.label, id: node.attrs.id, title: "", avatarUrl: "" };

  const [avatarsize, setAvatarsize] = React.useState(20);

  React.useEffect(() => {
    if (!ref.current) return;

    const size = getFontSize(ref.current);
    if (size) setAvatarsize(size);
  }, [ref]);

  return (
    <TipTap.NodeViewWrapper className="inline">
      <div ref={ref} className="inline mr-0.5 align-sub">
        <Avatar person={person} size={avatarsize} />
      </div>

      {firstName(person)}
    </TipTap.NodeViewWrapper>
  );
};

function firstName(person: Person): string {
  if (!person) return "";
  const name = person.fullName || "";
  const parts = name.split(" ");
  if (parts.length > 1) {
    return parts.slice(0, -1).join(" ");
  } else {
    return name;
  }
}

function getFontSize(element: HTMLElement): number {
  const style = window.getComputedStyle(element, null);
  const fontSize = parseFloat(style.getPropertyValue("font-size"));

  return fontSize;
}
