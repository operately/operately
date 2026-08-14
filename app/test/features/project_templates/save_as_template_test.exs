defmodule Operately.Features.ProjectTemplates.SaveAsTemplateTest do
  use Operately.FeatureCase

  alias Operately.Support.Features.ProjectTemplatesSteps, as: Steps

  setup ctx, do: Steps.setup(ctx)

  feature "Save as template is gated to Space editors and can be cancelled", ctx do
    ctx
    |> Steps.given_source_project_exists()
    |> Steps.login_as_editor()
    |> Steps.visit_project_page()
    |> Steps.assert_save_as_template_visible()
    |> Steps.open_save_as_template_modal()
    |> Steps.assert_include_option_defaults()
    |> Steps.cancel_save_as_template()
  end

  feature "Save as template validates the schedule, retries, and opens the new template", ctx do
    ctx
    |> Steps.given_source_project_exists()
    |> Steps.given_source_project_has_invalid_schedule()
    |> Steps.visit_project_page()
    |> Steps.open_save_as_template_modal()
    |> Steps.submit_save_as_template(name: "Reusable launch")
    |> Steps.assert_schedule_validation_error()
    |> Steps.fix_source_project_schedule()
    |> Steps.submit_save_as_template()
    |> Steps.assert_saved_template_opened("Reusable launch")
  end
end
