defmodule Operately.Data.Change009CreateProjectsAccessContextTest do
  use Operately.DataCase

  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures
  import Operately.GroupsFixtures
  import Operately.ProjectsFixtures

  alias Operately.Repo
  alias Operately.Access
  alias Operately.Access.Context
  alias Operately.Data.Change009CreateProjectsAccessContext

  setup do
    company = company_fixture()
    creator = person_fixture_with_account(%{company_id: company.id})
    group = group_fixture(creator)

    {:ok, company: company, creator: creator, group: group}
  end

  test "creates access_context for existing projects", ctx do
    projects = Enum.map(1..5, fn _ ->
      create_project(%{company_id: ctx.company.id, group_id: ctx.group.id, creator_id: ctx.creator.id})
    end)

    Enum.each(projects, fn project ->
      assert nil == Repo.get_by(Context, project_id: project.id)
    end)

    Change009CreateProjectsAccessContext.run()

    Enum.each(projects, fn project ->
      context = Repo.get_by(Context, project_id: project.id)

      assert nil != context
      assert %Context{} = context
    end)
  end

  test "creates access_context successfully when a project already has access context", ctx do
    project_with_context = project_fixture(%{company_id: ctx.company.id, group_id: ctx.group.id, creator_id: ctx.creator.id})
    project_without_context = create_project(%{company_id: ctx.company.id, group_id: ctx.group.id, creator_id: ctx.creator.id})

    assert nil != Access.get_context!(project_id: project_with_context.id)

    Change009CreateProjectsAccessContext.run()

    assert nil != Access.get_context!(project_id: project_without_context.id)
  end

  def create_project(attrs) do
    {:ok, project} = Operately.Projects.Project.changeset(%{
      name: "some name",
      company_id: attrs.company_id,
      group_id: attrs.group_id,
      creator_id: attrs.creator_id,
    })
    |> Repo.insert()

    project
  end
end
