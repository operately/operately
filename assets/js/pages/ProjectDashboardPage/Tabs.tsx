import React from "react";
import * as Icons from "tabler-icons-react";

import { Container, Tab } from "@/components/Tabs";

import Overview from "./Overview";
import Contributors from "./Contributors";
import Timeline from "./Timeline";

export default function Tabs({ activeTab, project }) {
  const basePath = `/projects/${project.id}`;

  return (
    <Container active={activeTab} basePath={basePath}>
      <Tab
        icon={(active) => (
          <Icons.LayoutCollage
            size={20}
            className={active ? "text-pink-400" : ""}
          />
        )}
        title="Overview"
        path="/"
        element={<Overview project={project} />}
      />

      <Tab
        icon={(active) => (
          <Icons.Map2 size={20} className={active ? "text-pink-400" : ""} />
        )}
        title="Timeline"
        path="/timeline"
        element={<Timeline project={project} />}
      />

      <Tab
        icon={(active) => (
          <Icons.Users size={20} className={active ? "text-pink-400" : ""} />
        )}
        title="Contributors"
        path="/contributors"
        element={<Contributors project={project} />}
      />
    </Container>
  );
}
