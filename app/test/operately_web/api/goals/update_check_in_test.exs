defmodule OperatelyWeb.Api.Goals.UpdateCheckInTest do
  use OperatelyWeb.TurboCase

  import Operately.GroupsFixtures
  import Operately.PeopleFixtures
  import Operately.GoalsFixtures

  alias Operately.{Goals, Notifications}
  alias Operately.Access.Binding
  alias Operately.Support.RichText
  alias Operately.Notifications.SubscriptionList

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, [:goals, :update_check_in], %{})
    end
  end

  describe "permissions" do
    setup ctx do
      ctx = register_and_log_in_account(ctx)
      creator = person_fixture(%{company_id: ctx.company.id})
      space = group_fixture(creator, %{company_id: ctx.company.id})

      Map.merge(ctx, %{creator: creator, space_id: space.id})
    end

    test "company members without view access can't see goal update", ctx do
      update = create_goal_update(ctx, company_access_level: Binding.no_access())

      assert {404, res} = request(ctx.conn, update)
      assert res.message == "The requested resource was not found"
    end

    test "space members without view access can't see goal update", ctx do
      add_person_to_space(ctx)
      update = create_goal_update(ctx, space_access_level: Binding.no_access())

      assert {404, res} = request(ctx.conn, update)
      assert res.message == "The requested resource was not found"
    end

    test "member without edit access can't edit goal update", ctx do
      update =
        create_goal_update(ctx,
          company_access_level: Binding.comment_access(),
          space_access_level: Binding.no_access()
        )

      assert {403, res} = request(ctx.conn, update)
      assert res.message == "You don't have permission to perform this action"
    end

    test "author/champion can edit goal update", ctx do
      champion = person_fixture_with_account(%{company_id: ctx.company.id})
      ctx = %{ctx | creator: champion}
      update = create_goal_update(ctx, company_access_level: Binding.view_access())

      # another user's request
      assert {403, _} = request(ctx.conn, update)

      # champion's request
      account = Repo.preload(champion, :account).account
      conn = log_in_account(ctx.conn, account)

      assert {200, _} = request(conn, update)
      assert_update_edited(update)
    end
  end

  describe "edit_goal_progress_update functionality" do
    setup :register_and_log_in_account

    test "archives goal", ctx do
      update = create_goal_update(ctx)

      assert {200, res} = request(ctx.conn, update)

      assert res.update.id == Paths.goal_update_id(update)
      assert_update_edited(update)
    end

    test "publishes a draft goal progress update", ctx do
      update = create_goal_update(ctx)

      {:ok, draft} =
        Ecto.Changeset.change(update, %{
          state: :draft,
          published_at: nil
        })
        |> Repo.update()

      assert {200, res} =
               mutation(ctx.conn, [:goals, :update_check_in], %{
                 id: Paths.goal_update_id(draft),
                 status: "off_track",
                 content: RichText.rich_text("Ready to publish", :as_string),
                 new_target_values: Jason.encode!([]),
                 due_date: nil,
                 checklist: [],
                 state: "published"
               })

      update = Repo.reload(draft)
      goal = Repo.get!(Operately.Goals.Goal, update.goal_id)

      assert res.update.state == "published"
      assert update.state == :published
      assert update.published_at
      assert goal.last_check_in_id == update.id
      assert goal.last_update_status == update.status
    end

    test "rejects rescheduling a goal check-in for now or earlier", ctx do
      update = create_goal_update(ctx)

      {:ok, draft} =
        Ecto.Changeset.change(update, %{state: :draft, published_at: nil})
        |> Repo.update()

      for scheduled_at <- [DateTime.utc_now(), DateTime.add(DateTime.utc_now(), -1, :second)] do
        assert {400, res} =
                 mutation(ctx.conn, [:goals, :update_check_in], %{
                   id: Paths.goal_update_id(draft),
                   status: "on_track",
                   content: RichText.rich_text("Invalid schedule", :as_string),
                   new_target_values: Jason.encode!([]),
                   due_date: nil,
                   checklist: [],
                   scheduled_at: DateTime.to_iso8601(scheduled_at)
                 })

        assert res.message == "Scheduled time must be in the future"
      end
    end

    test "mentioned people are added to subscriptions list", ctx do
      update = create_goal_update(ctx)

      assert {200, _} =
               mutation(ctx.conn, [:goals, :update_check_in], %{
                 id: Paths.goal_update_id(update),
                 status: "off_track",
                 content: RichText.rich_text("content", :as_string),
                 new_target_values: Jason.encode!([]),
                 due_date: nil,
                 checklist: []
               })

      {:ok, list} =
        SubscriptionList.get(:system,
          parent_id: update.id,
          opts: [
            preload: :subscriptions
          ]
        )

      subscriptions = Enum.filter(list.subscriptions, &(&1.person_id != ctx.person.id))
      assert subscriptions == []

      assert {200, _} =
               mutation(ctx.conn, [:goals, :update_check_in], %{
                 id: Paths.goal_update_id(update),
                 status: "off_track",
                 content: RichText.rich_text(mentioned_people: [ctx.company_creator]),
                 new_target_values: Jason.encode!([]),
                 due_date: nil,
                 checklist: []
               })

      subscriptions =
        Notifications.list_subscriptions(list)
        |> Enum.filter(&(&1.person_id != ctx.person.id))

      assert length(subscriptions) == 1
      assert hd(subscriptions).person_id == ctx.company_creator.id
    end
  end

  describe "full edit window after publish" do
    setup :register_and_log_in_account

    test "allows status and target edits within 3 days of published_at for a late-published check-in", ctx do
      update =
        create_goal_update(ctx)
        |> set_update_dates(
          inserted_at: days_ago_naive(10),
          published_at: Operately.Time.utc_datetime_now()
        )

      assert {200, _} = request_update(ctx.conn, update, status: "off_track")

      update = Repo.reload(update)
      assert update.status == :off_track

      Enum.each(update.targets, fn target ->
        assert target.value == 75
      end)
    end

    test "limits edits to message only outside the 3-day window from published_at", ctx do
      update =
        create_goal_update(ctx)
        |> set_update_dates(
          inserted_at: days_ago_naive(1),
          published_at: Operately.Time.days_ago(4)
        )

      assert {200, _} = request_update(ctx.conn, update, status: "off_track")

      update = Repo.reload(update)
      assert update.status == :on_track
      assert update.message == RichText.rich_text("Edited content")

      Enum.each(update.targets, fn target ->
        assert target.value == 50
      end)
    end
  end

  #
  # Helpers
  #

  defp request(conn, update) do
    request_update(conn, update, status: "on_track")
  end

  defp request_update(conn, update, opts) do
    status = Keyword.get(opts, :status, "on_track")

    targets =
      Enum.map(Goals.list_targets(update.goal_id), fn t ->
        %{"id" => t.id, "value" => 75}
      end)
      |> Jason.encode!()

    mutation(conn, [:goals, :update_check_in], %{
      id: Paths.goal_update_id(update),
      status: status,
      content: RichText.rich_text("Edited content", :as_string),
      new_target_values: targets,
      due_date: nil,
      checklist: []
    })
  end

  defp create_goal_update(ctx, attrs \\ []) do
    goal =
      goal_fixture(
        ctx[:creator] || ctx.person,
        Enum.into(attrs, %{
          space_id: ctx[:space_id] || ctx.company.company_space_id,
          targets: [
            %{name: "One", from: 10, to: 100, unit: "unit", index: 0},
            %{name: "Two", from: 10, to: 100, unit: "unit", index: 1}
          ],
          company_access_level: Binding.no_access(),
          space_access_level: Binding.no_access()
        })
      )

    target_values =
      Enum.map(Goals.list_targets(goal.id), fn t ->
        %{"id" => t.id, "value" => 50}
      end)

    content = RichText.rich_text("Content")

    goal_update_fixture(ctx[:creator] || ctx.person, goal, target_values: target_values, content: content)
  end

  defp add_person_to_space(ctx) do
    Operately.Groups.add_members(ctx.person, ctx.space_id, [
      %{
        id: ctx.person.id,
        access_level: Binding.edit_access()
      }
    ])
  end

  defp assert_update_edited(update) do
    assert update.message == RichText.rich_text("Content")

    Enum.each(update.targets, fn t ->
      assert t.value == 50
    end)

    update = Repo.reload(update)

    assert update.message == RichText.rich_text("Edited content")

    Enum.each(update.targets, fn t ->
      assert t.value == 75
    end)
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
