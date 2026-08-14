defmodule Operately.Repo.Migrations.AddProjectTemplateComments do
  use Ecto.Migration

  def change do
    create table(:project_template_comments, primary_key: false) do
      add :id, :binary_id, primary_key: true

      add :project_template_id,
          references(:project_templates, type: :binary_id, on_delete: :delete_all),
          null: false

      add :author_id, references(:people, type: :binary_id, on_delete: :nilify_all)
      add :parent_type, :string, null: false
      add :parent_id, :binary_id, null: false
      add :content, :map, null: false
      add :position, :integer, null: false

      timestamps()
    end

    create index(:project_template_comments, [:project_template_id, :parent_type, :parent_id, :position])
    create index(:project_template_comments, [:author_id])

    create constraint(:project_template_comments, :project_template_comments_position_non_negative, check: "position >= 0")
  end
end
