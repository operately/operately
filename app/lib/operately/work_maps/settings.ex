defmodule Operately.WorkMaps.Settings do
  use Operately.Schema

  alias Operately.Companies.Company
  alias Operately.Groups.Group

  schema "work_map_settings" do
    belongs_to :company, Company
    belongs_to :space, Group

    field :default_view, :map
    field :ordered_item_ids, {:array, :binary_id}, default: []
    field :pinned_kpi_ids, {:array, :binary_id}, default: []
  end
end
