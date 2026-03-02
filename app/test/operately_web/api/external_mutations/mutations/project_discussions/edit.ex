defmodule OperatelyWeb.Api.ExternalMutations.Mutations.ProjectDiscussions.Edit do
  use Operately.Support.ExternalApi.MutationSpec
  use OperatelyWeb.TurboCase

  @impl true
  def mutation_name, do: "project_discussions/edit"

  @impl true
  def setup(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_project(:project, :space)
    |> Factory.add_project_discussion(:project_discussion, :project)
  end

  @impl true
  def inputs(ctx) do
    %{
      id: Paths.comment_thread_id(ctx.project_discussion),
      title: "Updated Title",
      message: rich_text_string("Updated content")
    }
  end

  @impl true
  def assert(response, _ctx) do
    assert response.discussion.id
    refute Map.has_key?(response, :error)
  end

  defp rich_text_string(text), do: Operately.Support.RichText.rich_text(text, :as_string)
end
