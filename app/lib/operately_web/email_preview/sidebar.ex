defmodule OperatelyWeb.EmailPreview.Sidebar do
  @moduledoc """
  Renders the sidebar navigation for email previews.
  """

  import Plug.HTML, only: [html_escape: 1]

  def render(email_body, current_path, preview_registry) do
    email_content = render_email_content(email_body)
    page_title = page_title(current_path, preview_registry)

    """
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>#{page_title}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body { height: 100% !important; margin: 0; padding: 0 !important; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; display: flex; }
        .sidebar { width: 280px; background: #f8f9fa; border-right: 1px solid #dee2e6; overflow-y: auto; flex-shrink: 0; }
        .sidebar-header { padding: 20px; border-bottom: 1px solid #dee2e6; }
        .sidebar-header h1 { font-size: 18px; font-weight: 600; color: #212529; }
        .sidebar-nav { padding: 12px 0; }
        .sidebar-email { padding: 16px 20px 8px 20px; font-weight: 600; font-size: 13px; color: #6c757d; text-transform: uppercase; letter-spacing: 0.5px; line-height: 1.6; }
        .sidebar-link { display: block; padding: 8px 20px 8px 36px; color: #495057; text-decoration: none; font-size: 14px; transition: background 0.15s; line-height: 2; }
        .sidebar-link:hover { background: #e9ecef; }
        .sidebar-link.active { background: #007bff; color: white; font-weight: 500; scroll-margin-block: 24px; }
        .content { flex: 1; overflow: hidden; background: #ffffff; display: flex; }
        .email-container { flex: 1; overflow-y: auto; padding: 40px 20px; display: flex; justify-content: center; }
        .email-frame { width: 100%; max-width: 800px; min-height: 100vh; border: none; display: block; background: #ffffff; }
        .email-placeholder { width: 100%; max-width: 800px; min-height: 100vh; background: #ffffff; }
      </style>
    </head>
    <body>
      <div class="sidebar">
        <div class="sidebar-header">
          <h1>Email Previews</h1>
        </div>
        <nav class="sidebar-nav">
          #{render_links(current_path, preview_registry)}
        </nav>
      </div>
      <div class="content">
        <div class="email-container">
          #{email_content}
        </div>
      </div>
      <script>
        window.addEventListener("load", function () {
          var activeLink = document.querySelector(".sidebar-link.active");

          if (activeLink) {
            activeLink.scrollIntoView({ block: "center", inline: "nearest" });
          }
        });
      </script>
    </body>
    </html>
    """
  end

  defp render_links(current_path, preview_registry) do
    normalized_path = normalize_path(current_path)

    preview_registry
    |> Enum.map(fn group ->
      group_html = "<div class=\"sidebar-email\">#{group.label}</div>"

      previews_html =
        group.previews
        |> Enum.map(fn preview ->
          active_class = if preview.path == normalized_path, do: " active", else: ""
          aria_current = if preview.path == normalized_path, do: " aria-current=\"page\"", else: ""
          "<a href=\"/dev/emails#{preview.path}\" class=\"sidebar-link#{active_class}\"#{aria_current}>#{preview.label}</a>"
        end)
        |> Enum.join("\n          ")

      group_html <> "\n          " <> previews_html
    end)
    |> Enum.join("\n          ")
  end

  defp render_email_content(nil), do: placeholder()
  defp render_email_content(""), do: placeholder()

  defp render_email_content(email_body) do
    escaped = email_body |> html_escape() |> IO.iodata_to_binary()
    ~s(<iframe class="email-frame" srcdoc="#{escaped}"></iframe>)
  end

  defp placeholder do
    ~s(<div class="email-placeholder"></div>)
  end

  defp page_title(current_path, preview_registry) do
    case current_preview_label(current_path, preview_registry) do
      nil -> "Email Preview"
      label -> "#{label} · Email Preview"
    end
  end

  defp current_preview_label(current_path, preview_registry) do
    normalized_path = normalize_path(current_path)

    preview_registry
    |> Enum.flat_map(& &1.previews)
    |> Enum.find_value(fn preview ->
      if preview.path == normalized_path, do: preview.label
    end)
  end

  defp normalize_path(current_path) do
    String.replace_prefix(current_path, "/dev/emails", "")
  end
end
