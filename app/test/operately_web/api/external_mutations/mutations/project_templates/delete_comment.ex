defmodule OperatelyWeb.Api.ExternalMutations.Mutations.ProjectTemplates.DeleteComment do
  use Operately.Support.ExternalApi.MutationSpec
  use OperatelyWeb.TurboCase

  @impl true
  def mutation_name, do: "project_templates/delete_comment"

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
  def inputs(ctx), do: %{template_id: Paths.project_template_id(ctx.template), comment_id: Paths.project_template_comment_id(ctx.comment)}

  @impl true
  def assert(response, _ctx), do: assert(response.success)
end
