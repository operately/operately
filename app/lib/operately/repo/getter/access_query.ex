defmodule Operately.Repo.Getter.AccessQuery do
  import Ecto.Query

  alias Operately.Access.Binding

  def authorize(query, requester_id, required_access_level, access_contexts) do
    query = join_access_contexts(query, access_contexts)
    binding_context_match = binding_context_match(access_contexts)

    from([resource: _resource] in query,
      join: b in Binding,
      on: ^binding_context_match,
      as: :binding,
      join: g in assoc(b, :group),
      join: m in assoc(g, :memberships),
      join: p in assoc(m, :person),
      as: :person,
      where: m.person_id == ^requester_id,
      where: is_nil(p.suspended_at),
      where: b.access_level >= ^required_access_level
    )
  end

  defp join_access_contexts(query, access_contexts) do
    access_contexts
    |> Enum.with_index()
    |> Enum.reduce(query, fn {association, index}, query ->
      binding = access_context_binding(index)
      join(query, :left, [resource: resource], context in assoc(resource, ^association), as: ^binding)
    end)
  end

  defp binding_context_match(access_contexts) do
    access_contexts
    |> Enum.with_index()
    |> Enum.reduce(dynamic(false), fn {_association, index}, match ->
      context_binding = access_context_binding(index)
      dynamic([binding: binding], ^match or binding.context_id == as(^context_binding).id)
    end)
  end

  defp access_context_binding(index), do: String.to_atom("getter_access_context_#{index}")
end
