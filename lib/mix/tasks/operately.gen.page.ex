defmodule Mix.Tasks.Operately.Gen.Page do
  def run([name]) do
    page_name = Macro.camelize(name) <> "Page"

    generate_loader(page_name)
    generate_index(page_name)
  end

  def generate_index(page_name) do
    IO.puts "Generating assets/js/pages/#{page_name}/index.tsx"

    content = """
    export { loader } from "./loader";
    export { Page } from "./page";
    """

    File.write("assets/js/pages/#{page_name}/index.tsx", content)
  end

  def generate_loader(page_name) do
    IO.puts "Generating assets/js/pages/#{page_name}/loader.tsx"

    content = """
    import * as Paper from "@/components/PaperContainer";

    export interface LoaderResult {
    }

    export async function loader() : Promise<LoaderResult> {
      // TODO: Implement

      return {}
    }

    export function useLoadedData() : LoaderResult {
      const [data, _] = Paper.useLoadedData() as [LoaderResult, () => void];

      return data;
    }
    """

    File.write("assets/js/pages/#{page_name}/loader.tsx", content)
  end

  def generate_page(page_name) do
    IO.puts "Generating assets/js/pages/#{page_name}/page.tsx"
    
    content = """
    import * as React from "react";
    import * as Paper from "@/components/PaperContainer";

    import { useLoadedData } from "./loader";
    
    export function Page() {
      const data = useLoadedData();

      useDocumentTitle("#{page_name}");
    
      return (
        <Paper.Root>
          <Paper.Body>
            <h1>#{page_name}</h1>
          </Paper.Body>
        </Paper.Root>
      );
    }
    """

    File.write("assets/js/pages/#{page_name}/page.tsx", content)
  end
end
