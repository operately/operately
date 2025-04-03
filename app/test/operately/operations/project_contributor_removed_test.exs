defmodule Operately.Operations.ProjectContributorRemovedTest do
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
    person = person_fixture_with_account(%{company_id: company.id})
    project = project_fixture(%{company_id: company.id, creator_id: creator.id, group_id: company.company_space_id})

    {:ok, contributor} = Operately.Operations.ProjectContributorAddition.run(creator, %{
      project_id: project.id,
      person_id: person.id,
      responsibility: "Developer",
      permissions: Binding.edit_access(),
    })

    {:ok, creator: creator, contributor: contributor, person: person, project: project}
  end

  test "ProjectContributorRemoved operation deletes contributor", ctx do
    contributors = get_contributors(ctx.project)

    assert length(contributors) == 2
    assert Enum.member?(contributors, {ctx.person.id, :contributor})

    Operately.Operations.ProjectContributorRemoved.run(ctx.creator, ctx.contributor)

    contributors = get_contributors(ctx.project)

    assert length(contributors) == 1
    refute Enum.member?(contributors, {ctx.person.id, :contributor})
  end

  test "ProjectContributorRemoved operation deletes access binding", ctx do
    context = Access.get_context!(project_id: ctx.project.id)
    group = Access.get_group!(person_id: ctx.person.id)

    assert Access.get_binding(context_id: context.id, group_id: group.id)

    Operately.Operations.ProjectContributorRemoved.run(ctx.creator, ctx.contributor)

    refute Access.get_binding(context_id: context.id, group_id: group.id)
  end

  test "ProjectContributorRemoved operation creates activity", ctx do
    query = from(a in Activity, where: a.action == "project_contributor_removed" and a.content["project_id"] == ^ctx.project.id)

    refute Repo.one(query)

    Operately.Operations.ProjectContributorRemoved.run(ctx.creator, ctx.contributor)

    assert Repo.one(query)
  end

  #
  # Helpers
  #

  defp get_contributors(project) do
    Projects.list_project_contributors(project)
    |> Enum.map(fn c -> {c.person_id, c.role} end)
  end
end
