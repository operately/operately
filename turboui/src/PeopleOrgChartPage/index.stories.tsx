import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { PeopleOrgChartPage } from ".";
import type { Person } from "../ApiTypes";

const meta = {
  title: "Pages/PeopleOrgChartPage",
  component: PeopleOrgChartPage,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof PeopleOrgChartPage>;
export default meta;
type Story = StoryObj<typeof meta>;
const manager: Person = {
  __typename: "person",
  id: "ana",
  fullName: "Ana Silva",
  title: "Design lead",
  email: "ana@example.com",
  avatarUrl: null,
  type: "member",
};
const root = { person: manager, totalReports: 1, directReports: 1 };
const nodes = [
  root,
  {
    person: { ...manager, id: "jose", fullName: "José Souza", title: "Designer", manager },
    totalReports: 0,
    directReports: 0,
  },
];

function Interactive(props: PeopleOrgChartPage.Props) {
  const [expanded, setExpanded] = useState<string[]>([]);
  return (
    <PeopleOrgChartPage
      {...props}
      chart={{
        ...props.chart,
        expanded,
        toggle: (id) => setExpanded((ids) => (ids.includes(id) ? [] : [id])),
        collapse: () => setExpanded([]),
      }}
    />
  );
}
const args: PeopleOrgChartPage.Props = {
  chart: { root: [root], nodes, expanded: [], toggle: () => {}, collapse: () => {} },
  profileHref: (id) => `/people/${id}`,
  idsMatch: (a, b) => !!a && a === b,
};
export const Default: Story = { args, render: (props) => <Interactive {...props} /> };
export const Empty: Story = { args: { ...args, chart: { ...args.chart, root: [], nodes: [] } } };
export const Narrow: Story = {
  ...Default,
  decorators: [
    (Story) => (
      <div style={{ width: 375 }}>
        <Story />
      </div>
    ),
  ],
};
