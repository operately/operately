defmodule Operately.Repo.Migrations.AddProjectTemplateDocsAndFiles do
  use Ecto.Migration

  def change do
    create table(:project_template_resource_nodes, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :project_template_id, references(:project_templates, type: :binary_id, on_delete: :delete_all), null: false
      add :type, :string, null: false
      add :position, :integer, null: false

      timestamps()
    end

    create index(:project_template_resource_nodes, [:project_template_id, :position])

    create table(:project_template_resource_folders, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :node_id, references(:project_template_resource_nodes, type: :binary_id, on_delete: :delete_all), null: false
      add :name, :string, null: false

      timestamps()
    end

    create index(:project_template_resource_folders, [:node_id])

    alter table(:project_template_resource_nodes) do
      add :parent_folder_id, references(:project_template_resource_folders, type: :binary_id, on_delete: :delete_all)
    end

    create index(:project_template_resource_nodes, [:parent_folder_id, :position])

    create table(:project_template_resource_documents, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :node_id, references(:project_template_resource_nodes, type: :binary_id, on_delete: :delete_all), null: false
      add :author_id, references(:people, type: :binary_id, on_delete: :nilify_all)
      add :name, :string, null: false
      add :content, :map, null: false

      timestamps()
    end

    create index(:project_template_resource_documents, [:node_id])
    create index(:project_template_resource_documents, [:author_id])

    create table(:project_template_resource_files, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :node_id, references(:project_template_resource_nodes, type: :binary_id, on_delete: :delete_all), null: false
      add :author_id, references(:people, type: :binary_id, on_delete: :nilify_all)
      add :blob_id, references(:blobs, type: :binary_id, on_delete: :nothing), null: false
      add :preview_blob_id, references(:blobs, type: :binary_id, on_delete: :nothing)
      add :name, :string, null: false
      add :description, :map

      timestamps()
    end

    create index(:project_template_resource_files, [:node_id])
    create index(:project_template_resource_files, [:author_id])
    create index(:project_template_resource_files, [:blob_id])
    create index(:project_template_resource_files, [:preview_blob_id])

    create table(:project_template_resource_links, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :node_id, references(:project_template_resource_nodes, type: :binary_id, on_delete: :delete_all), null: false
      add :author_id, references(:people, type: :binary_id, on_delete: :nilify_all)
      add :name, :string, null: false
      add :url, :string, null: false
      add :description, :map
      add :type, :string, null: false

      timestamps()
    end

    create index(:project_template_resource_links, [:node_id])
    create index(:project_template_resource_links, [:author_id])
  end
end
