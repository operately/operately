defmodule OperatelyWeb.Api.ExternalQueries.Queries.ProjectTemplates.List do
  use Operately.Support.ExternalApi.QuerySpec

  alias Operately.Support.Factory
  alias OperatelyWeb.Paths

  def query_name, do: "project_templates/list"

  @impl true
  def setup(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.enable_feature("project_templates")
    |> Factory.add_space(:space)
    |> Factory.add_project_template(:template, :space)
  end

  @impl true
  def inputs(ctx), do: %{space_id: Paths.space_id(ctx.space)}

  @impl true
  def assert(response, ctx) do
    assert Enum.any?(response.templates, &(&1.id == Paths.project_template_id(ctx.template)))
  end
end
