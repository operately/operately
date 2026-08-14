defmodule Operately.Features.ProjectTemplates.FeatureGateTest do
  use Operately.FeatureCase

  alias Operately.Support.Features.ProjectTemplatesSteps, as: Steps

  setup ctx, do: Steps.setup_without_feature(ctx)

  feature "gated companies never see library, editor, or save-as-template entry points", ctx do
    ctx
    |> Steps.assert_library_redirects_when_gated()
    |> Steps.visit_space_page()
    |> Steps.refute_space_templates_tool_visible()
    |> Steps.visit_project_page()
    |> Steps.refute_save_as_template_visible()
    |> Steps.refute_template_field_on_new_project()
  end
end
