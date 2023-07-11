import React from "react";

import * as Icons from "@tabler/icons-react";

import { useMe, useHomeDashboard, Dashoard, Panel } from "@/graphql/Me";
import { useCompany } from "@/graphql/Companies";

import { AccountCard } from "./AccountCard";
import { MyAssignmentsCard } from "./MyAssignmentsCard";
import { ActivityFeedCard } from "./ActivityFeedCard";
import { MyProjectsCard } from "./MyProjectsCard";
import { PinnedProjectCard } from "./PinnedProjectCard";

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
}

const Context = React.createContext<ContextDescriptor>({});

export function HomePage() {
  const [editing, setEditing] = React.useState(false);

  const toggleEditing = () => setEditing((editing) => !editing);

  const meData = useMe();
  const dashboard = useHomeDashboard();
  const companyData = useCompany();

  if (!meData.data || !companyData.data || !dashboard.data) {
    return null;
  }

  const me = meData.data.me;
  const company = companyData.data.company;

  return (
    <div className="max-w-5xl mx-auto mt-20 flex flex-col gap-8">
      <div className="flex items-center justify-center">
        <input
          type="text"
          className="w-1/2 rounded-lg px-4 py-2 bg-dark-3 block border border-shade-2 placeholder:text-white-2"
          placeholder="Search projects, people, goals..."
        />
      </div>

      <Context.Provider value={{ editing }}>
        <DashboardView me={me} company={company} dashboard={dashboard.data.homeDashboard} />
      </Context.Provider>

      <div className="mb-8 flex items-center justify-center text-sm gap-2">
        <div
          className="font-medium flex items-center gap-2 border border-shade-3 rounded-[20px] px-3 py-1.5 cursor-pointer"
          onClick={toggleEditing}
        >
          <Icons.IconGridPattern size={16} />
          Edit Home Page
        </div>

        <div className="font-medium flex items-center gap-2 border border-shade-3 rounded-[20px] px-3 py-1.5 cursor-pointer">
          <Icons.IconArrowUp size={16} /> Back to Top
        </div>
      </div>
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

function DashboardView({ me, company, dashboard }: { me: any; company: any; dashboard: Dashoard }) {
  const [panels, setPanels] = React.useState<Panel[]>(dashboard.panels);

  const [activeId, setActiveId] = React.useState<string | null>(null);
  const columnCount = 3;

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
