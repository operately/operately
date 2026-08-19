defmodule Operately.Features.ProjectTemplates.EditorTest do
  use Operately.FeatureCase

  alias Operately.Support.Features.ProjectTemplatesSteps, as: Steps

  setup ctx, do: Steps.setup(ctx)

  feature "create a blank template and edit overview, discussions, comments, and Docs & Files", ctx do
    ctx
    |> Steps.visit_company_library()
    |> Steps.create_blank_template("Blank kit")
    |> Steps.rename_template("Reusable kit")
    |> Steps.edit_template_description("Reusable description")
    |> Steps.set_template_duration(14)
    |> Steps.add_template_discussion("Launch notes")
    |> Steps.add_template_comment("Keep this comment")
    |> Steps.add_template_document("Launch plan")
  end

  feature "View and Comment Access keep the template editor read-only", ctx do
    ctx
    |> Steps.given_rich_template_exists()
    |> Steps.login_as_viewer()
    |> Steps.visit_template_page()
    |> Steps.refute_overview_editable()
    |> Steps.open_template_discussion()
    |> Steps.refute_comment_composer_visible()
    |> Steps.login_as_commenter()
    |> Steps.open_template_discussion()
    |> Steps.refute_comment_composer_visible()
  end

  feature "open a template milestone from overview and tasks, then edit it", ctx do
    ctx
    |> Steps.given_rich_template_exists()
    |> Steps.visit_template_page()
    |> Steps.open_template_milestone("Kickoff")
    |> Steps.assert_template_milestone_page()
    |> Steps.rename_template_milestone("Kickoff workshop")
    |> Steps.add_template_milestone_task("Prepare agenda")
    |> Steps.visit_template_tasks_tab()
    |> Steps.open_template_milestone("Kickoff workshop")
    |> Steps.assert_template_milestone_page()
  end
end
