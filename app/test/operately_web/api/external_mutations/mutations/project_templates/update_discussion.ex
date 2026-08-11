defmodule OperatelyWeb.Api.ExternalMutations.Mutations.ProjectTemplates.UpdateDiscussion do
  use Operately.Support.ExternalApi.MutationSpec
  use OperatelyWeb.TurboCase

  @impl true
  def mutation_name, do: "project_templates/update_discussion"

  @impl true
  def setup(ctx),
    do:
      ctx
      |> Factory.setup()
      |> Factory.enable_feature("project_templates")
      |> Factory.add_space(:space)
      |> Factory.add_project_template(:template, :space)
      |> Factory.add_project_template_discussion(:discussion, :template)

  @impl true
  def inputs(ctx),
    do: %{
      template_id: Paths.project_template_id(ctx.template),
      discussion_id: Paths.project_template_discussion_id(ctx.discussion),
      title: "Updated reusable discussion",
      body: Jason.encode!(%{"type" => "doc", "content" => []})
    }

  @impl true
  def assert(response, _ctx), do: assert(response.discussion.title == "Updated reusable discussion")
end
