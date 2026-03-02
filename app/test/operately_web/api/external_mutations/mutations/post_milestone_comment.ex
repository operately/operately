defmodule OperatelyWeb.Api.ExternalMutations.Mutations.PostMilestoneComment do
  use Operately.Support.ExternalApi.MutationSpec
  use OperatelyWeb.TurboCase

  @impl true
  def mutation_name, do: "post_milestone_comment"

  @impl true
  def setup(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_project(:project, :space)
    |> Factory.add_project_milestone(:milestone, :project)
  end

  @impl true
  def inputs(ctx) do
    %{
      milestone_id: Paths.milestone_id(ctx.milestone),
      content: rich_text_string("Updated content"),
      action: "none"
    }
  end

  @impl true
  def assert(response, _ctx) do
    assert response.comment.comment.id
    refute Map.has_key?(response, :error)
  end

  defp rich_text_string(text), do: Operately.Support.RichText.rich_text(text, :as_string)
end
