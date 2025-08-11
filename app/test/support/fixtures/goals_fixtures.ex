defmodule Operately.GoalsFixtures do
  alias Operately.Goals
  alias Operately.Access.Binding
  alias Operately.ContextualDates.Timeframe

  @default_targets [
    %{
      name: "First response time",
      from: 30,
      to: 15,
      unit: "minutes",
      index: 0
    },
    %{
      name: "Increase feedback score to 90%",
      from: 80,
      to: 90,
      unit: "percent",
      index: 1
    }
  ]

  def goal_fixture(creator, attrs \\ %{}) do
    attrs =
      Enum.into(attrs, %{
        name: "some name",
        champion_id: attrs[:champion_id] || creator.id,
        reviewer_id: attrs[:reviewer_id] || creator.id,
        timeframe: Timeframe.current_quarter(:as_map),
        company_access_level: Binding.comment_access(),
        space_access_level: Binding.edit_access(),
        anonymous_access_level: Binding.view_access()
      })
      |> Map.merge(%{targets: attrs[:targets] || @default_targets})

    {:ok, goal} = Goals.create_goal(creator, attrs)

    Goals.get_goal!(goal.id)
  end

  def goal_update_fixture(author, goal, attrs \\ []) do
    attrs =
      Enum.into(attrs, %{
        goal_id: goal.id,
        status: "on_track",
        target_values: [],
        checklist: [],
        content: Operately.Support.RichText.rich_text("content"),
        send_to_everyone: false,
        subscription_parent_type: :goal_update,
        subscriber_ids: [],
        due_date: %{
          date: ~D[2024-12-31],
          date_type: :quarter,
          value: "Q4 2024"
        }
      })

    {:ok, update} = Operately.Operations.GoalCheckIn.run(author, goal, attrs)
    update
  end

  def goal_target_fixture(goal, attrs \\ []) do
    attrs =
      Enum.into(attrs, %{
        goal_id: goal.id,
        name: "Increase total active users",
        from: 110,
        to: 900,
        value: 110,
        unit: "users",
        index: 0
      })

    {:ok, target} = Goals.create_target(attrs)
    target
  end
end
