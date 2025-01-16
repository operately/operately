defmodule Operately.Support.Factory.Goals do
  alias Operately.Access.Binding

  def add_goal(ctx, testid, space_name, opts \\ []) do
    name = Keyword.get(opts, :name, "some name")
    company_access = Keyword.get(opts, :company_access, Binding.view_access())
    space_access = Keyword.get(opts, :space_access, Binding.comment_access())
    champion = Keyword.get(opts, :champion, :creator)
    reviewer = Keyword.get(opts, :reviewer, :creator)
    parent_goal = Keyword.get(opts, :parent_goal)

    goal = Operately.GoalsFixtures.goal_fixture(ctx.creator, %{
      name: name,
      parent_goal_id: parent_goal && ctx[parent_goal].id,
      space_id: ctx[space_name].id,
      champion_id: ctx[champion].id,
      reviewer_id: ctx[reviewer].id,
      company_access_level: company_access,
      space_access_level: space_access,
      timeframe: opts[:timeframe] || %{
        start_date: ~D[2020-01-01],
        end_date: ~D[2020-03-31],
        type: "quarter"
      }
    })

    Map.put(ctx, testid, goal)
  end

  def add_goal_update(ctx, testid, goal_name, person_name) do
    goal = Map.fetch!(ctx, goal_name)
    person = Map.fetch!(ctx, person_name)

    update = Operately.GoalsFixtures.goal_update_fixture(person, goal)

    Map.put(ctx, testid, update)
  end
end
