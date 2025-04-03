defmodule Operately.Data.Change020CreateProjectContributorsBindingsTest do
  use Operately.DataCase

  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures
  import Operately.GroupsFixtures
  import Operately.ProjectsFixtures

  alias Operately.Repo
  alias Operately.Access
  alias Operately.Access.Binding
  alias Operately.Projects
  alias Operately.Projects.{Project, Contributor}

  setup do
    company = company_fixture()
    creator = person_fixture_with_account(%{company_id: company.id})
    group = group_fixture(creator)

    project_with_bindings = Enum.map(1..3, fn _ ->
      create_project_with_bindings(%{
        company_id: company.id,
        creator_id: creator.id,
        group_id: group.id,
      })
    end)

    project_without_bindings = Enum.map(1..3, fn _ ->
      create_project_without_bindings(%{
        company_id: company.id,
        creator_id: creator.id,
        group_id: group.id,
      })
    end)

    {:ok, project_with_bindings: project_with_bindings, project_without_bindings: project_without_bindings}
  end

  test "creates access binding to existing contributors", ctx do
    Enum.each(ctx.project_with_bindings, fn project ->
      context = Access.get_context!(project_id: project.id)

      Projects.list_project_contributors(project)
      |> Enum.each(fn contributor ->
        group = Access.get_group!(person_id: contributor.person_id)

        assert Access.get_binding(context_id: context.id, group_id: group.id)
      end)
    end)

    Enum.each(ctx.project_without_bindings, fn project ->
      context = Access.get_context!(project_id: project.id)

      Projects.list_project_contributors(project)
      |> Enum.each(fn contributor ->
        group = Access.get_group!(person_id: contributor.person_id)

        refute Access.get_binding(context_id: context.id, group_id: group.id)
      end)
    end)

    Operately.Data.Change020CreateProjectContributorsBindings.run()

    Enum.each(ctx.project_without_bindings, fn project ->
      context = Access.get_context!(project_id: project.id)

      Projects.list_project_contributors(project)
      |> Enum.each(fn contributor ->
        group = Access.get_group!(person_id: contributor.person_id)

        case contributor.role do
          :contributor ->
            assert Access.get_binding(context_id: context.id, group_id: group.id)
            assert Access.get_binding(context_id: context.id, group_id: group.id, access_level: Binding.edit_access())

          _ ->
            assert Access.get_binding(context_id: context.id, group_id: group.id)
            assert Access.get_binding(context_id: context.id, group_id: group.id, access_level: Binding.full_access())
        end
      end)
    end)
  end

  #
  # Helpers
  #

  defp create_project_with_bindings(attrs) do
    reviewer = person_fixture_with_account(%{company_id: attrs.company_id})
    champion = person_fixture_with_account(%{company_id: attrs.company_id})

    project_fixture(%{
      company_id: attrs.company_id,
      creator_id: attrs.creator_id,
      reviewer_id: reviewer.id,
      champion_id: champion.id,
      group_id: attrs.group_id,
      creator_is_contributor: "yes",
    })
  end

  defp create_project_without_bindings(attrs) do
    {:ok, project} = Project.changeset(%{
      name: "some name",
      company_id: attrs.company_id,
      group_id: attrs.group_id,
      creator_id: attrs.creator_id,
    })
    |> Repo.insert()

    Access.create_context(%{project_id: project.id})

    reviewer = person_fixture_with_account(%{company_id: attrs.company_id})
    champion = person_fixture_with_account(%{company_id: attrs.company_id})

    create_contributor(project.id, attrs.creator_id, :contributor)
    create_contributor(project.id, reviewer.id, :reviewer)
    create_contributor(project.id, champion.id, :champion)

    project
  end

  defp create_contributor(project_id, person_id, role) do
    Contributor.changeset(%{
      project_id: project_id,
      person_id: person_id,
      role: role,
    })
    |> Repo.insert()
  end
end
