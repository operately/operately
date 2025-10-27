defmodule OperatelyWeb.EmailPreview.Definition do
  defmacro __using__(_) do
    quote do
      import OperatelyWeb.EmailPreview.Definition

      Module.register_attribute(__MODULE__, :preview_registry, accumulate: false, persist: true)
      Module.register_attribute(__MODULE__, :preview_current_email, accumulate: false)

      Module.put_attribute(__MODULE__, :preview_registry, [])
    end
  end

  defmacro email(slug, opts \\ [], do: block) do
    caller = __CALLER__
    __start_email__(caller.module, caller, slug, opts)

    quote do
      unquote(block)
      OperatelyWeb.EmailPreview.Definition.__end_email__(__MODULE__)
    end
  end

  defmacro preview(name, opts \\ []) do
    caller = __CALLER__
    {_path, _module, _function} = __register_preview__(caller.module, name, opts)

    quote do
      :ok
    end
  end

  def __start_email__(module, env, slug, opts) do
    if Module.get_attribute(module, :preview_current_email) do
      raise ArgumentError, "email/3 cannot be nested"
    end

    slug = normalize_slug(slug)
    label = Keyword.get(opts, :label, humanize(slug))
    preview_module = resolve_preview_module(module, env, slug, opts)

    email = %{
      slug: slug,
      email: label,
      module: preview_module,
      previews: []
    }

    Module.put_attribute(module, :preview_current_email, email)
  end

  def __register_preview__(module, name, opts) do
    current =
      Module.get_attribute(module, :preview_current_email) ||
        raise ArgumentError, "preview/2 must be defined inside a email/3 block"

    function = opts |> Keyword.get(:function, name) |> to_atom()
    label = Keyword.get(opts, :label, humanize(name))
    preview_slug = opts |> Keyword.get(:slug, name) |> normalize_slug()
    path = opts |> Keyword.get(:path, build_path(current.slug, preview_slug)) |> ensure_leading_slash()

    preview_entry = %{
      path: path,
      label: label,
      module: current.module,
      function: function
    }

    updated_previews = current.previews ++ [preview_entry]
    updated_email = %{current | previews: updated_previews}

    Module.put_attribute(module, :preview_current_email, updated_email)

    {path, current.module, function}
  end

  def __end_email__(module) do
    current =
      Module.get_attribute(module, :preview_current_email) ||
        raise ArgumentError, "email/3 block must wrap at least one preview/2 call"

    Module.delete_attribute(module, :preview_current_email)

    registry = Module.get_attribute(module, :preview_registry) || []
    entry = %{email: current.email, previews: current.previews}

    Module.put_attribute(module, :preview_registry, registry ++ [entry])
  end

  defp resolve_preview_module(module, env, slug, opts) do
    case Keyword.get(opts, :module) do
      nil ->
        Module.concat(module, slug |> slug_to_module_suffix())

      mod ->
        expanded = Macro.expand(mod, env)

        case Module.split(expanded) do
          [_single] -> Module.concat(module, expanded)
          _ -> expanded
        end
    end
  end

  defp slug_to_module_suffix(slug) do
    slug
    |> String.replace(~r/[_-]+/, " ")
    |> String.split(" ", trim: true)
    |> Enum.map(&String.capitalize/1)
    |> Enum.join()
  end

  defp humanize(value) do
    value
    |> to_string()
    |> String.replace(~r/[_-]+/, " ")
    |> String.split(" ", trim: true)
    |> Enum.map(&String.capitalize/1)
    |> Enum.join(" ")
  end

  defp normalize_slug(value) do
    value
    |> to_string()
    |> String.trim()
    |> String.trim_leading("/")
  end

  defp build_path(email_slug, preview_slug) do
    "/" <> email_slug <> "/" <> preview_slug
  end

  defp ensure_leading_slash(path) do
    case path do
      <<"/", _::binary>> -> path
      _ -> "/" <> path
    end
  end

  defp to_atom(value) when is_atom(value), do: value
  defp to_atom(value) when is_binary(value), do: String.to_atom(value)
end
