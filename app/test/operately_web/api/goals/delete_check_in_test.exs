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

  describe "delete_goal_check_in previous check-in selection" do
    setup ctx do
      ctx
      |> Factory.setup()
      |> Factory.log_in_person(:creator)
      |> Factory.add_space(:space)
      |> Factory.add_goal(:goal, :space)
    end

    test "restores goal's last check-in using published_at, not inserted_at", ctx do
      update_b =
        Operately.GoalsFixtures.goal_update_fixture(ctx.creator, ctx.goal, status: "caution")
        |> set_update_dates(
          inserted_at: days_ago_naive(1),
          published_at: Operately.Time.days_ago(4)
        )

      update_c =
        Operately.GoalsFixtures.goal_update_fixture(ctx.creator, ctx.goal, status: "off_track")
        |> set_update_dates(
          inserted_at: days_ago_naive(5),
          published_at: Operately.Time.days_ago(3)
        )

      latest_update =
        Operately.GoalsFixtures.goal_update_fixture(ctx.creator, ctx.goal, status: "on_track")
        |> set_update_dates(
          inserted_at: days_ago_naive(10),
          published_at: Operately.Time.utc_datetime_now()
        )

      {:ok, _} =
        Operately.Goals.update_goal(ctx.goal, %{
          last_check_in_id: latest_update.id,
          last_update_status: latest_update.status
        })

      assert {200, %{success: true}} =
               mutation(ctx.conn, [:goals, :delete_check_in], %{id: Paths.goal_update_id(latest_update)})

      goal = Repo.reload(ctx.goal)
      assert goal.last_check_in_id == update_c.id
      assert goal.last_update_status == update_c.status
      refute goal.last_check_in_id == update_b.id
    end
  end

  defp set_update_dates(update, dates) do
    {:ok, update} =
      Ecto.Changeset.change(update, %{
        inserted_at: dates[:inserted_at],
        published_at: dates[:published_at]
      })
      |> Repo.update()

    update
  end

  defp days_ago_naive(days) do
    NaiveDateTime.utc_now() |> NaiveDateTime.add(-days, :day) |> NaiveDateTime.truncate(:second)
  end
end
