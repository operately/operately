import React from "react";

import * as Icons from "@tabler/icons-react";

import { useMe, useHomeDashboard, Panel, useUpdateDashboard, Dashboard, sortPanelsByIndex } from "@/graphql/Me";
import { useCompany } from "@/graphql/Companies";

import { AccountCard } from "./AccountCard";
import { MyAssignmentsCard } from "./MyAssignmentsCard";
import { ActivityFeedCard } from "./ActivityFeedCard";
import { MyProjectsCard } from "./MyProjectsCard";
import { PinnedProjectCard } from "./PinnedProjectCard";
import Button from "@/components/Button";

export async function loader(): Promise<null> {
  return null;
}

import classnames from "classnames";

import { motion } from "framer-motion";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  useDndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";

import { SortableContext, useSortable, arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";

interface ContextDescriptor {
  editing?: boolean;
  startEditing?: () => void;
  finishEditing?: () => void;
}

const Context = React.createContext<ContextDescriptor>({});

export function Page() {
  const [editing, setEditing] = React.useState(false);

  const meData = useMe();
  const dashboard = useHomeDashboard({
    fetchPolicy: "network-only",
  });
  const companyData = useCompany();

  if (meData.error) {
    console.error(meData.error);
    return null;
  }

  if (companyData.error) {
    console.error(companyData.error);
    return null;
  }

  if (dashboard.error) {
    console.error(dashboard.error);
    return null;
  }

  if (!meData.data || !companyData.data || !dashboard.data) {
    return null;
  }

  const me = meData.data.me;
  const company = companyData.data.company;

  const startEditing = () => setEditing(true);
  const finishEditing = async () => {
    setEditing(false);
    await dashboard.refetch();
  };

  return (
    <div className="max-w-5xl mx-auto mt-20 flex flex-col gap-8">
      <div className="flex items-center justify-center">
        <input
          type="text"
          className="w-1/2 rounded-lg px-4 py-2 bg-dark-3 block border border-shade-2 placeholder:text-white-2"
          placeholder="Search projects, people, goals..."
        />
      </div>

      <Context.Provider value={{ editing, startEditing, finishEditing }}>
        <DashboardView me={me} company={company} dashboard={dashboard.data.homeDashboard} />
      </Context.Provider>
    </div>
  );
}

const styles: { [style: string]: React.CSSProperties } = {
  grid: {
    display: "grid",
    gridGap: 24,
    padding: 0,
  },
  cardStyles: {
    position: "relative",
    height: "300px",
  },
};

const spanSize = {
  account: 1,
  "my-assignments": 2,
  activity: 2,
  "my-projects": 1,
};

function DashboardView({ me, company, dashboard }: { me: any; company: any; dashboard: Dashboard }) {
  const { editing, startEditing, finishEditing } = React.useContext(Context);

  const [update, { loading }] = useUpdateDashboard({
    onCompleted: () => {
      if (finishEditing) finishEditing();
    },
  });

  let sortedPanels = sortPanelsByIndex(dashboard.panels);

  const [panels, setPanels] = React.useState<Panel[]>(sortedPanels);

  const [activeId, setActiveId] = React.useState<string | null>(null);
  const columnCount = 3;

  const saveChanges = () => {
    update({
      variables: {
        input: {
          id: dashboard.id,
          panels: panels.map((panel) => ({
            id: panel.id.includes("temp-id") ? undefined : panel.id,
            type: panel.type,
            index: panels.findIndex((p) => p.id === panel.id),
          })),
        },
      },
    });
  };

  const handleDragStart = ({ active }) => {
    setActiveId(active.id);
  };

  const handleDragOver = ({ active, over }: DragEndEvent) => {
    setPanels((panels: Panel[]) => {
      if (!active) return panels;
      if (!over) return panels;

      const overIndex = panels.findIndex((panel) => panel.id === over.id);
      const activeIndex = panels.findIndex((panel) => panel.id === active.id);

      return arrayMove(panels, activeIndex, overIndex);
    });
  };

  const handleDragEnd = () => {
    setActiveId(null);
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const removePanel = (id: string) => {
    setPanels((panels) => panels.filter((panel) => panel.id !== id));
  };

  const active = panels.find((p) => p.id === activeId);

  const addablePanels = [
    { title: "My Profile", panel: { id: "temp-id-1", type: "account" } },
    { title: "My Assignments", panel: { id: "temp-id-2", type: "my-assignments" } },
    { title: "Activity Feed", panel: { id: "temp-id-3", type: "activity" } },
    { title: "My Projects", panel: { id: "temp-id-4", type: "my-projects" } },
  ].filter((panel) => !panels.find((p) => p.type === panel.panel.type));

  return (
    <>
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
        <SortableContext items={panels} strategy={() => null}>
          <div
            style={{
              ...styles.grid,
              gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`,
            }}
          >
            {panels.map((panel) => (
              <Item
                key={panel.id}
                id={panel.id}
                activeId={activeId}
                span={spanSize[panel.type]}
                remove={() => removePanel(panel.id)}
              >
                <Content id={panel.id} me={me} company={company} panel={panel} />
              </Item>
            ))}
          </div>
        </SortableContext>

        <DragOverlay>
          {active ? (
            <DragOverlayItem id={active.id}>
              <Content id={active} me={me} company={company} panel={active} />
            </DragOverlayItem>
          ) : null}
        </DragOverlay>
      </DndContext>

      <div className="mb-8 flex items-center justify-center text-sm gap-2">
        {!editing && (
          <Button variant="secondary" onClick={startEditing}>
            <Icons.IconGridPattern size={16} />
            Edit Home Page
          </Button>
        )}

        {editing && (
          <Button variant="success" onClick={saveChanges} loading={loading}>
            Save Changes
          </Button>
        )}
      </div>

      {editing && (
        <div className="flex justify-center gap-4 mb-8">
          {addablePanels.map((panel) => (
            <div
              key={panel.panel.id}
              className="flex items-center justify-center bg-dark-3 rounded-[20px] p-4 gap-4 cursor-pointer relative"
              onClick={() => setPanels((panels) => [...panels, panel.panel])}
            >
              <div className="p-1 bg-green-400 rounded-full">
                <Icons.IconPlus size={16} className="text-dark-1" />
              </div>
              <div>{panel.title}</div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function Content({ me, company, panel }) {
  switch (panel.type) {
    case "account":
      return <AccountCard me={me} company={company} />;
    case "my-assignments":
      return <MyAssignmentsCard />;
    case "activity":
      return <ActivityFeedCard />;
    case "my-projects":
      return <MyProjectsCard />;
    case "pinned-project":
      return <PinnedProjectCard panel={panel} />;
    default:
      console.error("Unknown panel type", panel);
      return null;
  }
}

// string interpolation won't work here
// because tailwind removes unused classes
// so we need to use an array
const colSpanOptions = ["col-span-0", "col-span-1", "col-span-2", "col-span-3"];

function Item({ id, activeId, children, span = 1, remove }) {
  const { editing } = React.useContext(Context);

  const sortable = useSortable({
    id,
    disabled: !editing,
  });

  const { setNodeRef, attributes, listeners, isDragging, transform, transition } = sortable;

  return (
    <motion.div
      layoutId={id}
      transition={{
        type: "spring",
        duration: activeId ? 0 : 0.6,
      }}
      className={classnames(colSpanOptions[span], "relative", {
        "hover:scale-[1.01] transition-transform cursor-pointer": !editing,
        "animate-shake": editing && !isDragging,
      })}
      ref={setNodeRef}
      style={{
        ...styles.cardStyles,
        opacity: isDragging ? 0.5 : 1,
        transition,
      }}
    >
      {children}
      {editing && <div className="absolute inset-0 opacity-30 bg-dark-1"></div>}
      {editing && (
        <div
          className="absolute p-1 top-2 right-2 flex items-center justify-center bg-red-400 rounded-full"
          onClick={() => remove()}
        >
          <Icons.IconX size={16} className="text-dark-1" />
        </div>
      )}
      {editing && (
        <div
          className="absolute p-1 top-2 right-10 flex items-center justify-center bg-dark-5 rounded-full"
          onClick={() => remove()}
          {...attributes}
          {...listeners}
        >
          <Icons.IconGripVertical size={16} className="text-white-1" />
        </div>
      )}
    </motion.div>
  );
}

function DragOverlayItem({ id, children }) {
  // DragOver seems to cache this component so I can't tell if the item is still actually active
  // It will remain active until it has settled in place rather than when dragEnd has occured
  // I need to know when drag end has taken place to trigger the scale down animation
  // I use a hook which looks at DndContex to get active

  const isReallyActive = useDndIsReallyActiveId(id);

  return (
    <div
      style={{
        ...styles.cardStyles,
        backgroundColor: id,
        height: "100%",
        padding: 0,
        transform: isReallyActive ? "scale(1.05)" : "none",
      }}
      children={children}
    />
  );
}

function useDndIsReallyActiveId(id: string) {
  const context = useDndContext();
  const isActive = context.active?.id === id;
  return isActive;
}
