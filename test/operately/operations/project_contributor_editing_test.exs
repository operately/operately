defmodule Operately.Operations.ProjectContributorEditingTest do
  use Operately.DataCase

  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures
  import Operately.ProjectsFixtures

  alias Operately.Projects
  alias Operately.Access
  alias Operately.Access.Binding
  alias Operately.Activities.Activity

  setup do
    company = company_fixture()
    creator = person_fixture_with_account(%{company_id: company.id})
    champion = person_fixture_with_account(%{company_id: company.id})
    contributor = person_fixture_with_account(%{company_id: company.id})

    project = project_fixture(%{
      company_id: company.id,
      creator_id: creator.id,
      champion_id: champion.id,
      group_id: company.company_space_id,
    })

    attrs = %{
      project_id: project.id,
      responsibility: "Developer",
      permissions: Binding.edit_access(),
    }

    {:ok, company: company, creator: creator, champion: champion, contributor: contributor, project: project, attrs: attrs}
  end

  test "ProjectContributorEditing operation updates reviewer/champion with the same person", ctx do
    champion = Projects.get_contributor!(person_id: ctx.champion.id, project_id: ctx.project.id)

    assert champion.role == :champion

    {:ok, updated} = Operately.Operations.ProjectContributorEditing.run(ctx.creator, champion, %{
      person_id: ctx.champion.id,
      role: :reviewer,
    })

    assert updated.role == :reviewer
  end

  test "ProjectContributorEditing operation updates contributor with the same person", ctx do
    {:ok, contributor} = Projects.create_contributor(ctx.creator, Map.merge(ctx.attrs, %{
      person_id: ctx.contributor.id,
    }))
    group = Access.get_group!(person_id: ctx.contributor.id)
    context = Access.get_context!(project_id: ctx.project.id)

    assert Access.get_binding(context_id: context.id, group_id: group.id, access_level: Binding.edit_access())
    assert contributor.responsibility == "Developer"

    {:ok, updated} = Operately.Operations.ProjectContributorEditing.run(ctx.creator, contributor, %{
      person_id: ctx.contributor.id,
      responsibility: "Manager",
      permissions: Binding.full_access(),
    })

    assert updated.responsibility == "Manager"
    assert Access.get_binding(context_id: context.id, group_id: group.id, access_level: Binding.full_access())
  end

  test "ProjectContributorEditing operation updates reviewer/champion with another person", ctx do
    champion_person = Projects.get_champion(ctx.project)
    new_champion_person = person_fixture_with_account(%{company_id: ctx.company.id})

    context = Access.get_context!(project_id: ctx.project.id)
    champion_group = Access.get_group!(person_id: champion_person.id)
    new_champion_group = Access.get_group!(person_id: new_champion_person.id)

    assert Access.get_binding(context_id: context.id, group_id: champion_group.id, access_level: Binding.full_access())
    refute Access.get_binding(context_id: context.id, group_id: new_champion_group.id)

    champion = Projects.get_contributor!(person_id: ctx.champion.id, project_id: ctx.project.id)
    assert champion_person == ctx.champion

    {:ok, _} = Operately.Operations.ProjectContributorEditing.run(ctx.creator, champion, %{
      person_id: new_champion_person.id,
    })

    assert new_champion_person == Projects.get_champion(ctx.project)

    refute Access.get_binding(context_id: context.id, group_id: champion_group.id)
    assert Access.get_binding(context_id: context.id, group_id: new_champion_group.id, access_level: Binding.full_access())
  end

  test "ProjectContributorEditing operation handles reviewer's and champion's tags correctly", ctx do
    project = project_fixture(%{
      company_id: ctx.company.id,
      creator_id: ctx.creator.id,
      creator_is_contributor: "yes",
      group_id: ctx.company.company_space_id,
    })

    # Reviewer and Champion are the same person
    context = Access.get_context!(project_id: project.id)
    reviewer_champion_group = Access.get_group!(person_id: ctx.creator.id)

    assert_raise Ecto.MultipleResultsError, ~r/^expected at most one result but got 2 in query:/, fn ->
      Access.get_binding(context_id: context.id, group_id: reviewer_champion_group.id)
    end
    assert Access.get_binding(tag: :reviewer, context_id: context.id, group_id: reviewer_champion_group.id)
    assert Access.get_binding(tag: :champion, context_id: context.id, group_id: reviewer_champion_group.id)

    # Reviewer is updated
    reviewer = person_fixture_with_account(%{company_id: ctx.company.id})
    contributor = Repo.preload(project, :reviewer_contributor).reviewer_contributor

    {:ok, _} = Operately.Operations.ProjectContributorEditing.run(ctx.creator, contributor, %{
      person_id: reviewer.id,
    })

    # Reviewer and Champion are different people
    reviewer_group = Access.get_group!(person_id: reviewer.id)

    assert Access.get_binding(context_id: context.id, group_id: reviewer_group.id)
    assert Access.get_binding(tag: :reviewer, context_id: context.id, group_id: reviewer_group.id)

    assert Access.get_binding(context_id: context.id, group_id: reviewer_champion_group.id)
    assert Access.get_binding(tag: :champion, context_id: context.id, group_id: reviewer_champion_group.id)
  end

  test "ProjectContributorEditing operation updates contributor with a different person", ctx do
    {:ok, contributor} = Projects.create_contributor(ctx.creator, Map.merge(ctx.attrs, %{
      person_id: ctx.contributor.id,
    }))
    new_person = person_fixture_with_account(%{company_id: ctx.company.id})

    context = Access.get_context!(project_id: ctx.project.id)
    contributor_group = Access.get_group!(person_id: ctx.contributor.id)
    new_person_group = Access.get_group!(person_id: new_person.id)

    assert Access.get_binding(context_id: context.id, group_id: contributor_group.id, access_level: Binding.edit_access())
    refute Access.get_binding(context_id: context.id, group_id: new_person_group.id)

    {:ok, _} = Operately.Operations.ProjectContributorEditing.run(ctx.creator, contributor, %{
      person_id: new_person.id,
      responsibility: "Manager",
      permissions: Binding.comment_access(),
    })

    refute Access.get_binding(context_id: context.id, group_id: contributor_group.id)
    assert Access.get_binding(context_id: context.id, group_id: new_person_group.id, access_level: Binding.comment_access())
  end

  test "ProjectContributorEditing operation creates activity", ctx do
    {:ok, contributor} = Projects.create_contributor(ctx.creator, Map.merge(ctx.attrs, %{
      person_id: ctx.contributor.id,
    }))
    new_person = person_fixture_with_account(%{company_id: ctx.company.id})

    Operately.Operations.ProjectContributorEditing.run(ctx.creator, contributor, %{
      person_id: new_person.id,
      permissions: Binding.view_access(),
    })

    activity = from(a in Activity, where: a.action == "project_contributor_edited" and a.content["project_id"] == ^ctx.project.id) |> Repo.one()

    assert activity.content["previous_contributor"]["person_id"] == contributor.person_id
    assert activity.content["previous_contributor"]["role"] == "contributor"

    assert activity.content["updated_contributor"]["person_id"] == new_person.id
    assert activity.content["updated_contributor"]["permissions"] == Binding.view_access()
    assert activity.content["updated_contributor"]["role"] == "contributor"
  end
end
