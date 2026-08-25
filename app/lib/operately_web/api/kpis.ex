defmodule OperatelyWeb.Api.Kpis do
  #
  # NOTE: These endpoints intentionally do NOT check the
  # `enabled_experimental_features` feature flag. Per product decision, KPI
  # gating is UI-only for this iteration, so the API must work when called
  # directly regardless of the space's enabled features. This is a temporary,
  # intentional decision tracked as a risk in the mission and should be
  # revisited once KPIs graduate from experimental.
  #

  alias Operately.Groups.{Group, Permissions}
  alias Operately.Kpis
  alias Operately.Kpis.Kpi

  defmodule ListKpis do
    @moduledoc "Lists the KPIs of a space."

    use TurboConnect.Query
    use OperatelyWeb.Api.Helpers

    inputs do
      field :space_id, :id, null: false
    end

    outputs do
      field :kpis, list_of(:kpi), null: false
    end

    def call(conn, inputs) do
      Action.new()
      |> run(:me, fn -> find_me(conn) end)
      |> run(:space, fn ctx -> Group.get(ctx.me, id: inputs.space_id) end)
      |> run(:check_permissions, fn ctx -> Permissions.check(ctx.space.request_info.access_level, :can_view, company_read_only: company_read_only(conn)) end)
      |> run(:kpis, fn ctx ->
        kpis =
          Kpis.list_kpis(ctx.space.id)
          |> Repo.preload(:champion)
          |> Kpis.load_recent_entries()

        {:ok, kpis}
      end)
      |> run(:serialized, fn ctx -> {:ok, %{kpis: Serializer.serialize(ctx.kpis, level: :essential)}} end)
      |> respond()
    end

    defp respond(result) do
      case result do
        {:ok, ctx} -> {:ok, ctx.serialized}
        {:error, :space, _} -> {:error, :not_found}
        {:error, :check_permissions, _} -> {:error, :forbidden}
        _ -> {:error, :internal_server_error}
      end
    end
  end

  defmodule GetKpi do
    @moduledoc "Retrieves a KPI together with its entries (history) for charting."

    use TurboConnect.Query
    use OperatelyWeb.Api.Helpers

    inputs do
      field :kpi_id, :id, null: false
    end

    outputs do
      field :kpi, :kpi, null: false
    end

    def call(conn, inputs) do
      Action.new()
      |> run(:me, fn -> find_me(conn) end)
      |> run(:kpi, fn -> load_kpi(inputs.kpi_id) end)
      |> run(:space, fn ctx -> Group.get(ctx.me, id: ctx.kpi.space_id) end)
      |> run(:check_permissions, fn ctx -> Permissions.check(ctx.space.request_info.access_level, :can_view, company_read_only: company_read_only(conn)) end)
      |> run(:serialized, fn ctx -> {:ok, %{kpi: Serializer.serialize(ctx.kpi, level: :full)}} end)
      |> respond()
    end

    defp load_kpi(kpi_id) do
      case Kpis.get_kpi(kpi_id) do
        nil ->
          {:error, :not_found}

        kpi ->
          # Entries are ordered by period so the chart renders history in order.
          entries = Kpis.list_entries(kpi_id) |> Repo.preload(:recorded_by)
          {:ok, %{Repo.preload(kpi, [:champion, subscription_list: [subscriptions: :person]]) | entries: entries}}
      end
    end

    defp respond(result) do
      case result do
        {:ok, ctx} -> {:ok, ctx.serialized}
        {:error, :kpi, _} -> {:error, :not_found}
        {:error, :space, _} -> {:error, :not_found}
        {:error, :check_permissions, _} -> {:error, :forbidden}
        _ -> {:error, :internal_server_error}
      end
    end
  end

  defmodule CreateKpi do
    @moduledoc "Creates a KPI in a space. Any space member with edit access may create one."

    use TurboConnect.Mutation
    use OperatelyWeb.Api.Helpers

    inputs do
      field :space_id, :id, null: false
      field :name, :string, null: false
      field :unit, :string, null: false
      field :cadence, :string, null: false
      field? :champion_id, :id, null: true
      field? :description, :json, null: true
    end

    outputs do
      field :kpi, :kpi, null: false
    end

    def call(conn, inputs) do
      Action.new()
      |> run(:me, fn -> find_me(conn) end)
      |> run(:space, fn ctx -> Group.get(ctx.me, id: inputs.space_id) end)
      |> run(:check_permissions, fn ctx -> Permissions.check(ctx.space.request_info.access_level, :can_edit, company_read_only: company_read_only(conn)) end)
      |> run(:operation, fn ctx ->
        Kpis.create_kpi(ctx.me, %{
          space_id: ctx.space.id,
          name: inputs.name,
          unit: inputs.unit,
          cadence: inputs.cadence,
          champion_id: inputs[:champion_id],
          description: inputs[:description]
        })
      end)
      |> run(:serialized, fn ctx -> {:ok, %{kpi: Serializer.serialize(Repo.preload(ctx.operation, :champion), level: :essential)}} end)
      |> respond()
    end

    defp respond(result) do
      case result do
        {:ok, ctx} -> {:ok, ctx.serialized}
        {:error, :space, _} -> {:error, :not_found}
        {:error, :check_permissions, _} -> {:error, :forbidden}
        {:error, :operation, _} -> {:error, :bad_request}
        _ -> {:error, :internal_server_error}
      end
    end
  end

  defmodule EditKpi do
    @moduledoc "Edits a KPI. Any space member with edit access may edit one."

    use TurboConnect.Mutation
    use OperatelyWeb.Api.Helpers

    inputs do
      field :kpi_id, :id, null: false
      field? :name, :string, null: true
      field? :unit, :string, null: true
      field? :cadence, :string, null: true
      field? :champion_id, :id, null: true
      field? :description, :json, null: true
    end

    outputs do
      field :kpi, :kpi, null: false
    end

    def call(conn, inputs) do
      Action.new()
      |> run(:me, fn -> find_me(conn) end)
      |> run(:kpi, fn -> load_kpi(inputs.kpi_id) end)
      |> run(:space, fn ctx -> Group.get(ctx.me, id: ctx.kpi.space_id) end)
      |> run(:check_permissions, fn ctx -> Permissions.check(ctx.space.request_info.access_level, :can_edit, company_read_only: company_read_only(conn)) end)
      |> run(:operation, fn ctx -> Kpis.edit_kpi(ctx.me, ctx.kpi, edit_attrs(inputs)) end)
      |> run(:serialized, fn ctx -> {:ok, %{kpi: Serializer.serialize(Repo.preload(ctx.operation, :champion), level: :essential)}} end)
      |> respond()
    end

    defp load_kpi(kpi_id) do
      case Kpis.get_kpi(kpi_id) do
        nil -> {:error, :not_found}
        kpi -> {:ok, kpi}
      end
    end

    defp edit_attrs(inputs) do
      [:name, :unit, :cadence, :champion_id, :description]
      |> Enum.filter(&Map.has_key?(inputs, &1))
      |> Map.new(fn key -> {key, inputs[key]} end)
    end

    defp respond(result) do
      case result do
        {:ok, ctx} -> {:ok, ctx.serialized}
        {:error, :kpi, _} -> {:error, :not_found}
        {:error, :space, _} -> {:error, :not_found}
        {:error, :check_permissions, _} -> {:error, :forbidden}
        {:error, :operation, _} -> {:error, :bad_request}
        _ -> {:error, :internal_server_error}
      end
    end
  end

  defmodule DeleteKpi do
    @moduledoc "Deletes a KPI. Any space member with edit access may delete one."

    use TurboConnect.Mutation
    use OperatelyWeb.Api.Helpers

    inputs do
      field :kpi_id, :id, null: false
    end

    outputs do
      field :kpi, :kpi, null: false
    end

    def call(conn, inputs) do
      Action.new()
      |> run(:me, fn -> find_me(conn) end)
      |> run(:kpi, fn -> load_kpi(inputs.kpi_id) end)
      |> run(:space, fn ctx -> Group.get(ctx.me, id: ctx.kpi.space_id) end)
      |> run(:check_permissions, fn ctx -> Permissions.check(ctx.space.request_info.access_level, :can_edit, company_read_only: company_read_only(conn)) end)
      |> run(:operation, fn ctx -> Kpis.delete_kpi(ctx.me, ctx.kpi) end)
      |> run(:serialized, fn ctx -> {:ok, %{kpi: Serializer.serialize(ctx.operation, level: :essential)}} end)
      |> respond()
    end

    defp load_kpi(kpi_id) do
      case Kpis.get_kpi(kpi_id) do
        nil -> {:error, :not_found}
        kpi -> {:ok, kpi}
      end
    end

    defp respond(result) do
      case result do
        {:ok, ctx} -> {:ok, ctx.serialized}
        {:error, :kpi, _} -> {:error, :not_found}
        {:error, :space, _} -> {:error, :not_found}
        {:error, :check_permissions, _} -> {:error, :forbidden}
        {:error, :operation, _} -> {:error, :internal_server_error}
        _ -> {:error, :internal_server_error}
      end
    end
  end

  defmodule LogKpiEntry do
    @moduledoc "Logs a value for a KPI in a given period. Any space member with edit access may log."

    use TurboConnect.Mutation
    use OperatelyWeb.Api.Helpers

    inputs do
      field :kpi_id, :id, null: false
      field :value, :float, null: false
      field :period, :date, null: false
    end

    outputs do
      field :entry, :kpi_entry, null: false
    end

    def call(conn, inputs) do
      Action.new()
      |> run(:me, fn -> find_me(conn) end)
      |> run(:kpi, fn -> load_kpi(inputs.kpi_id) end)
      |> run(:space, fn ctx -> Group.get(ctx.me, id: ctx.kpi.space_id) end)
      |> run(:check_permissions, fn ctx -> Permissions.check(ctx.space.request_info.access_level, :can_edit, company_read_only: company_read_only(conn)) end)
      |> run(:operation, fn ctx ->
        Kpis.log_entry(ctx.me, ctx.kpi, %{value: inputs.value, period: inputs.period, recorded_by_id: ctx.me.id})
      end)
      |> run(:serialized, fn ctx -> {:ok, %{entry: Serializer.serialize(Repo.preload(ctx.operation, :recorded_by), level: :essential)}} end)
      |> respond()
    end

    defp load_kpi(kpi_id) do
      case Kpis.get_kpi(kpi_id) do
        nil -> {:error, :not_found}
        %Kpi{} = kpi -> {:ok, kpi}
      end
    end

    defp respond(result) do
      case result do
        {:ok, ctx} -> {:ok, ctx.serialized}
        {:error, :kpi, _} -> {:error, :not_found}
        {:error, :space, _} -> {:error, :not_found}
        {:error, :check_permissions, _} -> {:error, :forbidden}
        {:error, :operation, _} -> {:error, :bad_request}
        _ -> {:error, :internal_server_error}
      end
    end
  end
end
