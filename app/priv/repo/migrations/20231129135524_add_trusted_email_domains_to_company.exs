defmodule Operately.Repo.Migrations.AddTrustedEmailDomainsToCompany do
  use Ecto.Migration

  def change do
    alter table(:companies) do
      add :trusted_email_domains, {:array, :string}, default: []
    end
  end
end
