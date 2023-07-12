defmodule OperatelyWeb.GraphQL.Mutations.Dashboards do
  use Absinthe.Schema.Notation

  input_object :update_dashboard_input do
    field :id, non_null(:id)
    field :panels, list_of(:panel_input)
  end

  input_object :panel_input do
    field :id, :id
    field :index, :integer
    field :type, non_null(:string)
  end

  object :dashboard_mutations do
    field :update_dashboard, non_null(:dashboard) do
      arg :input, non_null(:update_dashboard_input)

      resolve fn %{input: input}, _ ->
        Operately.Repo.transaction(fn ->
          dashboard = Operately.Dashboards.get_dashboard!(input.id)

          panels_in_the_db = Operately.Repo.preload(dashboard, [:panels]).panels
          new_panels = Enum.filter(input.panels, fn input_panel -> input_panel[:id] === nil end)
          updated_panels = Enum.filter(input.panels, fn input_panel -> input_panel[:id] !== nil end)

          create_panels(dashboard, new_panels)
          update_panels(updated_panels, panels_in_the_db)
          remove_panels(updated_panels, panels_in_the_db)

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

  def create_panels(dashboard, panels) do
    panels |> Enum.each(fn panel ->
      {:ok, _} = Operately.Dashboards.create_panel(%{
        dashboard_id: dashboard.id,
        index: panel.index, 
        type: panel.type
      })
    end)
  end

  def update_panels(updated_panels, panels_in_the_db) do
    updated_panels |> Enum.each(fn new_data ->
      panel = Enum.find(panels_in_the_db, fn panel -> panel.id == new_data.id end)

      {:ok, _} = Operately.Dashboards.update_panel(panel, %{
        index: new_data.index,
        type: new_data.type
      })
    end)
  end

  def remove_panels(updated_panels, panels_in_the_db) do
    panels_in_the_db |> Enum.each(fn panel ->
      if Enum.find(updated_panels, fn new_panel -> new_panel.id == panel.id end) == nil do
        Operately.Dashboards.delete_panel(panel)
      end
    end)
  end

end
