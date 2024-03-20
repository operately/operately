import * as React from "react";
import * as People from "@/models/people";

import { Link } from "@/components/Link";
import { Paths } from "@/routes/paths";
import { FeedItem, Container } from "../FeedItem";

export const ProjectCreated: FeedItem = {
  typename: "ActivityContentProjectCreated",

  contentQuery: `
    project {
      id
      name
    }
  `,

  component: ({ activity, content, page }) => {
    const projectPath = Paths.projectPath(content.project.id);

    return (
      <Container
        title={
          <>
            {People.shortName(activity.author)} added
            {page === "project" ? (
              <> this project</>
            ) : (
              <>
                {" "}
                the <Link to={projectPath}>{content.project.name}</Link> project
              </>
            )}
          </>
        }
        author={activity.author}
        time={activity.insertedAt}
      />
    );
  },
};
