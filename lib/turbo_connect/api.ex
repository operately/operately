defmodule TurboConnect.Api do

  defmacro __using__(_) do
    quote do
      import TurboConnect.Api
      require TurboConnect.Api

      Module.register_attribute(__MODULE__, :typemodules, accumulate: true)
      Module.register_attribute(__MODULE__, :queries, accumulate: true)

      @before_compile unquote(__MODULE__)

      import Plug.Conn
      require Logger

      def init(opts) do
        opts
      end

      def call(conn, opts) do
        case conn.method do
          "GET" -> get(conn, opts)
          _ -> send_resp(conn, 405, "Method Not Allowed")
        end
      rescue
        e -> handle_error(conn, e)
      end

      defp get(conn, opts) do
        with {:ok, name} <- find_query_name(conn),
             {:ok, query} <- find_query(name),
             {:ok, result} <- query.handler.call(conn) do
          send_resp(conn, 200, Jason.encode!(result))
        else
          e -> handle_error(conn, e)
        end
      end

      defp find_query_name(conn) do
        case conn.path_info do
          [] -> {:error, 400, "Missing query name"}
          [name] -> {:ok, String.to_existing_atom(name)}
          _ -> {:error, 400, "Invalid query name"}
        end
      rescue
        e -> {:error, 404, "Uknown query"}
      end

      defp find_query(name) do
        case Map.get(__queries__(), name) do
          nil -> {:error, 404, "Query not found"}
          query -> {:ok, query}
        end
      end

      defp handle_error(conn, {:error, 400, message}) do
        Logger.info("HTTP 400: #{message}")
        send_resp(conn, 400, "Bad Request")
      end

      defp handle_error(conn, {:error, 404, message}) do
        Logger.info("HTTP 404: #{message}")
        send_resp(conn, 404, "Not Found")
      end

      defp handle_error(conn, e) do
        Logger.error("HTTP 500: #{inspect(e)}")
        send_resp(conn, 500, "Internal Server Error")
      end
    end
  end

  defmacro use_types(module) do
    quote do
      @typemodules unquote(module)
    end
  end

  defmacro query(name, module) do
    quote do
      @queries {unquote(name), unquote(module)}
    end
  end

  defmacro __before_compile__(_) do
    quote do
      def __types__() do
        Enum.reduce(@typemodules, %{objects: %{}, unions: %{}}, fn module, acc ->
          objects = apply(module, :__objects__, [])
          unions = apply(module, :__unions__, [])

          objects = Map.merge(acc.objects, objects)
          unions = Map.merge(acc.unions, unions)

          %{objects: objects, unions: unions}
        end)
      end

      def __queries__() do
        Enum.map(@queries, fn {name, module} ->
          {name, %{inputs: module.__inputs__(), outputs: module.__outputs__(), handler: module}}
        end)
        |> Enum.into(%{})
      end
    end
  end

end
