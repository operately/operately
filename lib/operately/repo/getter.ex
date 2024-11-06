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
    end
  end

  import Ecto.Query

  alias Operately.Access.Binding
  alias Operately.Repo.RequestInfo

  def get(module, requester, args) do
    args = __MODULE__.GetterArgs.parse(args)

    query = from(r in module, as: :resource, preload: ^args.preload)
    query = add_where_clauses(query, args.field_matchers)

    case requester do
      :system -> get_for_system(query, :system, args)
      %{} -> get_for_person(query, requester, args)
      _ -> {:error, :invalid_requester}
    end
  end

  def get_for_system(query, :system, args) do
    case load(query, args) do
      {:ok, resource} -> process_resource(resource, :system, Binding.full_access(), args)
      {:error, :not_found} -> {:error, :not_found}
    end
  end

  def get_for_person(query, requester, args) do
    query = from([resource: r] in query,
      join: c in assoc(r, :access_context),
      join: b in assoc(c, :bindings), as: :binding,
      join: g in assoc(b, :group),
      join: m in assoc(g, :memberships),
      join: p in assoc(m, :person),
      where: m.person_id == ^requester.id,
      where: is_nil(p.suspended_at),
      where: b.access_level >= ^Binding.view_access(),
      group_by: r.id,
      select: {r, max(b.access_level)})

    case load(query, args) do
      {:ok, {resource, access_level}} -> process_resource(resource, requester, access_level, args)
      {:error, :not_found} -> {:error, :not_found}
    end
  end

  defp load(query, args) do
    Operately.Repo.one(query, with_deleted: args.with_deleted) |> to_tuple()
  end

  defp add_where_clauses(query, field_matchers) do
    Enum.reduce(field_matchers, query, fn {name, value}, query ->
      where(query, [resource: r], field(r, ^name) == ^value)
    end)
  end

  defp process_resource(resource, requester, access_level, args) do
    resource = RequestInfo.populate_request_info(resource, requester, access_level)
    resource = run_after_load_hooks(resource, args.after_load)

    {:ok, resource}
  end

  defp run_after_load_hooks(resource, hooks) do
    Enum.reduce(hooks, resource, fn hook, resource ->
      hook.(resource)
    end)
  end

  defp to_tuple(nil), do: {:error, :not_found}
  defp to_tuple(resource), do: {:ok, resource}

  defmodule GetterArgs do
    defstruct [
      field_matchers: [],
      preload: [],
      with_deleted: false,
      after_load: []
    ]

    @allowed_options [:preload, :with_deleted, :after_load]

    def parse(args) do
      field_matchers = Keyword.delete(args, :opts)
      opts = Keyword.get(args, :opts, [])

      validate_options(opts)

      %__MODULE__{
        field_matchers: field_matchers,
        preload: Keyword.get(opts, :preload, []),
        with_deleted: Keyword.get(opts, :with_deleted, false),
        after_load: Keyword.get(opts, :after_load, [])
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
