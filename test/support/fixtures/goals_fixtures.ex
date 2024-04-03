defmodule Operately.GoalsFixtures do
  def goal_fixture(creator, attrs \\ %{}) do
    timeframe = Date.utc_today() |> Calendar.strftime("%Y")

    attrs = Enum.into(attrs, %{
      name: "some name",
      champion_id: creator.id,
      reviewer_id: creator.id,
      timeframe: timeframe,
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
      ]
    })

    {:ok, goal} = Operately.Goals.create_goal(creator, attrs)

    goal
  end
end
