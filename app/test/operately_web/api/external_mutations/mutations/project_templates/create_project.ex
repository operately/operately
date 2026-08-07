defmodule OperatelyWeb.Api.ExternalMutations.Mutations.ProjectTemplates.CreateProject do
  use Operately.Support.ExternalApi.MutationSpec
  use OperatelyWeb.TurboCase

  alias Operately.Access.Binding

  @impl true
  def mutation_name, do: "project_templates/create_project"

  @impl true
  def setup(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.enable_feature("project_templates")
    |> Factory.add_space(:space)
    |> Factory.add_project_template(:template, :space)
  end

  @impl true
  def inputs(ctx) do
    %{
      space_id: Paths.space_id(ctx.space),
      template_id: Paths.project_template_id(ctx.template),
      start_date: "2028-01-10",
      name: "Generated project",
      anonymous_access_level: Binding.no_access(),
      company_access_level: Binding.view_access(),
      space_access_level: Binding.edit_access()
    }
  end

  @impl true
  def assert(response, _ctx), do: assert(response.project.id)
end
