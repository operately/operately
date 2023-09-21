defmodule OperatelyWeb.Schema do
  use Absinthe.Schema
  require OperatelyWeb.SchemaUtils

  import_types Absinthe.Type.Custom

  OperatelyWeb.SchemaUtils.import_all_types "graphql/types"
  OperatelyWeb.SchemaUtils.import_all_queries "graphql/queries"
  OperatelyWeb.SchemaUtils.import_all_mutations "graphql/mutations"

  subscription do
    field :group_added, :group do
      config fn _, _ ->
        {:ok, %{topic: "*"}}
      end
    end

    field :project_added, :project do
      config fn _, _ ->
        {:ok, %{topic: "*"}}
      end
    end

    field :tenet_added, :tenet do
      config fn _, _ ->
        {:ok, %{topic: "*"}}
      end
    end

    field :kpi_added, :kpi do
      config fn _, _ ->
        {:ok, %{topic: "*"}}
      end
    end

    field :objective_added, :objective do
      config fn _, _ ->
        {:ok, %{topic: "*"}}
      end
    end

    field :update_added, :activity do
      arg :updatable_id, non_null(:id)
      arg :updatable_type, non_null(:string)

      config fn _, _ ->
        {:ok, %{topic: "*"}}
      end
    end

    field :comment_added, :comment do
      arg :updatable_id, non_null(:id)
      arg :updatable_type, non_null(:string)

      config fn _, _ ->
        {:ok, %{topic: "*"}}
      end
    end
  end
end
