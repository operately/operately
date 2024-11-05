import * as React from "react";
import * as TipTap from "@tiptap/react";
import * as People from "@/models/people";

import Avatar from "@/components/Avatar";
import { usePersonNameAndAvatar } from "@/contexts/CurrentCompanyContext";

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
  const { fullName, avatar, loading } = usePersonNameAndAvatar(node.attrs.id);

  let person: People.Person;

  if (loading) {
    person = { fullName: node.attrs.label };
  } else {
    person = { fullName: fullName, avatarUrl: avatar };
  }

  const [avatarsize, setAvatarsize] = React.useState(20);

  React.useEffect(() => {
    if (!ref.current) return;

    const style = window.getComputedStyle(ref.current, null);
    const fontSize = parseFloat(style.getPropertyValue("font-size"));
    const size = Math.floor(fontSize * 1.2);

    setAvatarsize(size);
  }, [ref]);

  return (
    <TipTap.NodeViewWrapper className="inline">
      <div ref={ref} className="inline mr-0.5 align-sub">
        <Avatar person={person} size={avatarsize} />
      </div>

      {People.firstName(person)}
    </TipTap.NodeViewWrapper>
  );
}
