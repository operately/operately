defmodule Operately.Repo.Migrations.ChangeFkContraintOnProjectDocuments do
  use Ecto.Migration

  def change do
    drop constraint(:projects, :projects_pitch_document_id_fkey)
    drop constraint(:projects, :projects_plan_document_id_fkey)
    drop constraint(:projects, :projects_execution_review_document_id_fkey)
    drop constraint(:projects, :projects_control_review_document_id_fkey)
    drop constraint(:projects, :projects_retrospective_document_id_fkey)

    alter table(:projects) do
      modify :pitch_document_id, references(:project_documents, on_delete: :nilify_all, type: :binary_id)
      modify :plan_document_id, references(:project_documents, on_delete: :nilify_all, type: :binary_id)
      modify :execution_review_document_id, references(:project_documents, on_delete: :nilify_all, type: :binary_id)
      modify :control_review_document_id, references(:project_documents, on_delete: :nilify_all, type: :binary_id)
      modify :retrospective_document_id, references(:project_documents, on_delete: :nilify_all, type: :binary_id)
    end
  end
end
