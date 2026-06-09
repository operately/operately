defmodule Operately.Repo.Migrations.RemoveSortOrderFromBillingPlanDefinitions do
  use Ecto.Migration

  def up do
    drop_if_exists index(:billing_plan_definitions, [:sort_order],
                     name: :billing_plan_definitions_active_sort_order_index
                   )

    alter table(:billing_plan_definitions) do
      remove :sort_order
    end
  end

  def down do
    alter table(:billing_plan_definitions) do
      add :sort_order, :integer
    end

    execute "UPDATE billing_plan_definitions SET sort_order = tier_rank"
    execute "ALTER TABLE billing_plan_definitions ALTER COLUMN sort_order SET NOT NULL"

    create unique_index(:billing_plan_definitions, [:sort_order],
             where: "archived_at IS NULL",
             name: :billing_plan_definitions_active_sort_order_index
           )
  end
end
