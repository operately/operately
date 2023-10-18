defmodule OperatelyWeb.Graphql.Queries.Kpis do
  use Absinthe.Schema.Notation

  object :kpi_queries do
    field :kpis, list_of(:kpi) do
      resolve fn _, _, _ ->
        kpis = Operately.Kpis.list_kpis()

        {:ok, kpis}
      end
    end

    field :kpi, :kpi do
      arg :id, non_null(:id)

      resolve fn args, _ ->
        kpi = Operately.Kpis.get_kpi!(args.id)

        {:ok, kpi}
      end
    end
  end
end
