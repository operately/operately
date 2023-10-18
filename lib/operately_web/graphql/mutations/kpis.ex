defmodule OperatelyWeb.Graphql.Mutations.Kpis do
  use Absinthe.Schema.Notation

  input_object :create_kpi_input do
    field :name, non_null(:string)
    field :description, :string
    field :unit, non_null(:string)
    field :target, non_null(:integer)
    field :target_direction, non_null(:string)
    field :warning_threshold, non_null(:integer)
    field :warning_direction, non_null(:string)
    field :danger_threshold, non_null(:integer)
    field :danger_direction, non_null(:string)
  end

  object :kpi_mutations do
    field :create_kpi, :kpi do
      arg :input, non_null(:create_kpi_input)

      resolve fn args, _ ->
        Operately.Kpis.create_kpi(args.input)
      end
    end
  end
end
