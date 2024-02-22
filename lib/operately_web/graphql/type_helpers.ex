defmodule OperatelyWeb.Graphql.TypeHelpers do
  use Absinthe.Schema.Notation

  defmacro json_field(field_name, field_type) do
    quote do
      field unquote(field_name), unquote(field_type) do
        resolve fn db_record, _, _ ->
          db_field = Map.get(db_record, unquote(field_name))

          case db_field do
            nil -> {:ok, nil}
            _ -> {:ok, Jason.encode!(db_field)}
          end
        end
      end
    end
  end

  defmacro assoc_field(assoc_name, field_type) do
    quote do
      field unquote(assoc_name), unquote(field_type) do
        resolve fn db_record, _, _ ->
          assoc = Operately.Repo.preload(db_record, unquote(assoc_name))

          {:ok, assoc}
        end
      end
    end
  end
end
