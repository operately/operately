defmodule Operately.Data.Change023AddTagToReviewersAndChampionsBindingsTest do
  use Operately.DataCase

  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures
  import Operately.ProjectsFixtures
  import Operately.GoalsFixtures

  alias Operately.Access
  alias Operately.Access.Binding
  alias Operately.Goals.Goal
  alias Operately.Projects.{Project, Contributor}

  setup do
    company = company_fixture()
    creator = person_fixture_with_account(%{company_id: company.id})
    reviewer = person_fixture_with_account(%{company_id: company.id})
    champion = person_fixture_with_account(%{company_id: company.id})

    {:ok, company: company, creator: creator, reviewer: reviewer, champion: champion}
  end

  test "creates tags for projects reviewers' and champions' bindings", ctx do
    project_with_tags = Enum.map(1..3, fn _ ->
      create_project_with_tags(ctx.company, ctx.creator, ctx.reviewer, ctx.champion)
    end)
    project_without_tags = Enum.map(1..3, fn _ ->
      create_project_without_tags(ctx.company, ctx.creator, ctx.reviewer, ctx.champion)
    end)

    assert_has_tag(project_with_tags, ctx.reviewer, ctx.champion)
    refute_has_tag(project_without_tags, ctx.reviewer, ctx.champion)

    Operately.Data.Change023AddTagToReviewersAndChampionsBindings.run()

    all_projects = project_with_tags ++ project_without_tags

    assert_has_tag(all_projects, ctx.reviewer, ctx.champion)
  end

  test "creates tags for goals reviewers' and champions' bindings", ctx do
    goals_with_tags = Enum.map(1..3, fn _ ->
      create_goal_with_tags(ctx.company, ctx.creator, ctx.reviewer, ctx.champion)
    end)
    goals_without_tags = Enum.map(1..3, fn _ ->
      create_goal_without_tags(ctx.company, ctx.creator, ctx.reviewer, ctx.champion)
    end)

    assert_has_tag(goals_with_tags, ctx.reviewer, ctx.champion)
    refute_has_tag(goals_without_tags, ctx.reviewer, ctx.champion)

    Operately.Data.Change023AddTagToReviewersAndChampionsBindings.run()

    all_goals = goals_with_tags ++ goals_without_tags

    assert_has_tag(all_goals, ctx.reviewer, ctx.champion)
  end

  #
  # Steps
  #

  defp assert_has_tag(resources, reviewer, champion) do
    Enum.each(resources, fn resource ->
      context = get_context(resource)
      reviewer_group = Access.get_group!(person_id: reviewer.id)
      champion_group = Access.get_group!(person_id: champion.id)

      assert Access.get_binding(context_id: context.id, group_id: reviewer_group.id)
      assert Access.get_binding(tag: :reviewer, context_id: context.id, group_id: reviewer_group.id)

      assert Access.get_binding(context_id: context.id, group_id: champion_group.id)
      assert Access.get_binding(tag: :champion, context_id: context.id, group_id: champion_group.id)
    end)
  end

  defp refute_has_tag(resources, reviewer, champion) do
    Enum.each(resources, fn resource ->
      context = get_context(resource)
      reviewer_group = Access.get_group!(person_id: reviewer.id)
      champion_group = Access.get_group!(person_id: champion.id)

      assert Access.get_binding(context_id: context.id, group_id: reviewer_group.id)
      refute Access.get_binding(tag: :reviewer, context_id: context.id, group_id: reviewer_group.id)

      assert Access.get_binding(context_id: context.id, group_id: champion_group.id)
      refute Access.get_binding(tag: :champion, context_id: context.id, group_id: champion_group.id)
    end)
  end

  #
  # Helpers
  #

  defp create_project_with_tags(company, creator, reviewer, champion) do
    project_fixture(%{
      company_id: company.id,
      creator_id: creator.id,
      reviewer_id: reviewer.id,
      champion_id: champion.id,
      group_id: company.company_space_id,
      creator_is_contributor: "yes",
    })
  end

  defp create_project_without_tags(company, creator, reviewer, champion) do
    {:ok, project} = Project.changeset(%{
      name: "some name",
      company_id: company.id,
      group_id: company.company_space_id,
      creator_id: creator.id,
      reviewer_id: reviewer.id,
      champion_id: champion.id,
    })
    |> Repo.insert()

    {:ok, context} = Access.create_context(%{project_id: project.id})

    create_contributor(%{project_id: project.id, person_id: reviewer.id, role: :reviewer})
    create_contributor(%{project_id: project.id, person_id: champion.id, role: :champion})

    create_binding(context, reviewer)
    create_binding(context, champion)

    project
  end

  defp create_goal_with_tags(company, creator, reviewer, champion) do
    goal_fixture(creator, %{
      space_id: company.company_space_id,
      champion_id: champion.id,
      reviewer_id: reviewer.id,
    })
  end

  defp create_goal_without_tags(company, creator, reviewer, champion) do
    {:ok, goal} = Goal.changeset(%{
      company_id: company.id,
      name: "some name",
      group_id: company.company_space_id,
      champion_id: champion.id,
      reviewer_id: reviewer.id,
      creator_id: creator.id,
    })
    |> Repo.insert()

    {:ok, context} = Access.create_context(%{goal_id: goal.id})

    create_binding(context, reviewer)
    create_binding(context, champion)

    goal
  end

  defp create_binding(context, person) do
    group = Access.get_group!(person_id: person.id)

    Access.create_binding(%{context_id: context.id, group_id: group.id, access_level: Binding.full_access()})
  end

  defp create_contributor(attrs) do
    Contributor.changeset(attrs)
    |> Repo.insert()
  end

  defp get_context(%Goal{} = resource), do: Access.get_context!(goal_id: resource.id)
  defp get_context(%Project{} = resource), do: Access.get_context!(project_id: resource.id)
end
