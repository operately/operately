defmodule OperatelyWeb.Api.ExternalMutations.Mutations.ProjectTemplates.UpdateTaskAssignees do
  use Operately.Support.ExternalApi.MutationSpec
  use OperatelyWeb.TurboCase

  @impl true
  def mutation_name, do: "project_templates/update_task_assignees"

  @impl true
  def setup(ctx),
    do:
      ctx
      |> Factory.setup()
      |> Factory.enable_feature("project_templates")
      |> Factory.add_space(:space)
      |> Factory.add_project_template(:template, :space)
      |> Factory.add_project_template_task(:task, :template)
      |> Factory.add_company_member(:member)

  @impl true
  def inputs(ctx), do: %{template_id: Paths.project_template_id(ctx.template), task_id: Paths.project_template_task_id(ctx.task), assignee_ids: [Paths.person_id(ctx.member)]}

  @impl true
  def assert(response, _ctx), do: assert(length(response.assignments) == 1)
end
