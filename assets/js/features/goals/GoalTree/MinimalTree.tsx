import React from "react";

import { IconCircleCheckFilled, IconHexagons, IconTarget } from "@tabler/icons-react";

import AvatarList from "@/components/AvatarList";
import { statusBGColorClass, statusTextColorClass } from "@/components/status/colors";
import { assertPresent } from "@/utils/assertions";
import { truncateString } from "@/utils/strings";

import { TreeContextProvider, TreeContextProviderProps, useTreeContext } from "./treeContext";
import { Node, GoalNode, ProjectNode } from "./tree";
import { BlackLink } from "@/components/Link";

export function MinimalTree(props: TreeContextProviderProps) {
  return (
    <TreeContextProvider {...props}>
      <Nodes />
    </TreeContextProvider>
  );
}

function Nodes() {
  const { tree, setShowActive, setShowPaused, setShowCompleted } = useTreeContext();

  React.useEffect(() => {
    setShowActive(true);
    setShowPaused(true);
    setShowCompleted(true);
  }, []);

  return (
    <div className="flex flex-col gap-3">
      {tree.map((root) => (
        <NodeView node={root} key={root.id} />
      ))}
    </div>
  );
}

function NodeView({ node }: { node: Node }) {
  const Content =
    node.type === "goal" ? () => <Goal node={node as GoalNode} /> : () => <Project node={node as ProjectNode} />;

  return (
    <>
      <Content />
      {node.children?.map((child) => <NodeView key={child.id} node={child} />)}
    </>
  );
}

function Goal({ node }: { node: GoalNode }) {
  assertPresent(node.goal.reviewer, "reviewer must be present in goal");
  assertPresent(node.goal.champion, "champion must be present in goal");

  return (
    <NodeContainer node={node}>
      <IconTarget size={16} className="text-red-500" />
      <NodeName name={node.goal.name} link={node.linkTo()} completed={Boolean(node.goal.isClosed)} />
      <Dots />
      <AvatarList people={[node.goal.champion, node.goal.reviewer]} size={20} stacked />
      <Progress progress={node.progress} status={node.lastCheckInStatus} />
    </NodeContainer>
  );
}

function Project({ node }: { node: ProjectNode }) {
  assertPresent(node.project.contributors, "contributors must be present in project");
  const contributors = React.useMemo(
    () => node.project.contributors!.map((c) => c.person!),
    [node.project.contributors],
  );

  return (
    <NodeContainer node={node}>
      <IconHexagons size={16} className="text-indigo-500" />{" "}
      <NodeName name={node.project.name} link={node.linkTo()} completed={Boolean(node.project.closedAt)} />
      <Dots />
      <div>
        <AvatarList people={contributors} size={20} stacked />
      </div>
      <Progress progress={node.progress} status={node.lastCheckInStatus} />
    </NodeContainer>
  );
}

function NodeContainer({ node, children }) {
  return (
    <div className="flex items-center gap-2" style={{ paddingLeft: node.depth * 20 }}>
      {children}
    </div>
  );
}

function NodeName({ name, link, completed }) {
  name = truncateString(name, 40);
  const nameElement = (
    <BlackLink underline="hover" to={link} className="truncate" disableColorHoverEffect>
      {name}
    </BlackLink>
  );

  if (!completed) return nameElement;

  return (
    <>
      <s>{nameElement}</s>
      <IconCircleCheckFilled size={16} className="text-green-700" />
      <div className="text-sm text-green-700 font-medium">Done</div>
    </>
  );
}

function Dots() {
  return <div className="border-t-2 border-dotted border-stroke-base flex-1 mx-1" />;
}

function Progress({ progress, status }) {
  const statusColor = statusTextColorClass(status, { customShade: 700 });
  const statusBGColor = statusBGColorClass(status, { customShade: 100 });

  const outerClass = `w-11 flex justify-center rounded-lg px-2 py-0.5 shrink-0 ${statusBGColor}`;
  const innerClass = `text-sm font-medium font-mono ${statusColor}`;
  progress = isNaN(progress) ? 0 : Math.floor(progress);

  return (
    <div className={outerClass}>
      <div className={innerClass}>{progress}%</div>
    </div>
  );
}
