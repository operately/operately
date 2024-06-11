defmodule TurboConnect.Plugs.ParseInputs do
  @moduledoc """
  Parses the request inputs and assigns them to the connection.
  """

  use Plug.Builder

  def init(_), do: []

  def call(conn, _opts) do
    conn = Plug.Conn.fetch_query_params(conn)

    inputs = conn.assigns.turbo_req_handler.__inputs__()
    types = conn.assigns.turbo_api.__types__()
    unions = types.unions
    strict_parsing = conn.assigns.turbo_req_type == :mutation
    specs = {inputs, types, unions}

    with {:ok, map} <- get_inputs_as_map(conn), {:ok, inputs} <- parse_inputs(specs, map, strict_parsing) do
      Plug.Conn.assign(conn, :turbo_inputs, inputs)
    else
      {:error, status, body} -> send_resp(conn, status, body) |> halt()
    end
  end

  defp get_inputs_as_map(conn) do
    case conn.assigns.turbo_req_type do
      :query -> 
        {:ok, Jason.encode!(conn.query_params) |> Jason.decode!(keys: :atoms)}
      :mutation -> 
        {:ok, Jason.encode!(conn.query_params) |> Jason.decode!(keys: :atoms)}
    end
  rescue
    _ -> {:error, 400, "Could not parse inputs"}
  end

  def parse_inputs({inputs, types, unions}, values, strict) do
    Enum.reduce(values, {:ok, %{}}, fn {name, value}, res ->
      with {:ok, res} <- res,
           {:ok, {field_name, type, _opts}} <- find_field(inputs.fields, name),
           {:ok, parsed} <- parse_input(type, types, unions, value, strict) do
        {:ok, Map.put(res, field_name, parsed)}
      end
    end)
  end

  def find_field(fields, field_name) do
    case Enum.find(fields, fn {name, _, _} -> name == field_name end) do
      nil -> {:error, 400, "Field not found: #{field_name}"}
      field -> {:ok, field}
    end
  end

  def parse_input(:string, _types, _unions, value, _strict) when is_binary(value), do: {:ok, value}

  def parse_input({:list, _type}, _types, _unions, "", false) do
    # query params for empty lists are parsed by Plug.Conn as an empty string
    {:ok, []}
  end

  def parse_input({:list, type}, types, unions, value, strict) when is_list(value) do
    Enum.reduce(value, {:ok, []}, fn v, res ->
      with {:ok, res} <- res, 
           {:ok, parsed} <- parse_input(type, types, unions, v, strict) do
        {:ok, [parsed | res]}
      end
    end)
    |> case do
      {:ok, res} -> {:ok, Enum.reverse(res)}
      {:error, status, body} -> {:error, status, body}
    end
  end

  def parse_input(:integet, _types, _unions, _value, _strict), do: {:error, 422, "Integer parsing not implemented"}
  def parse_input(:float, _types, _unions, _value, _strict), do: {:error, 422, "Float parsing not implemented"}
  def parse_input(:boolean, _types, _unions, _value, _strict), do: {:error, 422, "Boolean parsing not implemented"}
  def parse_input(:date, _types, _unions, _value, _strict), do: {:error, 422, "Date parsing not implemented"}
  def parse_input(:time, _types, _unions, _value, _string), do: {:error, 422, "Time parsing not implemented"}
  def parse_input(:datetime, _types, _unions, _value, _string), do: {:error, 422, "Datetime parsing not implemented"}
  def parse_input(type, _types, _unions, _value, _string), do: {:error, 422, "Type handler not implemented for #{inspect(type)}"}
end
