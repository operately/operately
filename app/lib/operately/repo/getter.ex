defmodule Operately.Repo.Getter do
  @moduledoc """
  This module provides a way to get a resource from the database, taking into
  account the requester's access level.

  ## System requester

  A special requester, `:system`, can be used to get a resource with full
  access which bypasses the access level check. The `:system` requester
  is used when the system itself is requesting the resource, e.g. when
  sending an emails, or when the system is performing a background task,
  or in tests.

  ## Usage

  To use this module, add the following to your schema:

    defmodule MySchema do
      use Operately.Schema
      use Operately.Repo.Getter     <---- Add this line

      schema "my_schema" do
        ...

        requester_info()             <---- Add this line
      end
    end

  When added, you can use the `get/2` function to get a resource with the
  requester's access level.

    MySchema.get(person, id: "123")
    MySchema.get(:system, id: "123")

  ## Return values

  The `get/2` function returns a tuple with the resource and the requester's
  access level. The following are the possible return values:

    {:ok, resource}        <-- The resource was found and the requester has access
    {:error, :not_found}   <-- The resource was found but the requester does not have access
    {:error, :not_found}   <-- The resource was not found

  ## Requester info

  Additionally, the returned resource will have a `requester_info` field which
  contains information about the requester. This field is virtual and is not
  stored in the database. The `requester_info` field contains the following
  fields:

    - `requester`: The requester who requested the resource
    - `access_level`: The requester's access level, based on access levels in Operately.Access.Binding.
    - `is_system_request`: A boolean indicating if the requester is the system

  ## Preloading

  You can preload associations when getting a resource. To preload associations,
  pass the `:preload` option to the `get/2` function. For example, if you have
  an association `:association` in your schema:

    defmodule MySchema do
      use Operately.Schema
      use Operately.Repo.Getter

      schema "my_schema" do
        has_one :projects, Project
        has_one :goal, Goal
      end
    end

  You can preload the `:association` association like this:

    MySchema.get(person, id: "123", opts: [preload: [:projects]])

  To preload multiple associations, pass a list of associations:

    MySchema.get(person, id: "123", opts: [preload: [:projects, :goal]])

  To preload nested associations, use a list of associations:

    MySchema.get(person, id: "123", opts: [preload: [projects: [champion: :person]]])

  ## Auth preloading

  If a preloaded association has its own access_context, use the `:auth_preload`
  option. It accepts the same shape as `:preload` and applies the same access
  check as `get/2`.

    MySchema.get(person, id: "123", opts: [auth_preload: [:space, :goal]])

  Auth preloads are applied at the top level only; nested preloads are loaded
  normally. For `:system` requester, `:auth_preload` behaves like `:preload`.

  ## Required access level

  By default, the getter only returns resources where the requester has at
  least `:view_access` (level 10). You can override this minimum by passing
  the `:required_access_level` option with an integer from
  `Operately.Access.Binding` (e.g. `Binding.edit_access()`).

    MySchema.get(person, id: "123", opts: [required_access_level: Binding.edit_access()])

  When the requester's highest access level for the resource is below the
  required level, `{:error, :not_found}` is returned.

  ## Getter profiles

  Schemas that need different row scopes or authorization paths can declare
  named Getter profiles with `getter_profile/1`. A profile combines an optional
  scope with one or more associations that resolve to
  `Operately.Access.Context`:

    alias Operately.Repo.Getter.Profile

    def getter_profile(:default) do
      %Profile{scope: &scope_projects/1, access_contexts: [:project_access_context]}
    end

    def getter_profile(:template) do
      %Profile{scope: &scope_templates/1, access_contexts: [:space_access_context]}
    end

    def getter_profile(_), do: nil

  Callers select a schema-declared profile by name:

    MySchema.get(person, id: "123", opts: [getter_profile: :template])

  Resources without `getter_profile/1` continue to use `:access_context` with
  no additional scope. Profile scopes also apply to `:system` requests.

  ## Getting solf-deleted resources

  If you want to get soft-deleted resources, you can pass the `:with_deleted`
  option to the `get/2` function. For example:

    MySchema.get(person, id: "123", opts: [with_deleted: true])

  # After Load Hooks

  You can pass a list of functions to the `get/2` function which will be called
  after the resource is loaded. This is useful for performing additional operations
  on the resource after it is loaded. For example:

    MySchema.get(person, id: "123", opts: [
      after_load: [
        &fill_permission_field/1,
        &parse_rich_text_fields/1
      ]
    ])

    def fill_permission_field(resource) do
      resource = Map.put(resource, :permissions, get_permissions(resource))
      resource
    end

    def parse_rich_text_fields(resource) do
      resource = Map.put(resource, :description, parse_rich_text(resource.description))
      resource
    end

  The functions in the `after_load` list should accept a single argument, the
  resource, and return the modified resource. The after load function is called
  only if the resource is found and the requester has access to the resource.

  If you need some context to be passed to the after load function, you can use
  the following pattern to create a closure with the context:

    MySchema.get(person, id: "123", opts: [
      after_load: [
        fill_permission_field(person)
      ]
    ])

    def fill_permission_field(person) do
      fn resource ->
        resource = Map.put(resource, :permissions, get_permissions(resource, person))
        resource
      end
    end

  In the above example, the `fill_permission_field` function returns a function
  that accepts a resource and returns the modified resource. The returned function
  has access to the `person` variable.
  """

  defmacro __using__(_) do
    quote do
      alias Operately.Repo
      import Ecto.Query, only: [from: 2]
      import Operately.Repo.RequestInfo, only: [request_info: 0]

      def get(requester, args) do
        Operately.Repo.Getter.get(__MODULE__, requester, args)
      end

      def get!(requester, args) do
        case Operately.Repo.Getter.get(__MODULE__, requester, args) do
          {:ok, resource} -> resource
          {:error, :not_found} -> raise Ecto.NoResultsError, queryable: __MODULE__
          {:error, reason} -> raise "Failed to get #{__MODULE__}: #{inspect(reason)}"
        end
      end
    end
  end

  import Ecto.Query

  alias Operately.Access.Binding
  alias Operately.Repo.RequestInfo

  defmodule Profile do
    @moduledoc """
    Describes how Getter scopes a resource and resolves its access contexts.

    Profiles are declared by schemas and selected by name through the
    `:getter_profile` option. Callers cannot provide query functions or access
    associations directly.
    """

    defstruct scope: nil, access_contexts: [:access_context]
  end

  def get(module, requester, args) do
    args = __MODULE__.GetterArgs.parse(args)
    profile = resolve_profile(module, args.getter_profile)

    # Auth preloads must override regular preloads for the same association.
    preload = drop_overlapping_preloads(args.preload, args.auth_preload)
    query = from(r in module, as: :resource, preload: ^preload)
    query = apply_profile_scope(query, module, args.getter_profile, profile)
    query = add_where_clauses(query, args.field_matchers)

    case requester do
      :system -> get_for_system(query, :system, args)
      %{} -> get_for_person(query, requester.id, args, profile.access_contexts)
      requester_id when is_binary(requester_id) -> get_for_person(query, requester_id, args, profile.access_contexts)
      _ -> {:error, :invalid_requester}
    end
  end

  def get_for_system(query, :system, args) do
    case load(query, args) do
      {:ok, resource} -> process_resource(resource, :system, Binding.full_access(), args)
      {:error, :not_found} -> {:error, :not_found}
    end
  end

  def get_for_person(query, requester_id, args, access_contexts \\ [:access_context]) do
    query =
      base_query(query, requester_id, args.required_access_level, access_contexts)
      |> group_by([resource: r, person: p], [r.id, p.id])
      |> select([resource: r, binding: b, person: p], {r, max(b.access_level), p})

    case load(query, args) do
      {:ok, {resource, access_level, requester}} -> process_resource(resource, requester, access_level, args)
      {:error, :not_found} -> {:error, :not_found}
    end
  end

  defp base_query(query, requester_id, required_access_level, access_contexts) do
    # Join the access graph and keep only bindings visible to the requester.
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

  defp resolve_profile(module, :default) do
    if function_exported?(module, :getter_profile, 1) do
      module
      |> apply(:getter_profile, [:default])
      |> validate_profile!(module, :default)
    else
      # Preserve the existing behavior for schemas that only use Getter with
      # `:system` and therefore do not expose an access context association.
      %Profile{}
    end
  end

  defp resolve_profile(module, profile_name) when is_atom(profile_name) do
    if function_exported?(module, :getter_profile, 1) do
      module
      |> apply(:getter_profile, [profile_name])
      |> validate_profile!(module, profile_name)
    else
      raise ArgumentError, "Unknown getter profile #{inspect(profile_name)} for #{inspect(module)}"
    end
  end

  defp resolve_profile(module, profile_name) do
    raise ArgumentError, "Getter profile names must be atoms, got #{inspect(profile_name)} for #{inspect(module)}"
  end

  defp validate_profile!(nil, module, profile_name) do
    raise ArgumentError, "Unknown getter profile #{inspect(profile_name)} for #{inspect(module)}"
  end

  defp validate_profile!(%Profile{} = profile, module, profile_name) do
    validate_scope!(profile.scope, module, profile_name)
    validate_access_contexts!(profile.access_contexts, module, profile_name)
    profile
  end

  defp validate_profile!(profile, module, profile_name) do
    raise ArgumentError,
          "Getter profile #{inspect(profile_name)} for #{inspect(module)} must return #{inspect(Profile)} or nil, got: #{inspect(profile)}"
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
        if assoc_module(module, association) != Operately.Access.Context do
          raise ArgumentError,
                "Getter profile #{inspect(profile_name)} for #{inspect(module)} association #{inspect(association)} must resolve to Operately.Access.Context"
        end
    end
  end

  defp apply_profile_scope(query, _module, _profile_name, %Profile{scope: nil}), do: query

  defp apply_profile_scope(query, module, profile_name, %Profile{scope: scope}) do
    case scope.(query) do
      %Ecto.Query{} = scoped_query ->
        scoped_query

      other ->
        raise ArgumentError,
              "Getter profile #{inspect(profile_name)} for #{inspect(module)} scope must return an Ecto.Query, got: #{inspect(other)}"
    end
  end

  def load(query, args) do
    Operately.Repo.one(query, with_deleted: args.with_deleted) |> to_tuple()
  end

  def add_where_clauses(query, field_matchers) do
    Enum.reduce(field_matchers, query, fn {name, value}, query ->
      where(query, [resource: r], field(r, ^name) == ^value)
    end)
  end

  def process_resource(resource, requester, access_level, args) do
    resource = RequestInfo.populate_request_info(resource, requester, access_level)
    resource = preload_auth(resource, requester, args)
    resource = run_after_load_hooks(resource, args.after_load)

    {:ok, resource}
  end

  def run_after_load_hooks(resource, hooks) do
    Enum.reduce(hooks, resource, fn hook, resource ->
      hook.(resource)
    end)
  end

  def to_tuple(nil), do: {:error, :not_found}
  def to_tuple(resource), do: {:ok, resource}

  defp drop_overlapping_preloads(preload, auth_preload) when auth_preload in [nil, []], do: preload

  defp drop_overlapping_preloads(preload, auth_preload) do
    auth_assocs = auth_preload_assocs(auth_preload)

    preload
    |> List.wrap()
    |> List.flatten()
    |> Enum.reject(&preload_assoc_in?(&1, auth_assocs))
  end

  defp auth_preload_assocs(auth_preload) do
    auth_preload
    |> List.wrap()
    |> List.flatten()
    |> Enum.map(&preload_assoc_name/1)
    |> Enum.reject(&is_nil/1)
    |> MapSet.new()
  end

  defp preload_assoc_in?(item, assocs) do
    case preload_assoc_name(item) do
      nil -> false
      assoc -> MapSet.member?(assocs, assoc)
    end
  end

  defp preload_assoc_name({assoc, _}) when is_atom(assoc), do: assoc
  defp preload_assoc_name(assoc) when is_atom(assoc), do: assoc
  defp preload_assoc_name(_), do: nil

  defp preload_auth(resource, _requester, %{auth_preload: auth_preload}) when auth_preload in [nil, []], do: resource

  defp preload_auth(resource, :system, %{auth_preload: auth_preload, with_deleted: with_deleted}) do
    Operately.Repo.preload(resource, List.wrap(auth_preload) |> List.flatten(), with_deleted: with_deleted)
  end

  defp preload_auth(resource, requester, %{auth_preload: auth_preload, with_deleted: with_deleted}) do
    # Auth preloads re-run access checks on the associated resources.
    requester_id = requester_id(requester)

    if requester_id do
      preload = build_auth_preload(resource.__struct__, requester_id, auth_preload)
      Operately.Repo.preload(resource, preload, with_deleted: with_deleted)
    else
      resource
    end
  end

  defp requester_id(%{id: id}), do: id
  defp requester_id(id) when is_binary(id), do: id
  defp requester_id(_), do: nil

  defp build_auth_preload(module, requester_id, auth_preload) do
    auth_preload
    |> List.wrap()
    |> List.flatten()
    |> Enum.map(&build_auth_preload_item(module, requester_id, &1))
    |> merge_auth_preload_items()
  end

  defp build_auth_preload_item(module, requester_id, {assoc, {query, nested}}) do
    {assoc, {auth_query(module, assoc, requester_id, query), normalize_nested_preload(nested)}}
  end

  defp build_auth_preload_item(module, requester_id, {assoc, %Ecto.Query{} = query}) do
    {assoc, auth_query(module, assoc, requester_id, query)}
  end

  defp build_auth_preload_item(module, requester_id, {assoc, %Ecto.SubQuery{} = query}) do
    {assoc, auth_query(module, assoc, requester_id, query)}
  end

  defp build_auth_preload_item(module, requester_id, {assoc, nested}) do
    {assoc, {auth_query(module, assoc, requester_id), normalize_nested_preload(nested)}}
  end

  defp build_auth_preload_item(module, requester_id, assoc) when is_atom(assoc) do
    {assoc, auth_query(module, assoc, requester_id)}
  end

  # Deduplicate auth preloads per assoc to avoid Ecto errors on repeated keys.
  defp merge_auth_preload_items(items) do
    items
    |> Enum.reduce(%{}, fn item, acc ->
      {assoc, query, nested} = normalize_auth_preload_item(item)

      # Keep the first auth query and merge nested preloads for the same assoc.
      Map.update(acc, assoc, {query, List.wrap(nested)}, fn {existing_query, existing_nested} ->
        {existing_query || query, merge_nested_preloads(existing_nested, nested)}
      end)
    end)
    |> Enum.map(fn {assoc, {query, nested}} ->
      if nested == [] do
        {assoc, query}
      else
        {assoc, {query, nested}}
      end
    end)
  end

  defp normalize_auth_preload_item({assoc, {query, nested}}), do: {assoc, query, normalize_nested_preload(nested)}
  defp normalize_auth_preload_item({assoc, query}), do: {assoc, query, []}

  # Merge nested preloads (e.g., [:members] + [:company]) into a single list.
  defp merge_nested_preloads(existing, nested) do
    existing = List.wrap(existing)
    nested = List.wrap(nested)

    Enum.uniq(existing ++ nested)
  end

  defp normalize_nested_preload(nil), do: []
  defp normalize_nested_preload(nested), do: nested

  defp auth_query(module, assoc, requester_id, query \\ nil) do
    assoc_module = assoc_module(module, assoc)
    profile = resolve_profile(assoc_module, :default)

    # Build an access-filtered query for the association being auth-preloaded.
    (query || assoc_module)
    |> Ecto.Queryable.to_query()
    |> ensure_resource_binding()
    |> apply_profile_scope(assoc_module, :default, profile)
    |> base_query(requester_id, Binding.view_access(), profile.access_contexts)
    |> distinct([resource: r], r.id)
  end

  defp ensure_resource_binding(query) do
    from(r in query, as: :resource)
  end

  defp assoc_module(module, assoc) do
    case module.__schema__(:association, assoc) do
      nil -> raise ArgumentError, "Unknown association #{inspect(assoc)} for #{inspect(module)}"
      %Ecto.Association.HasThrough{through: through} -> resolve_through_assoc(module, through)
      association -> association.related
    end
  end

  defp resolve_through_assoc(_module, []), do: raise(ArgumentError, "Invalid through association path")

  defp resolve_through_assoc(module, [assoc | rest]) do
    next_module = assoc_module(module, assoc)

    case rest do
      [] -> next_module
      _ -> resolve_through_assoc(next_module, rest)
    end
  end

  defmodule GetterArgs do
    defstruct field_matchers: [],
              preload: [],
              auth_preload: [],
              with_deleted: false,
              after_load: [],
              required_access_level: nil,
              getter_profile: :default

    @allowed_options [:preload, :auth_preload, :with_deleted, :after_load, :required_access_level, :getter_profile]

    def parse(args) do
      field_matchers = Keyword.delete(args, :opts)
      opts = Keyword.get(args, :opts, [])

      validate_options(opts)

      %__MODULE__{
        field_matchers: field_matchers,
        preload: Keyword.get(opts, :preload, []),
        auth_preload: Keyword.get(opts, :auth_preload, []),
        with_deleted: Keyword.get(opts, :with_deleted, false),
        after_load: Keyword.get(opts, :after_load, []),
        required_access_level: Keyword.get(opts, :required_access_level, Binding.view_access()),
        getter_profile: Keyword.get(opts, :getter_profile, :default)
      }
    end

    defp validate_options(opts) do
      unknown_options = Keyword.drop(opts, @allowed_options)

      if unknown_options != [] do
        raise ArgumentError, "Invalid options: #{Keyword.keys(unknown_options)}"
      end
    end
  end
end
