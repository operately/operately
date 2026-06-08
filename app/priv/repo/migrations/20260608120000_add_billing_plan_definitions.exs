defmodule Operately.Repo.Migrations.AddBillingPlanDefinitions do
  use Ecto.Migration

  def up do
    create table(:billing_plan_definitions, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :plan_key, :string, null: false
      add :display_name, :string, null: false
      add :sort_order, :integer, null: false
      add :member_limit, :integer
      add :storage_limit_bytes, :bigint

      timestamps()
    end

    create unique_index(:billing_plan_definitions, [:plan_key])
    create unique_index(:billing_plan_definitions, [:sort_order])

    execute """
    INSERT INTO billing_plan_definitions
      (id, plan_key, display_name, sort_order, member_limit, storage_limit_bytes, inserted_at, updated_at)
    VALUES
      (gen_random_uuid(), 'free', 'Free', 0, 20, 1073741824, NOW(), NOW()),
      (gen_random_uuid(), 'team', 'Team', 1, 50, 107374182400, NOW(), NOW()),
      (gen_random_uuid(), 'business', 'Business', 2, 200, 1099511627776, NOW(), NOW()),
      (gen_random_uuid(), 'unlimited', 'Unlimited', 3, NULL, NULL, NOW(), NOW())
    """
  end

  def down do
    drop table(:billing_plan_definitions)
  end
end
