defmodule Operately.Repo.Migrations.AddCompanyRoleToPeople do
  use Ecto.Migration

  def change do
    alter table(:people) do
      add :company_role, :string, null: false, default: "member"
    end
  end
end
