defmodule Operately.Repo.Getter.Association do
  def related_module!(module, association_name) do
    case module.__schema__(:association, association_name) do
      nil -> raise ArgumentError, "Unknown association #{inspect(association_name)} for #{inspect(module)}"
      %Ecto.Association.HasThrough{through: through} -> resolve_through_association!(module, through)
      association -> association.related
    end
  end

  defp resolve_through_association!(_module, []), do: raise(ArgumentError, "Invalid through association path")

  defp resolve_through_association!(module, [association_name | rest]) do
    related_module = related_module!(module, association_name)

    case rest do
      [] -> related_module
      _ -> resolve_through_association!(related_module, rest)
    end
  end
end
