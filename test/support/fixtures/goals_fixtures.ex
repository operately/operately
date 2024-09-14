defmodule Operately.GoalsFixtures do
  alias Operately.Access.Binding

  def goal_fixture(creator, attrs \\ %{}) do
    attrs = Enum.into(attrs, %{
      name: "some name",
      champion_id: creator.id,
      reviewer_id: creator.id,
      timeframe: current_quarter(),
      targets: [
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
      ],
      company_access_level: Binding.comment_access(),
      space_access_level: Binding.edit_access(),
      anonymous_access_level: Binding.view_access(),
    })

    {:ok, goal} = Operately.Goals.create_goal(creator, attrs)

    Operately.Goals.get_goal!(goal.id)
  end

  def current_quarter do
    today = Date.utc_today()
    year = today.year

    cond do
      today.month in 1..3 -> quarter(year, "01-01", "03-31")
      today.month in 4..6 -> quarter(year, "04-01", "06-30")
      today.month in 7..9 -> quarter(year, "07-01", "09-30")
      today.month in 10..12 -> quarter(year, "10-01", "12-31")
    end
  end

  defp quarter(year, start_date, end_date) do
    %{
      start_date: Date.from_iso8601!("#{year}-#{start_date}"),
      end_date: Date.from_iso8601!("#{year}-#{end_date}"),
      type: "quarter"
    }
  end

  def goal_update_fixture(author, goal, attrs \\ []) do
    attrs = Enum.into(attrs, %{
      goal_id: goal.id,
      target_values: [],
      content: Operately.Support.RichText.rich_text("content"),
      send_to_everyone: false,
      subscription_parent_type: :goal_update,
      subscriber_ids: []
    })

    {:ok, update} = Operately.Operations.GoalCheckIn.run(author, goal, attrs)
    update
  end
end
