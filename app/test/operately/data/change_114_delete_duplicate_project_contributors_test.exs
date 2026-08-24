defmodule Operately.Data.Change114DeleteDuplicateProjectContributorsTest do
  use Operately.DataCase

  import Ecto.Query, only: [from: 2]
  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures
  import Operately.ProjectsFixtures

  alias Operately.Data.Change114DeleteDuplicateProjectContributors
  alias Operately.Access.Binding

  setup do
    company = company_fixture()
    creator = person_fixture(%{company_id: company.id})

    project =
      project_fixture(%{
        company_id: company.id,
        creator_id: creator.id,
        group_id: company.company_space_id,
        company_access_level: Binding.view_access(),
        space_access_level: Binding.no_access()
      })

    person = person_fixture(%{company_id: company.id})

    %{project: project, person: person, creator: creator}
  end

  test "keeps champion over contributor duplicates", ctx do
    drop_unique_constraint()

    kept_id = insert_contributor!(ctx.project.id, ctx.person.id, "champion", ~N[2026-01-01 10:00:00])
    insert_contributor!(ctx.project.id, ctx.person.id, "contributor", ~N[2026-01-02 10:00:00])

    assert contributor_count(ctx.project.id, ctx.person.id) == 2

    Change114DeleteDuplicateProjectContributors.run()
    create_unique_constraint()

    assert contributor_count(ctx.project.id, ctx.person.id) == 1
    assert Repo.get!(Operately.Projects.Contributor, kept_id).role == :champion
  end

  test "keeps oldest contributor when roles match", ctx do
    drop_unique_constraint()

    kept_id = insert_contributor!(ctx.project.id, ctx.person.id, "contributor", ~N[2026-01-01 10:00:00])
    insert_contributor!(ctx.project.id, ctx.person.id, "contributor", ~N[2026-01-02 10:00:00])

    Change114DeleteDuplicateProjectContributors.run()
    create_unique_constraint()

    assert contributor_count(ctx.project.id, ctx.person.id) == 1
    assert Repo.get!(Operately.Projects.Contributor, kept_id)
  end

  test "is idempotent when there are no duplicates", ctx do
    insert_contributor!(ctx.project.id, ctx.person.id, "contributor", NaiveDateTime.utc_now() |> NaiveDateTime.truncate(:second))

    Change114DeleteDuplicateProjectContributors.run()
    Change114DeleteDuplicateProjectContributors.run()

    assert contributor_count(ctx.project.id, ctx.person.id) == 1
  end

  defp drop_unique_constraint do
    Repo.query!("DROP INDEX IF EXISTS project_contributors_project_id_person_id_index")
  end

  defp create_unique_constraint do
    Repo.query!(
      "CREATE UNIQUE INDEX project_contributors_project_id_person_id_index ON project_contributors (project_id, person_id)"
    )
  end

  defp insert_contributor!(project_id, person_id, role, inserted_at) do
    id = Ecto.UUID.generate()

    Repo.insert_all("project_contributors", [
      %{
        id: Ecto.UUID.dump!(id),
        project_id: Ecto.UUID.dump!(project_id),
        person_id: Ecto.UUID.dump!(person_id),
        role: role,
        responsibility: "dup",
        inserted_at: inserted_at,
        updated_at: inserted_at
      }
    ])

    id
  end

  defp contributor_count(project_id, person_id) do
    Repo.one(
      from(c in Operately.Projects.Contributor,
        where: c.project_id == ^project_id and c.person_id == ^person_id,
        select: count(c.id)
      )
    )
  end
end
