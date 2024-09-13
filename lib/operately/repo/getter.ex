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

  alias Operately.People.Person
  alias Operately.Access.Binding
  alias Operately.Repo.RequestInfo

  def get(module, :system, args) do
    query = build_query(module, args)
    
    case load(query, args) do
      nil -> 
        {:error, :not_found}
      resource -> 
        process_result(resource, Binding.full_access(), :system)
    end
  end

  def get(module, requester = %Person{}, args) do
    query = build_query(module, args)

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
      nil -> 
        {:error, :not_found}
      {resource, access_level} -> 
        process_result(resource, access_level, requester)
    end
  end

  defp load(query, args) do
    if args[:with_deleted] do
      Operately.Repo.one(query, :with_deleted)
    else
      Operately.Repo.one(query)
    end
  end

  defp build_query(module, args) do
    {field_matchers, preload} = parse_args(args)

    query = from(r in module, as: :resource, preload: ^preload)
    query = add_where_clauses(query, field_matchers)
    query
  end

  defp add_where_clauses(query, field_matchers) do
    Enum.reduce(field_matchers, query, fn {name, value}, query ->
      where(query, [resource: r], field(r, ^name) == ^value)
    end)
  end

  defp parse_args(args) do
    field_matchers = Keyword.delete(args, :opts)
    opts = Keyword.get(args, :opts, [])
    preload = Keyword.get(opts, :preload, [])

    {field_matchers, preload}
  end

  defp process_result(resource, access_level, requester) do
    resource = RequestInfo.populate_request_info(resource, requester, access_level)
    {:ok, resource}
  end
end
