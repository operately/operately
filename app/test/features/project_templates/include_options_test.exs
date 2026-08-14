defmodule Operately.Features.ProjectTemplates.IncludeOptionsTest do
  use Operately.FeatureCase

  alias Operately.Support.Features.ProjectTemplatesSteps, as: Steps

  setup ctx, do: Steps.setup(ctx)

  feature "include-option matrix copies selected content and stays independent of later source edits", ctx do
    ctx
    |> Steps.given_source_project_exists()
    |> Steps.visit_project_page()
    |> Steps.open_save_as_template_modal()
    |> Steps.submit_save_as_template(
      name: "Full copy",
      includes: [
        {"People and assignments", true},
        {"Discussions", true},
        {"Comments", true},
        {"Docs & Files", true}
      ]
    )
    |> Steps.assert_saved_template_opened("Full copy")
    |> Steps.assert_template_includes(discussions: true, comments: true, docs: true)
    |> Steps.change_source_project_discussion()
    |> Steps.visit_template_page()
    |> Steps.assert_template_discussion_unchanged()
  end
end
