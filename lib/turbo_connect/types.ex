defmodule TurboConnect.Types do

  defmacro __using__(_) do
    quote do
      import TurboConnect.Types
      require TurboConnect.Types

      Module.register_attribute(__MODULE__, :objects, accumulate: true)
      Module.register_attribute(__MODULE__, :unions, accumulate: true)

      @before_compile unquote(__MODULE__)
    end
  end

  defmacro object(name, do: block) do
    quote do
      @scope unquote(name)
      unquote(block)
      @scope nil
    end
  end

  defmacro union(name, types: types) do
    quote do
      @unions {unquote(name), unquote(types)}
    end
  end

  defmacro field(name, type, opts \\ []) do
    quote do
      unless @scope do
        raise "field/2 must be called inside an object block"
      end

      @scope {@scope, unquote(name), unquote(type), unquote(opts)}
    end
  end

  def list_of(type) do
    {:list, type}
  end

  def primitive_types() do
    [
      :string,
      :integer,
      :float,
      :boolean,
      :date,
      :time,
      :datetime,
      :enum
    ]
  end

  defmacro __before_compile__(_) do
    quote do
      def get_specs() do
        alias TurboConnect.Types.Utils

        validate_specs()

        %{objects: Utils.definitions_to_map(@objects), unions: Enum.into(@unions, %{})}
      end

      def validate_specs() do
        alias TurboConnect.Types.Utils

        map = Utils.definitions_to_map(@objects)

        object_names = Map.keys(map)
        union_names = Map.keys(Enum.into(@unions, %{}))
        known_types = primitive_types() ++ object_names ++ union_names

        Enum.each(map, fn {object_name, object} ->
          Enum.each(object.fields, fn field ->
            case Utils.validate_field_type(known_types, field.type) do
              {:ok, _} -> :ok
              {:error, type} -> Utils.raise_unknown_field_type(object_name, field.name, type)
            end
          end)
        end)
      end
    end
  end

  defmodule UnknownFieldType do
    defexception message: "Undefined object"
  end

  defmodule Utils do
    #
    # Converts a list of the form [{object, field_name, field_type, field_opts}] into a map
    # where the keys are the object names and the values are maps with the fields.
    #
    # Example:
    #
    # [
    #   {:user, :name, :string, []},
    #   {:user, :age, :integer, []},
    #   {:post, :title, :string, []},
    #   {:post, :content, :string, []}
    # ]
    #
    # Will be converted to:
    #
    # %{
    #   user: %{
    #     fields: [
    #       %{name: :name, type: :string, opts: []},
    #       %{name: :age, type: :integer, opts: []}
    #     ]
    #   },
    #   post: %{
    #     fields: [
    #       %{name: :title, type: :string, opts: []},
    #       %{name: :content, type: :string, opts: []}
    #     ]
    #   }
    # }
    #
    def definitions_to_map(objects) do
      objects
      |> Enum.group_by(&elem(&1, 0))
      |> Enum.map(fn {object, fields} ->
        object_fields = fields |> Enum.reverse() |> Enum.map(fn {_, name, type, opts} -> encode_field(name, type, opts) end)

        {object, %{fields: object_fields}}
      end)
      |> Enum.into(%{})
    end

    def encode_field(name, {:list, type}, opts) when is_atom(type) do
      %{name: name, type: {:list, type}, opts: opts}
    end

    def encode_field(name, {:one_of, types}, opts) when is_list(types) do
      %{name: name, type: {:one_of, types}, opts: opts}
    end

    def encode_field(name, type, opts) when is_atom(type) do
      %{name: name, type: type, opts: opts}
    end

    def encode_field(_, _, _) do
      raise "Invalid field type"
    end

    def validate_field_type(known_types, {:list, type}) when is_atom(type) do 
      validate_field_type(known_types, type)
    end

    def validate_field_type(known_types, {:one_of, types}) when is_list(types) do
      unknown = Enum.find(types, fn type -> type not in known_types end)

      if unknown do
        {:error, unknown}
      else
        {:ok, types}
      end
    end

    def validate_field_type(known_types, type) when is_atom(type) do
      if type in known_types do
        {:ok, type}
      else
        {:error, type}
      end
    end

    def validate_field_type(_, type) do
      {:error, type}
    end

    def raise_unknown_field_type(object_name, field_name, field_type) do
      message = "In object :#{object_name}, the :#{field_name} field has an unknown type :#{field_type}"

      raise TurboConnect.Types.UnknownFieldType, message: message
    end
  end
end
