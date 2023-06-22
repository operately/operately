defmodule Operately.Repo.Migrations.AddDocumentLinksToProjects do
  use Ecto.Migration

  def change do
    alter table(:projects) do
      add :pitch_document_id, references(:project_documents, on_delete: :delete_all, type: :binary_id)
      add :plan_document_id, references(:project_documents, on_delete: :delete_all, type: :binary_id)
      add :execution_review_document_id, references(:project_documents, on_delete: :delete_all, type: :binary_id)
      add :control_review_document_id, references(:project_documents, on_delete: :delete_all, type: :binary_id)
      add :retrospective_document_id, references(:project_documents, on_delete: :delete_all, type: :binary_id)
    end

    create index(:projects, [:pitch_document_id])
    create index(:projects, [:plan_document_id])
    create index(:projects, [:execution_review_document_id])
    create index(:projects, [:control_review_document_id])
    create index(:projects, [:retrospective_document_id])
  end
end
