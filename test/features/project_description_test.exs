defmodule Operately.Features.ProjectsDescriptionTest do
  use Operately.FeatureCase

  alias Operately.Support.Features.ProjectSteps

  setup ctx do
    ctx = ProjectSteps.create_project(ctx, name: "Test Project")
    ctx = ProjectSteps.login(ctx)

    {:ok, ctx}
  end

  @tag login_as: :champion
  feature "writing a project description", ctx do
    ctx
    |> visit_show(ctx.project)
    |> UI.assert_text("Project description is not yet set")
    |> UI.assert_text("Write project description")
    |> UI.click(testid: "write-project-description-link")
    |> UI.fill_rich_text(project_description())
    |> UI.click(testid: "save")
    |> visit_show(ctx.project)
    |> UI.assert_text(project_description())
  end

  @tag login_as: :champion
  feature "editing a project description", ctx do
    {:ok, project} = Operately.Projects.update_project(ctx.project, %{
      description: Operately.Support.RichText.rich_text(project_description())
    })

    ctx
    |> visit_show(project)
    |> UI.click(testid: "edit-project-description-link")
    |> UI.fill_rich_text(project_description())
    |> UI.click(testid: "save")
    |> visit_show(ctx.project)
    |> UI.assert_text(project_description())
  end

  @tag login_as: :reviewer
  feature "contributors can't edit the project description", ctx do
    ctx
    |> visit_show(ctx.project)
    |> UI.assert_text("Project description is not yet set")
    |> UI.refute_text("Write project description")
  end

  #
  # ======== Helper functions ========
  #

  defp visit_show(ctx, project) do
    UI.visit(ctx, "/projects" <> "/" <> project.id)
  end

  defp project_description() do
    """
    SuperPace is an innovative project designed to track and quantify DevOps
    TEXT START MARKER <- this is the start of the text
    Research and Assessment (DORA) metrics for organizations across the globe. The
    project's primary goal is to empower development and operations teams by
    providing insightful, actionable data to drive performance and productivity
    improvements.

    DORA includes some fancy stuff that is mentioned in this line

    SuperPace will do something called Y, instead of X

    SuperPace utilizes cutting-edge data collection and analytics technologies to
    meticulously gather, measure, and interpret key DORA metrics, including
    deployment frequency, lead time for changes, time to restore service, and
    change failure rate. By translating these metrics into practical insights,
    SuperPace fosters continuous learning, enhances collaboration, and accelerates
    the pace of innovation in the complex, fast-paced world.
    TEXT END MARKER <- this is the end of the text
    """
  end
end
