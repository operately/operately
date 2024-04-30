defmodule OperatelyWeb.Graphql.Types.Timeframe do
  use Absinthe.Schema.Notation

  object :timeframe do
    field :start_date, non_null(:date)
    field :end_date, non_null(:date)
    field :type, non_null(:string)
  end

  #
  # Why does timeframe_input exist if we already have a timeframe object?
  #
  # GraphQL does not support input objects as arguments to mutations.
  # For example, when creating a goal, we need to receive a Timeframe object as an argument,
  # but we can't do that directly in GraphQL.
  # 
  # Instead, we need to define an input object that will be used as an argument to the mutation.
  #
  input_object :timeframe_input do
    field :start_date, non_null(:date)
    field :end_date, non_null(:date)
    field :type, non_null(:string)
  end
end
