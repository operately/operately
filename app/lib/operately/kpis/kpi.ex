defmodule Operately.Kpis.Kpi do
  use Operately.Schema
  import Operately.Repo.RequestInfo, only: [request_info: 0]

  @type t :: %__MODULE__{
          id: Ecto.UUID.t() | nil,
          name: String.t() | nil,
          unit: String.t() | nil,
          archived_at: NaiveDateTime.t() | nil,
          space_id: Ecto.UUID.t() | nil,
          creator_id: Ecto.UUID.t() | nil,
          inserted_at: NaiveDateTime.t() | nil,
          updated_at: NaiveDateTime.t() | nil
        }

  schema "kpis" do
    belongs_to :space, Operately.Groups.Group
    belongs_to :creator, Operately.People.Person

    has_many :kpi_values, Operately.Kpis.KpiValue

    field :name, :string
    field :unit, :string
    field :archived_at, :naive_datetime

    timestamps()
    requester_access_level()
    request_info()
  end

  def changeset(attrs) do
    changeset(%__MODULE__{}, attrs)
  end

  def changeset(kpi, attrs) do
    kpi
    |> cast(attrs, [:name, :unit, :archived_at, :space_id, :creator_id])
    |> validate_required([:name, :unit, :space_id, :creator_id])
  end

  def get(requester, args) do
    __MODULE__.Getter.get(__MODULE__, requester, args)
  end

  def get!(requester, args) do
    case get(requester, args) do
      {:ok, resource} -> resource
      {:error, :not_found} -> raise Ecto.NoResultsError, queryable: __MODULE__
      {:error, reason} -> raise "Failed to get #{__MODULE__}: #{inspect(reason)}"
    end
  end

  #
  # Scopes
  #

  import Ecto.Query, only: [from: 2]

  def scope_space(query, space_id) do
    from k in query, where: k.space_id == ^space_id
  end

  defmodule Getter do
    import Ecto.Query
    alias Operately.Access.Binding
    alias Operately.Repo.Getter, as: BaseGetter

    def get(module, requester, args) do
      args = BaseGetter.GetterArgs.parse(args)

      query = from(r in module, as: :resource, preload: ^args.preload)
      query = BaseGetter.add_where_clauses(query, args.field_matchers)

      case requester do
        :system ->
          BaseGetter.get_for_system(query, :system, args)

        %{} ->
          query =
            build_base_query(query, requester.id)
            |> group_by([resource: r], r.id)
            |> select([resource: r, binding: b], {r, max(b.access_level)})

          case BaseGetter.load(query, args) do
            {:ok, {resource, access_level}} ->
              BaseGetter.process_resource(resource, requester, access_level, args)

            {:error, :not_found} ->
              {:error, :not_found}
          end

        requester_id when is_binary(requester_id) ->
          query =
            build_base_query(query, requester_id)
            |> group_by([resource: r, person: p], [r.id, p.id])
            |> select([resource: r, binding: b, person: p], {r, max(b.access_level), p})

          case BaseGetter.load(query, args) do
            {:ok, {resource, access_level, requester}} ->
              BaseGetter.process_resource(resource, requester, access_level, args)

            {:error, :not_found} ->
              {:error, :not_found}
          end

        _ ->
          {:error, :invalid_requester}
      end
    end

    defp build_base_query(query, requester_id) do
      from([resource: r] in query,
        join: sp in assoc(r, :space),
        join: c in assoc(sp, :access_context),
        join: b in assoc(c, :bindings),
        as: :binding,
        join: g in assoc(b, :group),
        join: m in assoc(g, :memberships),
        join: p in assoc(m, :person),
        as: :person,
        where: m.person_id == ^requester_id,
        where: is_nil(p.suspended_at),
        where: b.access_level >= ^Binding.view_access()
      )
    end
  end
end
