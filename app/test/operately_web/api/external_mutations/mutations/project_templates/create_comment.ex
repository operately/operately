defmodule OperatelyWeb.Api.ExternalMutations.Mutations.ProjectTemplates.CreateComment do
  use Operately.Support.ExternalApi.MutationSpec
  use OperatelyWeb.TurboCase

  @impl true
  def mutation_name, do: "project_templates/create_comment"

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
  def inputs(ctx),
    do: %{
      template_id: Paths.project_template_id(ctx.template),
      parent_type: "discussion",
      parent_id: Paths.project_template_discussion_id(ctx.discussion),
      content: Jason.encode!(%{"type" => "doc", "content" => []})
    }

  @impl true
  def assert(response, _ctx), do: assert(response.comment.position == 0)
end
