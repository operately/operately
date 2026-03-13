defmodule OperatelyWeb.Api.ExternalMutations.Mutations.Projects.Resume do
  use Operately.Support.ExternalApi.MutationSpec
  use OperatelyWeb.TurboCase

  @impl true
  def mutation_name, do: "projects/resume"

  @impl true
  def setup(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_project(:project, :space)
    |> Factory.add_company_member(:member)
    |> Factory.pause_project(:project)
  end

  @impl true
  def inputs(ctx) do
    %{
      project_id: Paths.project_id(ctx.project),
      message: rich_text_string("Updated content"),
      send_notifications_to_everyone: false,
      subscriber_ids: [Paths.person_id(ctx.member)]
    }
  end

  @impl true
  def assert(response, _ctx) do
    assert response.project.id
    refute Map.has_key?(response, :error)
  end

  defp rich_text_string(text), do: Operately.Support.RichText.rich_text(text, :as_string)
end
