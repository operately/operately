defmodule Operately.Repo.Migrations.CleanupSchemaDrift do
  use Ecto.Migration

  def change do
    alter table(:activities) do
      remove :action_type
      remove :event_data
      remove :person_id
      remove :scope_id
      remove :scope_type
    end

    alter table(:messages) do
      remove :space_id
    end

    alter table(:people) do
      remove :company_role
      remove :has_open_invitation
      remove :notify_about_assignments
      remove :notify_on_mention
      remove :send_daily_summary
      remove :theme
    end

    alter table(:project_retrospectives) do
      remove :closed_at
    end

    alter table(:projects) do
      remove :closed_by_id
      remove :control_review_document_id
      remove :execution_review_document_id
      remove :phase
      remove :pitch_document_id
      remove :plan_document_id
      remove :retrospective
      remove :retrospective_document_id
    end

    alter table(:tasks) do
      remove :assignee_id
    end

    drop table(:invitation_tokens)
    drop table(:invitations)
  end
end
