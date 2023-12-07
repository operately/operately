defmodule OperatelyEmail.Views.UIComponents do
  import Phoenix.HTML.Tag, only: [content_tag: 3, content_tag: 2]

  def head(title) do
    """
      <head>
        <title>#{title}</title>
        <style>
          body {
            font-family: sans-serif;
            font-size: 16px;
          }

          h1 {
            font-size: 18px;
            margin-bottom: 20px;
            font-weight: bold;
          }
        </style>
      </head>
    """
  end

  def body(do: content) do
    safe_content do
      content_tag(:body, style: "padding: 10px 20px;") do
        content_tag(:table, style: "background: #fff; margin:0; padding:0; border:0; border-collapse:collapse; border-spacing:0; max-width: 40em") do
          {:safe, content}
        end
      end
    end
  end

  def cta_button(url, text) do
    safe_content do
      content_tag(:a, style: "display: inline-block; cursor: pointer; font-family: sans-serif; font-weight: 500; padding: 4px 12px; border: 2px solid #259b69; color: #259b69; border-radius: 16px; text-decoration: none;", href: url) do
        {:safe, text}
      end
    end
  end

  def title(text) do
    safe_content do
      content_tag(:tr, style: "font-size: 24px; font-family: sans-serif; font-weight: 800;") do
        content_tag(:td) do
          {:safe, text}
        end
      end
    end
  end

  def spacer do
    safe_content do
      content_tag(:tr, height: "18px") do
        content_tag(:td) do
          {:safe, "&nbsp;"}
        end
      end
    end
  end

  def row(do: content) do
    safe_content do
      content_tag(:tr) do
        content_tag(:td) do
          {:safe, content}
        end
      end
    end
  end

  def rich_text(content) do
    opts = [domain: OperatelyWeb.Endpoint.url()]

    Prosemirror2Html.convert(content, opts)
  end

  def safe_content(do: content) do
    content |> Phoenix.HTML.safe_to_string()
  end
end
