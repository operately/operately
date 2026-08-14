defmodule OperatelyWeb.Api.ExternalMutations.Mutations.ProjectTemplates.CreateFromProject do
  use Operately.Support.ExternalApi.MutationSpec
  use OperatelyWeb.TurboCase

  alias Operately.ContextualDates.ContextualDate

  @impl true
  def mutation_name, do: "project_templates/create_from_project"

  @impl true
  def setup(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.enable_feature("project_templates")
    |> Factory.add_space(:space)
    |> Factory.add_project(:project, :space,
      timeframe: %{
        contextual_start_date: ContextualDate.create_day_date(~D[2028-01-10]),
        contextual_end_date: ContextualDate.create_day_date(~D[2028-01-20])
      }
    )
  end

  @impl true
  def inputs(ctx) do
    %{
      project_id: Paths.project_id(ctx.project),
      name: "Reusable project",
      include_people_and_assignments: true,
      include_comments: false
    }
  end

  @impl true
  def assert(response, _ctx) do
    assert response.template.id
    assert response.template.name == "Reusable project"
    assert response.schedule_issues == []
  end
end
