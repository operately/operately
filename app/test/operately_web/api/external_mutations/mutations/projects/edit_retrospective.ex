defmodule OperatelyWeb.Api.ExternalMutations.Mutations.Projects.EditRetrospective do
  use Operately.Support.ExternalApi.MutationSpec
  use OperatelyWeb.TurboCase

  @impl true
  def mutation_name, do: "projects/edit_retrospective"

  @impl true
  def setup(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_project(:project, :space)
    |> Factory.add_project_retrospective(:project_retrospective, :project, :creator)

  end

  @impl true
  def inputs(ctx) do
    %{
      id: Paths.project_retrospective_id(ctx.project_retrospective),
      content: rich_text_string("Updated content"),
      success_status: "achieved"
    }
  end

  @impl true
  def assert(response, _ctx) do
    assert response.retrospective.id
    refute Map.has_key?(response, :error)
  end

  defp rich_text_string(text), do: Operately.Support.RichText.rich_text(text, :as_string)
end
