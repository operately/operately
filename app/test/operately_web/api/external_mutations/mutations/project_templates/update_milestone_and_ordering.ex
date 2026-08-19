defmodule OperatelyWeb.Api.ExternalMutations.Mutations.ProjectTemplates.UpdateMilestoneAndOrdering do
  use Operately.Support.ExternalApi.MutationSpec
  use OperatelyWeb.TurboCase

  @impl true
  def mutation_name, do: "project_templates/update_milestone_and_ordering"

  @impl true
  def setup(ctx),
    do:
      ctx
      |> Factory.setup()
      |> Factory.enable_feature("project_templates")
      |> Factory.add_space(:space)
      |> Factory.add_project_template(:template, :space)
      |> Factory.add_project_template_milestone(:milestone, :template)
      |> Factory.add_project_template_task(:task, :template, milestone: :milestone)

  @impl true
  def inputs(ctx),
    do: %{
      template_id: Paths.project_template_id(ctx.template),
      task_id: Paths.project_template_task_id(ctx.task),
      milestone_id: Paths.project_template_milestone_id(ctx.milestone),
      index: 0
    }

  @impl true
  def assert(response, _ctx), do: assert(response.task.id)
end
