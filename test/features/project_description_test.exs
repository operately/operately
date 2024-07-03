defmodule Operately.Features.ProjectsDescriptionTest do
  use Operately.FeatureCase

  alias Operately.Support.Features.ProjectSteps, as: Steps

  setup ctx do
    ctx = Steps.create_project(ctx, name: "Test Project")
    ctx = Steps.login(ctx)

    {:ok, ctx}
  end

  @tag login_as: :champion
  feature "writing a project description", ctx do
    ctx
    |> Steps.visit_project_page()
    |> Steps.assert_project_description_absent()
    |> Steps.submit_project_description(description: project_description())
    |> Steps.assert_project_description_present(description: project_description())
  end

  @tag login_as: :champion
  feature "editing a project description", ctx do
    ctx
    |> Steps.given_project_has_description(description: "Old description")
    |> Steps.assert_project_description_present(description: "Old description")
    |> Steps.edit_project_description(description: "New description")
    |> Steps.assert_project_description_present(description: "New description")
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
