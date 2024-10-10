defmodule TurboConnect.Plugs.ParseInputs do
  @moduledoc """
  Parses the request inputs and assigns them to the connection.
  """

  use Plug.Builder

  def init(_), do: []

  def call(conn, _opts) do
    params = atomize_keys(conn.params)

    inputs = conn.assigns.turbo_req_handler.__inputs__()
    types = conn.assigns.turbo_api.__types__()
    strict_parsing = conn.assigns.turbo_req_type == :mutation
    specs = {inputs, types}

    with {:ok, inputs} <- parse_inputs(specs, params, strict_parsing) do
      Plug.Conn.assign(conn, :turbo_inputs, inputs)
    else
      {:error, status, body} -> send_resp(conn, status, body) |> halt()
    end
  end

  def parse_inputs({inputs, types}, values, strict) do
    Enum.reduce(values, {:ok, %{}}, fn {name, value}, res ->
      with {:ok, res} <- res,
           {:ok, {field_name, type, _opts}} <- find_field(inputs.fields, name),
           {:ok, parsed} <- parse_input(type, types, value, strict) do
        {:ok, Map.put(res, field_name, parsed)}
      end
    end)
  end

  def find_field(fields, field_name) do
    case Enum.find(fields, fn {name, _, _} -> name == field_name end) do
      nil -> {:error, 400, "Unknown input field: #{field_name}"}
      field -> {:ok, field}
    end
  end

  #
  # Parsing basic types
  #

  def parse_input(:string, _types, value, _strict) when is_binary(value), do: {:ok, value}
  def parse_input(:string, _types, value, true) when is_nil(value), do: {:ok, nil}

  def parse_input(:boolean, _types, value, true) when is_boolean(value), do: {:ok, value}
  def parse_input(:boolean, _types, "true", false), do: {:ok, true}
  def parse_input(:boolean, _types, "false", false), do: {:ok, false}

  def parse_input(:integer, _types, value, true) when is_integer(value), do: {:ok, value}
  def parse_input(:integer, _types, value, false) do
    case Integer.parse(value) do
      {int, ""} -> {:ok, int}
      _ -> {:error, 422, "Invalid integer: #{value}"}
    end
  end

  def parse_input(:float, _types, value, true) when is_float(value), do: {:ok, value}
  def parse_input(:float, _types, value, true) when is_number(value), do: {:ok, value}
  def parse_input(:float, _types, value, false) do
    case Float.parse(value) do
      {float, ""} -> {:ok, float}
      _ -> {:error, 422, "Invalid float: #{value}"}
    end
  end

  def parse_input(:date, _types, value, _strict) when is_binary(value) do
    case Date.from_iso8601(value) do
      {:ok, date} -> {:ok, date}
      _ -> {:error, 422, "Invalid date: #{value}"}
    end
  end

  def parse_input(:datetime, _types, value, _strict) when is_binary(value) do
    case DateTime.from_iso8601(value) do
      {:ok, datetime} -> {:ok, datetime}
      _ -> {:error, 422, "Invalid datetime: #{value}"}
    end
  end

  def parse_input(:time, _types, value, _strict) when is_binary(value) do
    case Time.from_iso8601(value) do
      {:ok, time} -> {:ok, time}
      _ -> {:error, 422, "Invalid time: #{value}"}
    end
  end

  #
  # Parsing lists

  def parse_input({:list, _type}, _types, "", false) do
    # query params for empty lists are parsed by Plug.Conn as an empty string
    {:ok, []}
  end

  def parse_input({:list, type}, types, value, strict) when is_list(value) do
    Enum.reduce(value, {:ok, []}, fn v, res ->
      with {:ok, res} <- res,
           {:ok, parsed} <- parse_input(type, types, v, strict) do
        {:ok, [parsed | res]}
      end
    end)
    |> case do
      {:ok, res} -> {:ok, Enum.reverse(res)}
      {:error, status, body} -> {:error, status, body}
    end
  end

  def parse_input(_field , _types, nil, _strict) do
    {:ok, nil}
  end

  #
  # Complex types
  #

  def parse_input(type, types, value, strict) do
    cond do
      types.primitives[type] != nil ->
        primitive_type = types.primitives[type]
        decode_with = Keyword.get(primitive_type, :decode_with)

        case decode_with do
          nil -> {:error, 500, "Unknown decoder for primitive type: #{type}"}
          _ -> 
            case decode_with.(value) do
              {:ok, decoded} -> {:ok, decoded}
              {:error, reason} -> {:error, 422, reason}
            end
        end

      types.objects[type] != nil ->
        object_type = types.objects[type]

        Enum.reduce(value, {:ok, %{}}, fn {name, value}, res ->
          with {:ok, res} <- res,
               {:ok, {field_name, field_type, _opts}} <- find_field(object_type.fields, name),
               {:ok, parsed} <- parse_input(field_type, types, value, strict) do
            {:ok, Map.put(res, field_name, parsed)}
          end
        end)

      true ->
        {:error, 422, "Unknown input type: #{type}"}
    end
  end

  #
  # Utilities to convert string keys to atoms in conn.params
  #
  def atomize_keys(map) when is_map(map), do: Map.new(map, &atomize_keys/1)
  def atomize_keys(list) when is_list(list), do: Enum.map(list, &atomize_keys/1)

  def atomize_keys({key, val}) when is_binary(key), do: atomize_keys({String.to_existing_atom(key), val})

  def atomize_keys({key, val}), do: {key, atomize_keys(val)}
  def atomize_keys(term), do: term

end
