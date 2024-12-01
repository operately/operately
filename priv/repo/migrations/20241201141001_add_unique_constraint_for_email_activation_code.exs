defmodule Operately.Repo.Migrations.AddUniqueConstraintForEmailActivationCode do
  use Ecto.Migration

  def change do
    create unique_index(:email_activation_codes, [:code])
  end
end
