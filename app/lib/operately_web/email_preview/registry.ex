defmodule OperatelyWeb.EmailPreview.Registry do
  alias OperatelyWeb.EmailPreview.PreviewRegistryBuilder

  defmacro __using__(_) do
    quote do
      import OperatelyWeb.EmailPreview.Registry

      Module.register_attribute(__MODULE__, :preview_groups, accumulate: true)
      Module.register_attribute(__MODULE__, :current_group, accumulate: false)

      @before_compile unquote(__MODULE__)
    end
  end

  defmacro group(slug, opts \\ [], do: block) do
    quote do
      @current_group {unquote(slug), unquote(opts)}
      unquote(block)
      @current_group nil
    end
  end

  defmacro preview(name, opts \\ []) do
    quote do
      unless @current_group do
        raise ArgumentError, "preview/2 must be defined inside a group/3 block"
      end

      {group_slug, group_opts} = @current_group

      @preview_groups %{
        group_slug: group_slug,
        group_opts: group_opts,
        name: unquote(name),
        opts: unquote(opts)
      }
    end
  end

  defmacro __before_compile__(_env) do
    quote do
      def __preview_registry__() do
        @preview_groups
        |> Enum.reverse()
        |> PreviewRegistryBuilder.build_registry(__MODULE__)
      end
    end
  end
end
