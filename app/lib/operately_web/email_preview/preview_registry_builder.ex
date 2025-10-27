defmodule OperatelyWeb.EmailPreview.PreviewRegistryBuilder do
  def build_registry(previews, base_module) do
    previews
    |> Enum.group_by(& &1.group_slug)
    |> Enum.map(fn {_slug, group_previews} ->
      build_group(group_previews, base_module)
    end)
  end

  defp build_group([first | _] = previews, base_module) do
    %{
      label: get_label(first.group_opts, first.group_slug),
      previews: Enum.map(previews, &build_preview(&1, base_module))
    }
  end

  defp build_preview(preview, base_module) do
    %{
      path: resolve_path(preview),
      label: get_label(preview.opts, preview.name),
      module: resolve_module(base_module, preview),
      function: Keyword.get(preview.opts, :function, preview.name)
    }
  end

  defp resolve_path(preview) do
    preview_slug = preview.opts |> Keyword.get(:slug, preview.name) |> normalize_slug()

    preview.opts
    |> Keyword.get(:path, build_path(preview.group_slug, preview_slug))
    |> ensure_leading_slash()
  end

  defp resolve_module(base_module, preview) do
    case Keyword.get(preview.opts, :module) || Keyword.get(preview.group_opts, :module) do
      nil ->
        Module.concat(base_module, slug_to_module_suffix(preview.group_slug))

      mod when is_atom(mod) ->
        case Module.split(mod) do
          [_single] -> Module.concat(base_module, mod)
          _ -> mod
        end

      mod when is_binary(mod) ->
        Module.concat(base_module, mod)
    end
  end

  defp get_label(opts, fallback) do
    Keyword.get(opts, :label, humanize(fallback))
  end

  defp slug_to_module_suffix(slug) do
    slug
    |> to_string()
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

  defp build_path(group_slug, preview_slug) do
    "/" <> normalize_slug(group_slug) <> "/" <> normalize_slug(preview_slug)
  end

  defp ensure_leading_slash(path) do
    case path do
      <<"/", _::binary>> -> path
      _ -> "/" <> path
    end
  end
end
