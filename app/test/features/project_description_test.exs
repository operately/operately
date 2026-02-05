defmodule Operately.Features.ProjectsDescriptionTest do
  use Operately.FeatureCase

  alias Operately.Support.Features.ProjectSteps, as: Steps

  setup ctx do
    ctx
    |> Steps.create_project(name: "Test Project")
    |> Steps.setup_contributors()
    |> Steps.login()
  end

  @tag login_as: :contributor
  feature "writing a project description", ctx do
    ctx
    |> Steps.assert_logged_in_contributor_has_edit_access()
    |> Steps.visit_project_page()
    |> Steps.assert_project_description_absent()
    |> Steps.submit_project_description(description: project_description())
    |> Steps.expand_project_description()
    |> Steps.assert_project_description_present(description: "TEXT END MARKER")
  end

  @tag login_as: :contributor
  feature "editing a project description", ctx do
    ctx
    |> Steps.assert_logged_in_contributor_has_edit_access()
    |> Steps.given_project_has_description(description: "Old description")
    |> Steps.visit_project_page()
    |> Steps.assert_project_description_present(description: "Old description")
    |> Steps.edit_project_description(description: "New description")
    |> Steps.assert_project_description_present(description: "New description")
    |> Steps.assert_project_description_feed_item(description: "New description")
  end

  @tag login_as: :contributor
  feature "mentioning a person in a project description sends notification and email", ctx do
    ctx = Steps.given_space_member_exists(ctx)

    ctx
    |> Steps.assert_logged_in_contributor_has_edit_access()
    |> Steps.visit_project_page()
    |> Steps.assert_project_description_absent()
    |> Steps.submit_project_description_mentioning(ctx.space_member)

    ctx
    |> Steps.assert_space_member_project_description_notification_sent()
    |> Steps.assert_space_member_project_description_email_sent()
    |> Steps.assert_author_not_notified_about_project_description()
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
