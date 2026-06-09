defmodule Operately.Repo.Migrations.AddMetadataToBillingPlanDefinitions do
  use Ecto.Migration

  def up do
    alter table(:billing_plan_definitions) do
      add :tier_rank, :integer
      add :billing_behavior, :string
      add :customer_selectable, :boolean, null: false, default: false
      add :archived_at, :utc_datetime
    end

    execute """
    UPDATE billing_plan_definitions
    SET
      tier_rank = CASE plan_key
        WHEN 'free' THEN 0
        WHEN 'team' THEN 1
        WHEN 'business' THEN 2
        WHEN 'unlimited' THEN 3
      END,
      billing_behavior = CASE plan_key
        WHEN 'free' THEN 'internal'
        WHEN 'team' THEN 'provider_managed'
        WHEN 'business' THEN 'provider_managed'
        WHEN 'unlimited' THEN 'provider_managed'
      END,
      customer_selectable = CASE plan_key
        WHEN 'free' THEN FALSE
        ELSE TRUE
      END
    WHERE plan_key IN ('free', 'team', 'business', 'unlimited')
    """

    execute "ALTER TABLE billing_plan_definitions ALTER COLUMN tier_rank SET NOT NULL"
    execute "ALTER TABLE billing_plan_definitions ALTER COLUMN billing_behavior SET NOT NULL"

    drop_if_exists index(:billing_plan_definitions, [:sort_order],
                     name: :billing_plan_definitions_sort_order_index
                   )

    create unique_index(:billing_plan_definitions, [:sort_order],
             where: "archived_at IS NULL",
             name: :billing_plan_definitions_active_sort_order_index
           )

    create unique_index(:billing_plan_definitions, [:tier_rank],
             where: "archived_at IS NULL",
             name: :billing_plan_definitions_active_tier_rank_index
           )
  end

  def down do
    drop_if_exists index(:billing_plan_definitions, [:tier_rank],
                     name: :billing_plan_definitions_active_tier_rank_index
                   )

    drop_if_exists index(:billing_plan_definitions, [:sort_order],
                     name: :billing_plan_definitions_active_sort_order_index
                   )

    create unique_index(:billing_plan_definitions, [:sort_order])

    alter table(:billing_plan_definitions) do
      remove :archived_at
      remove :customer_selectable
      remove :billing_behavior
      remove :tier_rank
    end
  end
end
