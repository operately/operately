defmodule OperatelyWeb.Api.ExternalMutations.Mutations.EditProjectCheckIn do
  use Operately.Support.ExternalApi.MutationSpec
  use OperatelyWeb.TurboCase

  @impl true
  def mutation_name, do: "edit_project_check_in"

  @impl true
  def setup(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_project(:project, :space)
    |> Factory.add_project_check_in(:project_check_in, :project, :creator)
  end

  @impl true
  def inputs(ctx) do
    %{
      check_in_id: Paths.project_check_in_id(ctx.project_check_in),
      status: "on_track",
      description: rich_text_string("Updated content")
    }
  end

  @impl true
  def assert(response, _ctx) do
    assert response.check_in.id
    refute Map.has_key?(response, :error)
  end

  defp rich_text_string(text), do: Operately.Support.RichText.rich_text(text, :as_string)
end
