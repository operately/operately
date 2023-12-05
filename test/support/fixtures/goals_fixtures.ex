defmodule Operately.GoalsFixtures do
  def goal_fixture(creator, attrs \\ %{}) do
    attrs = Enum.into(attrs, %{
      name: "some name",
      champion_id: creator.id,
      reviewer_id: creator.id,
      timeframe: "2023-Q1"
    })

    {:ok, goal} = Operately.Goals.create_goal(creator, attrs)

    goal
  end
end
