defmodule Operately.Kpis.Permissions do
  @moduledoc """
  Managing KPIs and their data points requires the same access level as
  editing the space the KPI belongs to. No dedicated KPI role exists.
  """

  alias Operately.Access.Binding

  def check_edit_access(person, space_id) do
    if Operately.Groups.get_access_level(space_id, person.id) >= Binding.edit_access() do
      :ok
    else
      {:error, :forbidden}
    end
  end
end
