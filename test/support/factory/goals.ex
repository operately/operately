defmodule Operately.Support.Factory.Goals do
  alias Operately.Access.Binding

  def add_goal(ctx, testid, space_name, opts \\ []) do
    company_access = Keyword.get(opts, :company_access, Binding.view_access())
    space_access = Keyword.get(opts, :space_access, Binding.comment_access())
    champion = Keyword.get(opts, :champion, :creator)
    reviewer = Keyword.get(opts, :reviewer, :creator)

    goal = Operately.GoalsFixtures.goal_fixture(ctx.creator, %{
      space_id: ctx[space_name].id,
      champion_id: ctx[champion].id,
      reviewer_id: ctx[reviewer].id,
      company_access_level: company_access,
      space_access_level: space_access,
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
