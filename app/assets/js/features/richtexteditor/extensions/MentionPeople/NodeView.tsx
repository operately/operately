import * as People from "@/models/people";
import * as TipTap from "@tiptap/react";
import * as React from "react";

import { usePersonNameAndAvatar } from "@/contexts/CurrentCompanyContext";
import { Avatar } from "turboui";

//
// The node view is responsible for rendering the node as a DOM element.
// It behaves like a React component, but it needs to be wrapped in a
// TipTap.NodeViewWrapper in order to function inside the editor.
//
// The editor receives a TipTap.Node instance. The assumpition is that the
// node.attrs.id is the person ID, based on which we fetch the person's avatar.
//

interface Node {
  attrs: {
    id: string;
    label: string;
  };
}

export function NodeView({ node }: { node: Node }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const { person: loadedPerson } = usePersonNameAndAvatar(node.attrs.id);
  const person = loadedPerson || { fullName: node.attrs.label, id: node.attrs.id, title: "", avatarUrl: "" };

  const [avatarsize, setAvatarsize] = React.useState(20);

  React.useEffect(() => {
    if (!ref.current) return;

    const size = getFontSize(ref.current);
    if (size) setAvatarsize(size);
  }, [ref]);

  return (
    <TipTap.NodeViewWrapper className="inline">
      <span
        ref={ref}
        className="inline-block mr-1 align-[-4px]"
        style={{
          height: "1em",
          lineHeight: "1em",
          overflow: "visible",
        }}
      >
        <Avatar person={person} size={avatarsize} />
      </span>

      {People.firstName(person)}
    </TipTap.NodeViewWrapper>
  );
}

function getFontSize(element: HTMLElement): number {
  const style = window.getComputedStyle(element, null);
  const fontSize = parseFloat(style.getPropertyValue("font-size"));

  return fontSize + 3;
}
