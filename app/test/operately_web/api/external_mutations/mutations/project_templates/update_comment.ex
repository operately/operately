defmodule OperatelyWeb.Api.ExternalMutations.Mutations.ProjectTemplates.UpdateComment do
  use Operately.Support.ExternalApi.MutationSpec
  use OperatelyWeb.TurboCase

  @impl true
  def mutation_name, do: "project_templates/update_comment"

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
      comment_id: Paths.project_template_comment_id(ctx.comment),
      content: Jason.encode!(%{"type" => "doc", "content" => [%{"type" => "paragraph"}]})
    }

  @impl true
  def assert(response, _ctx), do: assert(Jason.decode!(response.comment.content) == %{"type" => "doc", "content" => [%{"type" => "paragraph"}]})
end
