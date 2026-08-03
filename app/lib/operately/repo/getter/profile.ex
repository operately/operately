defmodule Operately.Repo.Getter.Profile do
  @moduledoc """
  Describes how Getter scopes a resource and resolves its access contexts.

  Profiles are declared by schemas and selected by name through the
  `:getter_profile` option. Callers cannot provide query functions or access
  associations directly.
  """

  alias Operately.Repo.Getter.Association

  defstruct scope: nil, access_contexts: [:access_context]

  def resolve!(module, :default) do
    if function_exported?(module, :getter_profile, 1) do
      module
      |> apply(:getter_profile, [:default])
      |> validate!(module, :default)
    else
      # Preserve the existing behavior for schemas that only use Getter with
      # `:system` and therefore do not expose an access context association.
      %__MODULE__{}
    end
  end

  def resolve!(module, profile_name) when is_atom(profile_name) do
    if function_exported?(module, :getter_profile, 1) do
      module
      |> apply(:getter_profile, [profile_name])
      |> validate!(module, profile_name)
    else
      raise ArgumentError, "Unknown getter profile #{inspect(profile_name)} for #{inspect(module)}"
    end
  end

  def resolve!(module, profile_name) do
    raise ArgumentError, "Getter profile names must be atoms, got #{inspect(profile_name)} for #{inspect(module)}"
  end

  def apply_scope!(query, _module, _profile_name, %__MODULE__{scope: nil}), do: query

  def apply_scope!(query, module, profile_name, %__MODULE__{scope: scope}) do
    case scope.(query) do
      %Ecto.Query{} = scoped_query ->
        scoped_query

      other ->
        raise ArgumentError,
              "Getter profile #{inspect(profile_name)} for #{inspect(module)} scope must return an Ecto.Query, got: #{inspect(other)}"
    end
  end

  defp validate!(nil, module, profile_name) do
    raise ArgumentError, "Unknown getter profile #{inspect(profile_name)} for #{inspect(module)}"
  end

  defp validate!(%__MODULE__{} = profile, module, profile_name) do
    validate_scope!(profile.scope, module, profile_name)
    validate_access_contexts!(profile.access_contexts, module, profile_name)
    profile
  end

  defp validate!(profile, module, profile_name) do
    raise ArgumentError,
          "Getter profile #{inspect(profile_name)} for #{inspect(module)} must return #{inspect(__MODULE__)} or nil, got: #{inspect(profile)}"
  end

  defp validate_scope!(nil, _module, _profile_name), do: :ok
  defp validate_scope!(scope, _module, _profile_name) when is_function(scope, 1), do: :ok

  defp validate_scope!(_scope, module, profile_name) do
    raise ArgumentError,
          "Getter profile #{inspect(profile_name)} for #{inspect(module)} scope must be nil or a function with arity 1"
  end

  defp validate_access_contexts!(access_contexts, module, profile_name) when is_list(access_contexts) and access_contexts != [] do
    if Enum.all?(access_contexts, &is_atom/1) and Enum.uniq(access_contexts) == access_contexts do
      Enum.each(access_contexts, &validate_access_context_association!(&1, module, profile_name))
    else
      raise ArgumentError,
            "Getter profile #{inspect(profile_name)} for #{inspect(module)} access_contexts must be a non-empty list of unique association names"
    end
  end

  defp validate_access_contexts!(_access_contexts, module, profile_name) do
    raise ArgumentError,
          "Getter profile #{inspect(profile_name)} for #{inspect(module)} access_contexts must be a non-empty list of unique association names"
  end

  defp validate_access_context_association!(association, module, profile_name) do
    case module.__schema__(:association, association) do
      nil ->
        raise ArgumentError,
              "Getter profile #{inspect(profile_name)} for #{inspect(module)} has unknown access context association #{inspect(association)}"

      _association ->
        if Association.related_module!(module, association) != Operately.Access.Context do
          raise ArgumentError,
                "Getter profile #{inspect(profile_name)} for #{inspect(module)} association #{inspect(association)} must resolve to Operately.Access.Context"
        end
    end
  end
end
