defmodule Operately.Features.ProjectTemplates.CreateProjectTest do
  use Operately.FeatureCase

  alias Operately.Support.Features.ProjectTemplatesSteps, as: Steps

  setup ctx, do: Steps.setup(ctx)

  feature "create a project from a library card and land on the generated project", ctx do
    ctx
    |> Steps.given_rich_template_exists()
    |> Steps.visit_company_library()
    |> Steps.create_project_from_library_card(template: :template, name: "Generated launch")
  end

  feature "New Project scopes templates by Space, requires a start date, and hides archived templates", ctx do
    ctx
    |> Steps.given_templates_exist()
    |> Steps.given_archived_template_exists()
    |> Steps.start_new_project_from_menu()
    |> Steps.select_new_project_space("Product Space")
    |> Steps.select_new_project_template("Launch kit")
    |> Steps.refute_new_project_template_option("Archived kit")
    |> Steps.refute_new_project_template_option("Growth playbook")
    |> Steps.select_new_project_space("Growth Space")
    |> Steps.select_new_project_template("Growth playbook")
    |> Steps.submit_new_project_without_start_date()
  end
end
