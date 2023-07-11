defmodule OperatelyWeb.GraphQL.Mutations.Dashboards do
  use Absinthe.Schema.Notation

  input_object :update_dashboard_input do
    field :id, non_null(:id)
    field :panels, list_of(:panel_input)
  end

  input_object :panel_input do
    field :id, non_null(:id)
    field :index, non_null(:integer)
    field :type, non_null(:string)
  end

  object :dashboard_mutations do
    field :update_dashboard, non_null(:dashboard) do
      arg :input, non_null(:update_dashboard_input)

      resolve fn %{input: input}, _ ->
        Operately.Repo.transaction(fn ->
          dashboard = Operately.Dashboards.get_dashboard!(input.id)
          panels = Operately.Repo.preload(dashboard, [:panels]).panels

          panels |> Enum.each(fn panel ->
            input_panel = Enum.find(input.panels, fn input_panel -> input_panel.id == panel.id end)

            if input_panel do
              {:ok, _} = Operately.Dashboards.update_panel(panel, %{
                index: input_panel.index, 
                type: input_panel.type
              })
            else
              {:ok, _} = Operately.Dashboards.delete_panel(panel)
            end
          end)

          dashboard
        end)
        |> case do
          {:ok, dashboard} ->
            dashboard = Operately.Repo.preload(dashboard, [:panels])
            {:ok, dashboard}

          {:error, _} -> 
            {:error, "Failed to update dashboard"}
        end
      end
    end
  end
end
