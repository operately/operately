defmodule Operately.Projects.ListOperationTest do
  use Operately.DataCase

  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures
  import Operately.ProjectsFixtures
  import Operately.GroupsFixtures

  describe "visibility filters" do
    setup do
      company = company_fixture()

      creator = person_fixture(company_id: company.id)
      colaborator = person_fixture(company_id: company.id)
      non_colaborator = person_fixture(company_id: company.id)

      project1 = project_fixture(%{company_id: company.id, visibility: "everyone", creator_id: creator.id})
      project2 = project_fixture(%{company_id: company.id, visibility: "invite-only", creator_id: creator.id})
      project3 = project_fixture(%{company_id: company.id, visibility: "invite-only", creator_id: creator.id})

      {:ok, %{
        company: company,
        creator: creator,
        colaborator: colaborator,
        non_colaborator: non_colaborator,
        project1: project1,
        project2: project2,
        project3: project3
      }}
    end

    test "creator can see all projects", ctx do
      projects_ids = load_ids(ctx.creator, %{})
      assert members(projects_ids, [ctx.project1.id, ctx.project2.id, ctx.project3.id])
    end

    test "colaborator can see the public and private projects they are a contributor of", ctx do
      Operately.Projects.create_contributor(%{
        project_id: ctx.project2.id,
        person_id: ctx.colaborator.id,
        role: :contributor
      })

      projects_ids = load_ids(ctx.colaborator, %{})
      assert members(projects_ids, [ctx.project1.id, ctx.project2.id])
      assert not_members(projects_ids, [ctx.project3.id])
    end

    test "non_colaborator can only see public projects", ctx do
      projects_ids = load_ids(ctx.non_colaborator, %{})
      assert members(projects_ids, [ctx.project1.id])
      assert not_members(projects_ids, [ctx.project2.id, ctx.project3.id])
    end
  end

  describe "group filters" do
    setup do
      company = company_fixture()
      person = person_fixture(company_id: company.id)
      project = project_fixture(%{company_id: company.id, creator_id: person.id})
      group = group_fixture()

      {:ok, %{
        company: company, 
        person: person, 
        project: project,
        group: group
      }}
    end

    test "listing projects for a group where the members are the champion of the project", ctx do
      Operately.Groups.add_member(ctx.group, ctx.person.id)

      Operately.Projects.create_contributor(%{
        project_id: ctx.project.id,
        person_id: ctx.person.id,
        role: "champion"
      })

      project_ids = load_ids(ctx.person, %{group_id: ctx.group.id, group_member_roles: ["champion"]})

      assert Enum.member?(project_ids, ctx.project.id)
    end
  end

  defp load_ids(person, filters) do
    Operately.Projects.ListOperation.run(person, filters) |> Enum.map(& &1.id)
  end

  defp members(list, ids) do
    Enum.all?(ids, fn id -> Enum.member?(list, id) end)
  end

  defp not_members(list, ids) do
    Enum.all?(ids, fn id -> not(Enum.member?(list, id)) end)
  end

end
