defmodule Operately.Data.Change009CreateProjectsAccessContextTest do
  use Operately.DataCase

  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures
  import Operately.GroupsFixtures
  import Operately.ProjectsFixtures

  alias Operately.Repo
  alias Operately.Access.Context
  alias Operately.Data.Change009CreateProjectsAccessContext

  setup do
    company = company_fixture()
    creator = person_fixture_with_account(%{company_id: company.id})
    group = group_fixture(creator)

    {:ok, company: company, creator: creator, group: group}
  end

  test "creates access_context for existing companies", ctx do
    projects = Enum.map(1..3, fn _ ->
      project_fixture(%{company_id: ctx.company.id, group_id: ctx.group.id, creator_id: ctx.creator.id})
    end)

    Enum.each(projects, fn project ->
      assert nil == Repo.get_by(Context, project_id: project.id)
    end)

    Change009CreateProjectsAccessContext.run()

    Enum.each(projects, fn project ->
      assert %Context{} = Repo.get_by(Context, project_id: project.id)
    end)
  end
end
