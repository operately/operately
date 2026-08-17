defmodule Operately.Repo.Getter.BaseQuery do
  import Ecto.Query

  alias Operately.Repo.Getter.{Args, AuthPreloader, Profile}

  def build(module, %Args{} = args) do
    profile = Profile.resolve!(module, args.getter_profile)

    query =
      from(resource in module, as: :resource, preload: ^AuthPreloader.ordinary_preloads(args.preload, args.auth_preload))
      |> Profile.apply_scope!(module, args.getter_profile, profile)
      |> add_field_matchers(args.field_matchers)
      |> add_order_by(module, args.order_by)

    {query, profile}
  end

  defp add_field_matchers(query, field_matchers) do
    Enum.reduce(field_matchers, query, fn {name, value}, query ->
      where(query, [resource: resource], field(resource, ^name) == ^value)
    end)
  end

  defp add_order_by(query, _module, []), do: query

  defp add_order_by(query, module, order_by) do
    validate_order_by!(module, order_by)
    order_by(query, ^order_by)
  end

  defp validate_order_by!(module, order_by) when is_list(order_by) do
    valid_directions = [:asc, :asc_nulls_first, :asc_nulls_last, :desc, :desc_nulls_first, :desc_nulls_last]
    schema_fields = module.__schema__(:fields)

    if Enum.all?(order_by, fn
         {direction, field} -> Enum.member?(valid_directions, direction) and Enum.member?(schema_fields, field)
         _ -> false
       end) do
      :ok
    else
      raise ArgumentError,
            "Invalid order_by for #{inspect(module)}. Use schema fields with an Ecto order direction, got: #{inspect(order_by)}"
    end
  end

  defp validate_order_by!(module, order_by) do
    raise ArgumentError,
          "Invalid order_by for #{inspect(module)}. Expected a list of field directions, got: #{inspect(order_by)}"
  end
end
