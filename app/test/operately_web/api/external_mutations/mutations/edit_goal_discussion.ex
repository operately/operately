defmodule OperatelyWeb.Api.ExternalMutations.Mutations.EditGoalDiscussion do
  use Operately.Support.ExternalApi.MutationSpec
  use OperatelyWeb.TurboCase

  import Operately.GoalsFixtures

  alias Operately.Access.Binding
  alias Operately.Support.RichText

  @impl true
  def mutation_name, do: "edit_goal_discussion"

  @impl true
  def setup(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.add_company_member(:person)
  end

  @impl true
  def inputs(ctx) do
    goal = create_goal(ctx)
    discussion = create_discussion(ctx, goal)

    %{
      activity_id: Paths.activity_id(discussion),
      title: "Updated Title",
      message: RichText.rich_text("Updated content", :as_string)
    }
  end

  @impl true
  def assert(response, _ctx) do
    assert is_map(response)
    refute Map.has_key?(response, :error)
  end

  defp create_goal(ctx) do
    goal_fixture(ctx.person, %{
      space_id: ctx.company.company_space_id,
      company_access_level: Binding.no_access(),
      space_access_level: Binding.no_access(),
    })
  end

  defp create_discussion(ctx, goal) do
    {:ok, discussion} = Operately.Operations.GoalDiscussionCreation.run(ctx[:creator] || ctx.person, goal, %{
      title: "Title",
      content: RichText.rich_text("Content"),
      subscription_parent_type: :comment_thread,
      send_notifications_to_everyone: false,
      subscriber_ids: []
    })
    discussion
  end
end
