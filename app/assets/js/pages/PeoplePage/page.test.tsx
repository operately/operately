import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { PeopleList } from "./page";

jest.mock("turboui", () => ({
  Avatar: ({ person }: { person: { fullName: string } }) => <img alt={person.fullName} />,
  Link: ({ to, children, testId }: { to: string; children: React.ReactNode; testId?: string }) => (
    <a href={to} data-test-id={testId}>
      {children}
    </a>
  ),
}));

jest.mock("@/routes/paths", () => ({
  usePaths: () => ({ profilePath: (id: string) => `/people/${id}` }),
}));

describe("PeoplePage PeopleList", () => {
  const people: any[] = [
    { id: "1", fullName: "Alice Anderson", title: "CEO" },
    { id: "2", fullName: "Bob Brown", title: "CTO" },
  ];

  it("renders the members as a list, one item per person", () => {
    const html = renderToStaticMarkup(<PeopleList people={people} />);

    expect(html).toContain("<ul");
    expect((html.match(/<li/g) || []).length).toBe(people.length);
  });

  it("links each member to their profile", () => {
    const html = renderToStaticMarkup(<PeopleList people={people} />);

    expect(html).toContain('href="/people/1"');
    expect(html).toContain("Alice Anderson");
    expect(html).toContain('href="/people/2"');
    expect(html).toContain("Bob Brown");
  });
});
