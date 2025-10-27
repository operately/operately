defmodule OperatelyWeb.EmailPreview.Sidebar do
  @moduledoc """
  Renders the sidebar navigation for email previews.
  """

  def render(email_body, current_path, preview_registry) do
    """
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Email Preview</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body { height: 100% !important; margin: 0; padding: 0 !important; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; display: flex; }
        .sidebar { width: 280px; background: #f8f9fa; border-right: 1px solid #dee2e6; overflow-y: auto; flex-shrink: 0; }
        .sidebar-header { padding: 20px; border-bottom: 1px solid #dee2e6; }
        .sidebar-header h1 { font-size: 18px; font-weight: 600; color: #212529; }
        .sidebar-nav { padding: 12px 0; }
        .sidebar-email { padding: 16px 20px 8px 20px; font-weight: 600; font-size: 13px; color: #6c757d; text-transform: uppercase; letter-spacing: 0.5px; }
        .sidebar-link { display: block; padding: 8px 20px 8px 36px; color: #495057; text-decoration: none; font-size: 14px; transition: background 0.15s; }
        .sidebar-link:hover { background: #e9ecef; }
        .sidebar-link.active { background: #007bff; color: white; font-weight: 500; }
        .content { flex: 1; overflow-y: auto; background: #ffffff; }
        .email-container { max-width: 800px; margin: 0 auto; padding: 40px 20px; }
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
          #{email_body}
        </div>
      </div>
    </body>
    </html>
    """
  end

  defp render_links(current_path, preview_registry) do
    # Strip the /dev/emails prefix from current_path for comparison
    normalized_path = String.replace_prefix(current_path, "/dev/emails", "")

    preview_registry
    |> Enum.map(fn group ->
      group_html = "<div class=\"sidebar-email\">#{group.label}</div>"

      previews_html =
        group.previews
        |> Enum.map(fn preview ->
          active_class = if preview.path == normalized_path, do: " active", else: ""
          "<a href=\"/dev/emails#{preview.path}\" class=\"sidebar-link#{active_class}\">#{preview.label}</a>"
        end)
        |> Enum.join("\n          ")

      group_html <> "\n          " <> previews_html
    end)
    |> Enum.join("\n          ")
  end
end
