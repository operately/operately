defmodule Mix.Tasks.Operately.Gen.Update.Type do
  #
  # Usage example:
  # mix operately.gen.update.type ProjectStartTimeChanged old_start_time:utc_datetime new_start_time:utc_datetime
  #
  def run([module_name | fields]) do
    fields = parse_fields(fields)

    gen_type_module(module_name, fields)
    gen_graphql_object_schema(module_name, fields)
    gen_graphql_client(module_name, fields)
  end

  def gen_type_module(module_name, fields) do
    snake_case_module_name = Macro.underscore(module_name)
    full_module_name = "Operately.Updates.Types.#{module_name}"
    path = Path.join(["lib", "operately", "updates", "types", "#{snake_case_module_name}.ex"])

    content = """
    defmodule #{full_module_name} do
      use Ecto.Schema
      import Ecto.Changeset

      @primary_key false
      embedded_schema do
        #{Enum.map(fields, &schema_field/1) |> Enum.join("\n") |> indent(4)}
      end

      def changeset(attrs) do
        %__MODULE__{}
        |> cast(attrs, __schema__(:fields))
        |> validate_required(__schema__(:fields))
      end
    end
    """

    IO.puts "Generated #{path}"
    File.write!(path, content)
  end

  def schema_field({field_name, field_type}) do
    "field :#{field_name}, :#{field_type}"
  end

  def parse_fields(fields) do
    Enum.map(fields, fn(field) ->
      field = String.split(field, ":")
      {Enum.at(field, 0), Enum.at(field, 1)}
    end)
  end
  
  def gen_graphql_object_schema(module_name, fields) do
    snake_case_module_name = Macro.underscore(module_name)
    full_object_name = "update_content_#{snake_case_module_name}"
    module_name = "UpdateContent#{module_name}"
    path = Path.join(["lib", "operately_web", "graphql", "types", "update_content_#{snake_case_module_name}.ex"])

    content = """
    defmodule OperatelyWeb.Graphql.Types.#{module_name} do
      use Absinthe.Schema.Notation

      object :#{full_object_name} do
        #{Enum.map(fields, &graphql_field/1) |> Enum.join("\n") |> indent(4)}
      end
    end
    """

    IO.puts "Generated #{path}"
    File.write!(path, content)
  end

  def graphql_field({field_name, field_type}) do
    """
    field :#{field_name}, #{graphql_type(field_type)} do
      resolve fn update, _, _ ->
        {:ok, update.content["#{field_name}"]}
      end
    end
    """
  end


  def indent(string, indent) do
    string
    |> String.split("\n")
    |> Enum.with_index()
    |> Enum.map(fn({line, index}) ->
      if index == 0 do
        line
      else
        String.duplicate(" ", indent) <> line
      end
    end)
    |> Enum.join("\n")
  end

  def ts_interface_field({field_name, field_type}) do
    field_name = camelize(field_name, false)

    "#{field_name}: #{ts_type(field_type)};"
  end


  def gen_graphql_client(module_name, fields) do
    content1 = """
    export interface #{module_name} {
      #{Enum.map(fields, &ts_interface_field/1) |> Enum.join("\n") |> indent(2)}
    }
    """

    content2 = """
    ... on UpdateContent#{module_name} {
      #{Enum.map(fields, &graphql_client_field/1) |> Enum.join("\n") |> indent(2)}
    }
    """
    
    IO.puts("Add this to assets/js/graphql/Projects/update_content.tsx")
    IO.puts(content1)
    IO.puts(content2)
  end

  def graphql_client_field({field_name, _}) do
    camelize(field_name, false)
  end

  def camelize(string, first_letter \\ true) do
    result = Macro.camelize(string)

    if first_letter do
      result
    else
      downcase_first_letter(result)
    end
  end

  defp downcase_first_letter(string) do
    String.downcase(String.at(string, 0)) <> String.slice(string, 1..-1)
  end

  # Types

  def graphql_type("utc_datetime"), do: "non_null(:string)"
  def graphql_type("string"), do: ":string"

  def ts_type("utc_datetime"), do: "non_null(:string)"
  def ts_type("string"), do: "string"

end
