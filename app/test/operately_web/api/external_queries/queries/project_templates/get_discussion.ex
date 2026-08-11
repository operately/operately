defmodule OperatelyWeb.Api.ExternalQueries.Queries.ProjectTemplates.GetDiscussion do
  use Operately.Support.ExternalApi.QuerySpec
  use OperatelyWeb.TurboCase

  @impl true
  def query_name, do: "project_templates/get_discussion"

  @impl true
  def setup(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.enable_feature("project_templates")
    |> Factory.add_space(:space)
    |> Factory.add_project_template(:template, :space)
    |> Factory.add_project_template_discussion(:discussion, :template)
  end

  @impl true
  def inputs(ctx), do: %{template_id: Paths.project_template_id(ctx.template), discussion_id: Paths.project_template_discussion_id(ctx.discussion)}

  @impl true
  def assert(response, ctx), do: assert(response.discussion.id == Paths.project_template_discussion_id(ctx.discussion))
end
