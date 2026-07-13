defmodule TurboConnect.Types do
  defmacro __using__(_) do
    quote do
      use TurboConnect.Fields

      import TurboConnect.Types

      Module.register_attribute(__MODULE__, :unions, accumulate: true)
      Module.register_attribute(__MODULE__, :primitives, accumulate: true)
      Module.register_attribute(__MODULE__, :enums, accumulate: true)
      Module.register_attribute(__MODULE__, :int_enums, accumulate: true)
      Module.register_attribute(__MODULE__, :object_modules, accumulate: true)
      Module.register_attribute(__MODULE__, :object_typenames, accumulate: true)

      @before_compile unquote(__MODULE__)
    end
  end

  defmacro primitive(name, opts) do
    quote do
      @primitives {unquote(name), unquote(opts)}
    end
  end

  @doc """
  Defines an API object.

  ## Options

    * `:for` - Elixir module (or list of modules) that serialize to this object.
      When present, injects a `__typename` field whose value is
      `TurboConnect.TypeNames.resolve/1` for the linked module(s).

  ## Name

  The object name may be given explicitly, or omitted when `:for` points to a
  single module — then the name is derived via `default_name_for_module/1`.
  The object name is independent of `__typename` (interface name vs discriminator).

      object :project, for: Operately.Projects.Project do
        field :id, :string
      end

      object for: Operately.Projects.Project do
        # name becomes :project
        field :id, :string
      end

      object :space, for: Operately.Groups.Group do
        # interface name stays :space; __typename from Group (possibly overridden)
        field :id, :string
      end
  """
  defmacro object(opts, do: block) when is_list(opts) do
    modules = expand_for(Keyword.get(opts, :for), __CALLER__)

    name =
      case modules do
        [mod] -> String.to_atom(default_name_for_module(mod))
        [] -> raise ArgumentError, "object/1 with a keyword list requires for: Module"
        _ -> raise ArgumentError, "object for: [modules...] requires an explicit name, e.g. object :name, for: [Mod1, Mod2]"
      end

    define_object(name, Keyword.put(opts, :for, modules), block)
  end

  defmacro object(name, opts \\ [], do: block) when is_atom(name) do
    opts =
      case Keyword.fetch(opts, :for) do
        :error -> opts
        {:ok, for_value} -> Keyword.put(opts, :for, expand_for(for_value, __CALLER__))
      end

    define_object(name, opts, block)
  end

  defmacro union(name, types: types) do
    quote do
      @unions {unquote(name), unquote(types)}
    end
  end

  defmacro enum(name, values: values) do
    quote do
      @enums {unquote(name), unquote(values)}
    end
  end

  defmacro int_enum(name, values: values) do
    quote do
      @int_enums {unquote(name), unquote(values)}
    end
  end

  @doc """
  Default TurboConnect object name for an Elixir module.

  - `Operately.Activities.Content.Foo.Bar` → `"activity_content_foo_bar"`
  - `Operately.Projects.Project` → `"project"`
  """
  def default_name_for_module(mod) when is_atom(mod) do
    TurboConnect.TypeNames.default_name_for_module(mod)
  end

  defmacro __before_compile__(_) do
    quote do
      def __primitives__(), do: Enum.reverse(@primitives) |> Enum.into(%{})

      def __objects__() do
        typenames =
          Enum.reduce(Enum.reverse(@object_typenames), %{}, fn {name, modules}, acc ->
            Map.put(acc, name, TurboConnect.Types.resolved_typename!(name, modules))
          end)

        Map.new(__fields__(), fn {name, data} ->
          case Map.fetch(typenames, name) do
            {:ok, typename} -> {name, Map.put(data, :typename, typename)}
            :error -> {name, data}
          end
        end)
      end

      def __unions__(), do: Enum.reverse(@unions) |> Enum.into(%{})
      def __enums__(), do: Enum.reverse(@enums) |> Enum.into(%{})
      def __int_enums__(), do: Enum.reverse(@int_enums) |> Enum.into(%{})

      def __object_modules__() do
        Enum.reduce(Enum.reverse(@object_modules), %{}, fn {mod, object_name}, acc ->
          typename = TurboConnect.TypeNames.resolve(mod)

          case Map.fetch(acc, mod) do
            :error ->
              Map.put(acc, mod, typename)

            {:ok, ^typename} ->
              acc

            {:ok, other} ->
              raise ArgumentError,
                    "#{inspect(mod)} is registered for both \"#{other}\" and \"#{typename}\" via object :#{object_name}"
          end
        end)
      end
    end
  end

  @doc false
  def resolved_typename!(name, modules) do
    typenames = Enum.map(modules, &TurboConnect.TypeNames.resolve/1)
    typename = hd(typenames)

    unless Enum.all?(typenames, &(&1 == typename)) do
      divergences = Enum.zip(modules, typenames)

      raise ArgumentError,
            "object :#{name} for: modules resolve to divergent __typename values: #{inspect(divergences)}"
    end

    typename
  end

  defp define_object(name, opts, block) do
    modules = List.wrap(Keyword.get(opts, :for))

    quote do
      unquote(register_for_modules(name, modules))

      @field_scope unquote(name)

      unquote(
        unless modules == [] do
          quote do
            field :__typename, :string, null: false
          end
        end
      )

      unquote(block)
      @field_scope nil
    end
  end

  defp register_for_modules(_name, []), do: nil

  defp register_for_modules(name, modules) do
    registrations =
      Enum.map(modules, fn mod ->
        quote do
          @object_modules {unquote(mod), unquote(name)}
        end
      end)

    quote do
      @object_typenames {unquote(name), unquote(modules)}
      unquote_splicing(registrations)
    end
  end

  defp expand_for(nil, _env), do: []

  defp expand_for(mods, env) when is_list(mods) do
    Enum.map(mods, &expand_module(&1, env))
  end

  defp expand_for(mod, env) do
    [expand_module(mod, env)]
  end

  defp expand_module(mod, env) do
    expanded = Macro.expand(mod, env)

    unless is_atom(expanded) and not is_nil(expanded) do
      raise ArgumentError, "object for: expected a module, got: #{Macro.to_string(mod)}"
    end

    expanded
  end
end
