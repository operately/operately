defmodule Operately.Assignments.Assignment do
  @enforce_keys [:id, :name, :due, :type, :url]
  defstruct [
    :id,
    :name,
    :due,
    :type,
    :url,
    :champion_id,
    :champion_name,
  ]
end
