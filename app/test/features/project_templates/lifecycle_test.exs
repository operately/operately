defmodule Operately.Features.ProjectTemplates.LifecycleTest do
  use Operately.FeatureCase

  alias Operately.Support.Features.ProjectTemplatesSteps, as: Steps

  setup ctx, do: Steps.setup(ctx)

  feature "duplicate, archive, restore, and delete from the company library", ctx do
    ctx
    |> Steps.given_templates_exist()
    |> Steps.visit_company_library()
    |> Steps.duplicate_template_from_library(template: :launch, name: "Launch kit copy")
    |> Steps.archive_template_from_editor()
    |> Steps.visit_company_library()
    |> Steps.filter_templates_by_status("Archived")
    |> Steps.assert_template_listed("Launch kit copy")
    |> Steps.restore_template_from_library(:template)
    |> Steps.filter_templates_by_status("Active")
    |> Steps.assert_template_listed("Launch kit copy")
    |> Steps.delete_template_from_library(:template)
    |> Steps.refute_template_listed("Launch kit copy")
    |> Steps.assert_template_deleted(:template)
  end

  feature "duplicate, archive, restore, and delete from a Space library", ctx do
    ctx
    |> Steps.given_templates_exist()
    |> Steps.visit_space_library()
    |> Steps.duplicate_template_from_library(template: :launch, name: "Space launch copy")
    |> Steps.visit_space_library()
    |> Steps.archive_template_from_library(:template)
    |> Steps.filter_templates_by_status("Archived")
    |> Steps.assert_template_listed("Space launch copy")
    |> Steps.restore_template_from_library(:template)
    |> Steps.filter_templates_by_status("Active")
    |> Steps.delete_template_from_library(:template)
    |> Steps.refute_template_listed("Space launch copy")
    |> Steps.assert_template_deleted(:template)
  end

  feature "view-only members cannot manage templates from the library or editor", ctx do
    ctx
    |> Steps.given_templates_exist()
    |> Steps.login_as_viewer()
    |> Steps.visit_space_library()
    |> Steps.assert_template_actions_hidden(:launch)
    |> Steps.open_template_from_library("Launch kit")
    |> Steps.assert_template_editor_actions_hidden()
  end

  feature "deleting a template leaves its generated projects unchanged", ctx do
    ctx
    |> Steps.given_templates_exist()
    |> Steps.visit_company_library()
    |> Steps.create_project_from_library_card(template: :launch, name: "Generated launch")
    |> Steps.submit_new_project_from_template(name: "Generated launch")
    |> Steps.remember_generated_project("Generated launch")
    |> Steps.visit_company_library()
    |> Steps.delete_template_from_library(:launch)
    |> Steps.assert_generated_project_unchanged_after_template_deletion()
  end
end
