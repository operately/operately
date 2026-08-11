defmodule Operately.Repo.Migrations.AddProjectTemplateDiscussions do
  use Ecto.Migration

  def change do
    create table(:project_template_discussions, primary_key: false) do
      add :id, :binary_id, primary_key: true

      add :project_template_id,
          references(:project_templates, type: :binary_id, on_delete: :delete_all),
          null: false

      add :author_id, references(:people, type: :binary_id, on_delete: :nilify_all)
      add :title, :string, null: false
      add :body, :map, null: false
      add :position, :integer, null: false

      timestamps()
    end

    create index(:project_template_discussions, [:project_template_id, :position])
    create index(:project_template_discussions, [:author_id])
  end
end
