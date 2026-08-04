defmodule OperatelyWeb.Api.ExternalQueries.Queries.ProjectTemplates.Get do
  use Operately.Support.ExternalApi.QuerySpec

  alias Operately.Support.Factory
  alias OperatelyWeb.Paths

  def query_name, do: "project_templates/get"

  @impl true
  def setup(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.enable_feature("project_templates")
    |> Factory.add_space(:space)
    |> Factory.add_project_template(:template, :space)
  end

  @impl true
  def inputs(ctx), do: %{id: Paths.project_template_id(ctx.template)}

  @impl true
  def assert(response, ctx) do
    assert response.template.id == Paths.project_template_id(ctx.template)
  end
end
