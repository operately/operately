defmodule OperatelyWeb.Api.ExternalQueries.Queries.ProjectTemplates.ListComments do
  use Operately.Support.ExternalApi.QuerySpec
  use OperatelyWeb.TurboCase

  @impl true
  def query_name, do: "project_templates/list_comments"

  @impl true
  def setup(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.enable_feature("project_templates")
    |> Factory.add_space(:space)
    |> Factory.add_project_template(:template, :space)
    |> Factory.add_project_template_discussion(:discussion, :template)
    |> Factory.add_project_template_comment(:comment, :template, :discussion)
  end

  @impl true
  def inputs(ctx),
    do: %{
      template_id: Paths.project_template_id(ctx.template),
      parent_type: "discussion",
      parent_id: Paths.project_template_discussion_id(ctx.discussion)
    }

  @impl true
  def assert(response, ctx), do: assert(hd(response.comments).id == Paths.project_template_comment_id(ctx.comment))
end
