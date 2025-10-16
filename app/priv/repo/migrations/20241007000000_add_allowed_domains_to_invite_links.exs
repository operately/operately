defmodule Operately.Repo.Migrations.AddAllowedDomainsToInviteLinks do
  use Ecto.Migration

  def change do
    alter table(:invite_links) do
      add :allowed_domains, {:array, :string}, default: [], null: false
    end
  end
end
