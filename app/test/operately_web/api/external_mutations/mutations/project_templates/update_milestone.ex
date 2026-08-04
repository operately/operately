defmodule OperatelyWeb.Api.ExternalMutations.Mutations.ProjectTemplates.UpdateMilestone do
  use Operately.Support.ExternalApi.MutationSpec
  use OperatelyWeb.TurboCase

  @impl true
  def mutation_name, do: "project_templates/update_milestone"

  @impl true
  def setup(ctx),
    do:
      ctx
      |> Factory.setup()
      |> Factory.enable_feature("project_templates")
      |> Factory.add_space(:space)
      |> Factory.add_project_template(:template, :space)
      |> Factory.add_project_template_milestone(:milestone, :template)

  @impl true
  def inputs(ctx), do: %{template_id: Paths.project_template_id(ctx.template), milestone_id: Paths.project_template_milestone_id(ctx.milestone), title: "Updated"}

  @impl true
  def assert(response, _ctx), do: assert(response.milestone.title == "Updated")
end
