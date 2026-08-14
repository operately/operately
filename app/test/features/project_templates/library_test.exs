defmodule Operately.Features.ProjectTemplates.LibraryTest do
  use Operately.FeatureCase

  alias Operately.Support.Features.ProjectTemplatesSteps, as: Steps

  setup ctx, do: Steps.setup(ctx)

  feature "empty company library can create a blank template", ctx do
    ctx
    |> Steps.visit_company_library()
    |> Steps.assert_empty_library()
    |> Steps.create_blank_template("Blank kit")
  end

  feature "company library search and Space filtering", ctx do
    ctx
    |> Steps.given_templates_exist()
    |> Steps.visit_company_library()
    |> Steps.assert_template_listed("Launch kit")
    |> Steps.assert_template_listed("Growth playbook")
    |> Steps.search_templates("Launch")
    |> Steps.assert_template_listed("Launch kit")
    |> Steps.refute_template_listed("Onboarding kit")
    |> Steps.clear_template_search()
    |> Steps.filter_library_by_space("Growth Space")
    |> Steps.assert_template_listed("Growth playbook")
    |> Steps.refute_template_listed("Launch kit")
  end

  feature "opening a template from the company library opens the editor", ctx do
    ctx
    |> Steps.given_templates_exist()
    |> Steps.visit_company_library()
    |> Steps.open_template_from_library("Launch kit")
  end

  feature "Space library shows templates and hides create for View Access", ctx do
    ctx
    |> Steps.given_templates_exist()
    |> Steps.visit_space_library()
    |> Steps.assert_template_listed("Launch kit")
    |> Steps.refute_template_listed("Growth playbook")
    |> Steps.assert_new_template_visible()
    |> Steps.login_as_viewer()
    |> Steps.visit_space_library()
    |> Steps.assert_template_listed("Launch kit")
    |> Steps.refute_new_template_visible()
  end

  feature "disabling the Space templates tool hides the Space library entry point", ctx do
    ctx
    |> Steps.disable_space_templates_tool()
    |> Steps.visit_space_page()
    |> Steps.refute_space_templates_tool_visible()
  end
end
