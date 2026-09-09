defmodule Operately.Support.Features.ActivityFeedSteps do
  use Operately.FeatureCase

  alias Operately.Activities.Activity
  alias Operately.Repo

  step :setup_feed, ctx do
    ctx = ctx |> Factory.setup() |> Factory.add_space(:space) |> Factory.add_goal(:goal, :space)
    first = Repo.get_by!(Activity, author_id: ctx.creator.id, action: "goal_created")

    older =
      for index <- 1..40 do
        timestamp = NaiveDateTime.add(first.inserted_at, -index)

        %{
          id: Ecto.UUID.generate(),
          author_id: first.author_id,
          action: first.action,
          content: first.content,
          access_context_id: first.access_context_id,
          inserted_at: timestamp,
          updated_at: timestamp
        }
      end

    {40, older} = Repo.insert_all(Activity, older, returning: true)
    older = Enum.sort_by(older, & &1.inserted_at, {:desc, NaiveDateTime})
    Map.put(ctx, :feed_activities, [first | older])
  end

  step :visit_feed, ctx do
    Wallaby.Browser.resize_window(ctx.session, 1280, 720)
    ctx |> UI.login_as(ctx.creator) |> UI.visit(Paths.goal_path(ctx.company, ctx.goal, tab: "activity"))
  end

  step :scroll_to_activity, ctx, index do
    id = ctx.feed_activities |> Enum.at(index) |> Paths.activity_id()
    selector = "[data-test-id='goal-feed'] [data-activity-id='#{id}']"
    ctx = UI.assert_has(ctx, css: selector)

    Map.update!(ctx, :session, fn session ->
      Wallaby.Browser.execute_script(session, "document.querySelector(#{Jason.encode!(selector)}).scrollIntoView({block: 'center'})")
    end)
  end

  step :assert_loaded_count, ctx, count do
    UI.assert_has(ctx, Wallaby.Query.css("[data-test-id='goal-feed'] [data-activity-id]", count: count))
  end

  step :assert_finished, ctx do
    ctx |> assert_loaded_count(41) |> UI.refute_has(testid: "feed-loading-more") |> UI.refute_has(testid: "feed-pagination-error")
  end
end
