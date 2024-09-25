defmodule Operately.Notifications.Subscriber do
  alias Operately.Projects.Contributor

  defstruct [
    :person,
    :role,
    :priority,
  ]

  def from_project_contributor(contributors) when is_list(contributors) do
    Enum.map(contributors, &from_project_contributor/1)
  end

  def from_project_contributor(%Contributor{} = contriburor) do
    case contriburor.role do
      :champion -> %{ role: "Champion", priority: true }
      :reviewer -> %{ role: "Reviewer", priority: true }
      _ -> %{ role: contriburor.responsibility, priority: false }
    end
    |> then(fn result ->
      %__MODULE__{
        person: contriburor.person,
        role: result.role,
        priority: result.priority,
      }
    end)
  end
end
