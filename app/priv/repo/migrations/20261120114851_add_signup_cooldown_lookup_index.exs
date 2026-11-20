defmodule Operately.Repo.Migrations.AddSignupCooldownLookupIndex do
  use Ecto.Migration

  @disable_ddl_transaction true
  @disable_migration_lock true

  def change do
    create index(:email_activation_codes, ["lower(btrim(email))", :inserted_at],
             name: :email_activation_codes_normalized_email_inserted_at_index,
             concurrently: true
           )
  end
end
