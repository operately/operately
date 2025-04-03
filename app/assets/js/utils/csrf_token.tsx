export default function csrftoken(): string | null {
  let element = document.querySelector("meta[name='csrf-token']");

  if (element) {
    return element.getAttribute("content");
  } else {
    return null;
  }
}
