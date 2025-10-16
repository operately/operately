defmodule Operately.Repo.Migrations.AddMissingIndexesForGoalsAndProjectsAndOtherResources do
  use Ecto.Migration

  def change do
    create index(:goals, [:company_id])
    create index(:goals, [:champion_id])
    create index(:goals, [:reviewer_id])
    create index(:goals, [:creator_id])

    create index(:projects, [:creator_id])

    create index(:project_contributors, [:project_id, :role],
             name: :project_contributors_project_id_role_idx
           )

    create index(:groups, [:company_id])
    create index(:blobs, [:company_id])

    create index(:access_bindings, [:group_id, :access_level],
             name: :access_bindings_group_id_access_level_idx
           )
  end
end
