defmodule OperatelyWeb.GraphQL.Types.Tenets do
  use Absinthe.Schema.Notation

  object :tenet do
    field :id, non_null(:id)
    field :name, non_null(:string)
    field :description, :string

    field :kpis, list_of(:kpi) do
      resolve fn tenet, _, _ ->
        kpis = Operately.Tenets.list_kpis(tenet)

        {:ok, kpis}
      end
    end
  end
end
