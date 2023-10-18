defmodule OperatelyWeb.Graphql.Types.Kpis do
  use Absinthe.Schema.Notation

  object :kpi do
    field :id, non_null(:id)
    field :name, non_null(:string)
    field :description, :string
    field :unit, :string
    field :target, :integer
    field :target_direction, :string

    field :metrics, list_of(:kpi_metric) do
      resolve fn kpi, _, _ -> 
        metrics = Operately.Kpis.get_metrics(kpi, 12)

        {:ok, metrics}
      end
    end
  end

  object :kpi_metric do
    field :date, non_null(:date)
    field :value, non_null(:integer)
  end
end
