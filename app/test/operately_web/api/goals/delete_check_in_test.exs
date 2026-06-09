defmodule OperatelyWeb.Api.Goals.DeleteCheckInTest do
  use OperatelyWeb.TurboCase

  alias Operately.Goals.Update

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, [:goals, :delete_check_in], %{})
    end
  end

  describe "delete_goal_check_in functionality" do
    setup ctx do
      ctx
      |> Factory.setup()
      |> Factory.log_in_person(:creator)
      |> Factory.add_space(:space)
      |> Factory.add_goal(:goal, :space)
    end

    test "deletes the author's draft check-in", ctx do
      {:ok, draft} =
        Operately.Operations.GoalCheckIn.run(ctx.creator, ctx.goal, %{
          status: "on_track",
          content: Operately.Support.RichText.rich_text("Draft"),
          target_values: [],
          checklist: [],
          due_date: nil,
          post_as_draft: true,
          send_to_everyone: false,
          subscription_parent_type: :goal_update,
          subscriber_ids: []
        })

      assert {200, res} = mutation(ctx.conn, [:goals, :delete_check_in], %{id: Paths.goal_update_id(draft)})

      assert res == %{success: true}
      refute Repo.get(Update, draft.id)
    end
  end
end
