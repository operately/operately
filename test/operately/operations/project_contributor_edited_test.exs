defmodule Operately.Operations.ProjectContributorEditedTest do
  use Operately.DataCase

  # import Operately.PeopleFixtures

  alias Operately.Access
  alias Operately.Access.Binding
  alias Operately.Projects.Project
  # alias Operately.Activities.Activity
  alias Operately.Support.Factory
  alias Operately.Operations.ProjectContributorEdited, as: Operation

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_company_member(:silvia)
    |> Factory.add_space(:product_space)
    |> Factory.add_space_member(:mike, :product_space)
    |> Factory.add_space_member(:jane, :product_space)
    |> Factory.add_project(:hello, :product_space)
    |> Factory.add_project_reviewer(:reviewer, :hello)
    |> Factory.add_project_contributor(:dev, :hello)
  end

  test "updating responsibility", ctx do
    {:ok, _ } = Operation.run(ctx.creator, ctx.dev, %{responsibility: "Project manager & Designer"})

    assert Operately.Repo.reload(ctx.dev).responsibility == "Project manager & Designer"
  end

  test "updating access level", ctx do
    {:ok, _} = Operation.run(ctx.creator, ctx.dev, %{permissions: Binding.comment_access()})

    assert get_access_level(ctx.dev) == Binding.comment_access()
  end

  test "converting a champion to a contributor", ctx do
    champion = find_champion(ctx.hello)
    {:ok, _} = Operation.run(ctx.creator, champion, %{role: :contributor, responsibility: "Developer"})

    contributor = Operately.Repo.reload(champion)

    assert contributor.role == :contributor
    assert contributor.responsibility == "Developer"
    assert get_access_level(contributor) == Binding.full_access()
    assert find_champion(ctx.hello) == nil
  end

  test "converting a reviewer to a contributor", ctx do
    reviewer = find_reviewer(ctx.hello)
    {:ok, _} = Operation.run(ctx.creator, reviewer, %{role: :contributor, responsibility: "Developer"})

    contributor = Operately.Repo.reload(reviewer)

    assert contributor.role == :contributor
    assert contributor.responsibility == "Developer"
    assert get_access_level(contributor) == Binding.full_access()
  end

  test "choosing a new champion that is not already a contributor", ctx do
    old_champion = find_champion(ctx.hello)

    {:ok, _} = Operation.run(ctx.creator, old_champion, %{person_id: ctx.silvia.id, role: :champion})

    # the new champion should be Silvia and have full access
    new_champion = find_champion(ctx.hello)
    assert new_champion.person_id == ctx.silvia.id
    assert new_champion.role == :champion
    assert get_access_level(new_champion) == Binding.full_access()

    # the old champion should be a contributor now
    old_champion = Operately.Repo.reload(old_champion)
    assert old_champion.role == :contributor
    assert get_access_level(old_champion) == Binding.full_access()
    assert old_champion.responsibility == nil
  end

  test "choosing a new champion from the contributors", ctx do
    old_champion = find_champion(ctx.hello)

    {:ok, _} = Operation.run(ctx.creator, old_champion, %{person_id: ctx.dev.person_id, role: :champion})

    # the new champion should be the dev and have full access
    new_champion = find_champion(ctx.hello)
    assert new_champion.person_id == ctx.dev.person_id
    assert new_champion.role == :champion
    assert get_access_level(new_champion) == Binding.full_access()

    # the old champion should be a contributor now with full access
    old_champion = Operately.Repo.reload(old_champion)
    assert old_champion.role == :contributor
    assert get_access_level(old_champion) == Binding.full_access()
    assert old_champion.responsibility == nil
  end

  #
  # Helpers
  #

  import Ecto.Query, only: [from: 2]

  def find_champion(project) do
    find_contributor_by_role(project, :champion)
  end

  def find_reviewer(project) do
    find_contributor_by_role(project, :reviewer)
  end

  def find_contributor_by_role(project, role) do
    Operately.Repo.one(from(c in Operately.Projects.Contributor, where: c.project_id == ^project.id and c.role == ^role))
  end

  defp get_access_level(contributor) do
    context = Project.get_access_context(contributor.project_id)
    binding = Access.get_binding(context, person_id: contributor.person_id)
    binding.access_level
  end
end
