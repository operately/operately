defmodule Operately.Repo.Migrations.RenameActivityContextIdToActivityAccessContextId do
  use Ecto.Migration

  def change do
    rename table(:activities), :context_id, to: :access_context_id
  end
end
